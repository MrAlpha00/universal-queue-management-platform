import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { cancelBooking } from "@/services/bookings";
import { AppointmentStatusEmail } from "@/emails/status";
import {
  bookingLinks,
  cancelReminders,
  emailSubject,
  formatAppointmentDate,
  formatTimeLabel,
  sendEmail,
} from "@/services/notifications";
import type { Organization, Profile, Service } from "@/types/domain";

const schema = z.object({ reason: z.string().max(500).optional() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = schema.parse(await request.json().catch(() => ({})));
    const result = await cancelBooking(id, body.reason);
    await cancelReminders(id);

    try {
      const supabase = await createClient();
      const [orgRes, serviceRes, profileRes, tokenRes] = await Promise.all([
        supabase.from("organizations").select("*").eq("id", result.org_id).maybeSingle(),
        supabase.from("services").select("*").eq("id", (await supabase.from("appointments").select("service_id").eq("id", id).maybeSingle()).data?.service_id ?? "").maybeSingle(),
        supabase.from("profiles").select("*").eq("id", result.customer_id).maybeSingle(),
        supabase.from("tokens").select("token_number").eq("appointment_id", id).maybeSingle(),
      ]);
      const org = orgRes.data as Organization | null;
      const service = serviceRes.data as Service | null;
      const profile = profileRes.data as Profile | null;
      if (org && profile?.email) {
        const links = bookingLinks(org.slug, id);
        await sendEmail({
          to: profile.email,
          subject: emailSubject("CANCELLATION", org.name, (tokenRes.data as { token_number?: string } | null)?.token_number ?? "—"),
          react: AppointmentStatusEmail({
            customerName: profile.full_name || profile.email,
            organizationName: org.name,
            serviceName: service?.name ?? "Service",
            date: formatAppointmentDate(new Date(result.start_at).toISOString().slice(0, 10), org.timezone),
            time: formatTimeLabel("00:00", "00:00"),
            tokenNumber: (tokenRes.data as { token_number?: string } | null)?.token_number ?? "—",
            event: "cancelled",
            note: body.reason,
            actionUrl: links.organizationUrl,
            actionLabel: "Book a new appointment",
          }),
          orgId: org.id,
          appointmentId: id,
          userId: profile.id,
          eventType: "CANCELLATION",
        });
      }
    } catch (error) {
      console.error("[TokenFlow] Cancellation email failed", error);
    }

    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}
