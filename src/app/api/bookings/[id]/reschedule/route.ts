import { apiError, apiSuccess } from "@/lib/api";
import { bookingInputSchema } from "@/lib/validation";
import { getOrganizationBySlug } from "@/services/organizations";
import { rescheduleBooking } from "@/services/bookings";
import { AppointmentStatusEmail } from "@/emails/status";
import {
  bookingLinks,
  cancelReminders,
  emailSubject,
  formatAppointmentDate,
  formatTimeLabel,
  scheduleReminders,
  sendEmail,
} from "@/services/notifications";
import { createClient } from "@/lib/supabase/server";
import type { Organization, Profile, Service } from "@/types/domain";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const input = bookingInputSchema.parse(await request.json());
    const booking = await rescheduleBooking({ appointmentId: id, ...input });
    await cancelReminders(id);

    const org = await getOrganizationBySlug(booking.org_slug);
    if (org) {
      try {
        const supabase = await createClient();
        const [serviceRes, profileRes] = await Promise.all([
          supabase.from("services").select("*").eq("id", booking.service_id).maybeSingle(),
          supabase.from("profiles").select("*").eq("id", (await supabase.auth.getUser()).data.user?.id ?? "").maybeSingle(),
        ]);
        const service = serviceRes.data as Service | null;
        const profile = profileRes.data as Profile | null;
        const links = bookingLinks(org.slug, booking.appointment_id);
        if (profile?.email) {
          await sendEmail({
            to: profile.email,
            subject: emailSubject("RESCHEDULE", org.name, booking.token_number),
            react: AppointmentStatusEmail({
              customerName: profile.full_name || profile.email,
              organizationName: org.name,
              serviceName: service?.name ?? "Service",
              date: formatAppointmentDate(booking.appointment_date, booking.timezone),
              time: formatTimeLabel(booking.start_time, booking.end_time),
              tokenNumber: booking.token_number,
              event: "rescheduled",
              actionUrl: links.ticketUrl,
              actionLabel: "View new QR ticket",
            }),
            orgId: org.id,
            appointmentId: booking.appointment_id,
            userId: profile.id,
            eventType: "RESCHEDULE",
          });
          await scheduleReminders({
            booking,
            org: org as Organization,
            customerEmail: profile.email,
            customerName: profile.full_name || profile.email,
            customerId: profile.id,
            serviceName: service?.name ?? "Service",
          });
        }
      } catch (error) {
        console.error("[TokenFlow] Reschedule notification failed", error);
      }
    }

    return apiSuccess({ booking });
  } catch (error) {
    return apiError(error);
  }
}
