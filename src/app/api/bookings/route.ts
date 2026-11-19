import { apiError, apiSuccess } from "@/lib/api";
import { bookingInputSchema } from "@/lib/validation";
import { createClient } from "@/lib/supabase/server";
import { createBooking } from "@/services/bookings";
import { getOrganizationBySlug } from "@/services/organizations";
import { BookingConfirmationEmail } from "@/emails/booking";
import {
  bookingLinks,
  emailSubject,
  formatAppointmentDate,
  formatTimeLabel,
  scheduleReminders,
  sendEmail,
} from "@/services/notifications";
import type { Organization, Profile, Service, Branch } from "@/types/domain";

export async function POST(request: Request) {
  try {
    const input = bookingInputSchema.parse(await request.json());
    const booking = await createBooking(input);
    const org = await getOrganizationBySlug(booking.org_slug);

    // Notifications are best-effort: the booking itself is already committed.
    if (org) {
      try {
        const supabase = await createClient();
        const [serviceRes, branchRes, profileRes] = await Promise.all([
          supabase.from("services").select("*").eq("id", booking.service_id).maybeSingle(),
          supabase.from("branches").select("*").eq("id", booking.branch_id).maybeSingle(),
          supabase.from("profiles").select("*").eq("id", (await supabase.auth.getUser()).data.user?.id ?? "").maybeSingle(),
        ]);
        const service = serviceRes.data as Service | null;
        const branch = branchRes.data as Branch | null;
        const profile = profileRes.data as Profile | null;
        const links = bookingLinks(org.slug, booking.appointment_id);
        const customerName = profile?.full_name || profile?.email || "there";
        const date = formatAppointmentDate(booking.appointment_date, booking.timezone);
        const time = formatTimeLabel(booking.start_time, booking.end_time);

        if (profile?.email) {
          await sendEmail({
            to: profile.email,
            subject: emailSubject("BOOKING_CONFIRMATION", org.name, booking.token_number),
            react: BookingConfirmationEmail({
              customerName,
              organizationName: org.name,
              serviceName: service?.name ?? "Service",
              date,
              time,
              tokenNumber: booking.token_number,
              branchName: branch?.name ?? undefined,
              dashboardUrl: links.dashboardUrl,
              ticketUrl: links.ticketUrl,
            }),
            orgId: org.id,
            appointmentId: booking.appointment_id,
            userId: profile.id,
            eventType: "BOOKING_CONFIRMATION",
            metadata: { token_number: booking.token_number },
          });

          await scheduleReminders({
            booking,
            org: org as Organization,
            customerEmail: profile.email,
            customerName,
            customerId: profile.id,
            serviceName: service?.name ?? "Service",
            branchName: branch?.name ?? undefined,
          });
        }
      } catch (notificationError) {
        console.error("[TokenFlow] Booking notification failed", notificationError);
      }
    }

    return apiSuccess({ booking }, 201);
  } catch (error) {
    return apiError(error);
  }
}
