import { schedules } from "@trigger.dev/sdk";
import { AppointmentStatusEmail } from "@/emails/status";
import { createAdminClient } from "@/lib/supabase/server";
import { emailSubject, formatAppointmentDate, formatTimeLabel, bookingLinks, sendEmail } from "@/services/notifications";
import type { Appointment, Organization, Profile, Service } from "@/types/domain";

/**
 * Expires only appointments whose own appointment window has ended. Token B or
 * C being created or scanned never changes an earlier token's lifecycle.
 * Runs every 5 minutes in Trigger.dev, not inside a Vercel function.
 */
export const tokenExpirationTask = schedules.task({
  id: "token-expiration",
  cron: { pattern: "*/5 * * * *" },
  run: async () => {
    const admin = createAdminClient();
    const { data: expiredCount, error } = await admin.rpc("expire_stale_tokens", { p_org: null });
    if (error) throw error;

    const since = new Date(Date.now() - 12 * 60_000).toISOString();
    const { data: recent } = await admin
      .from("appointments")
      .select("*")
      .eq("status", "EXPIRED")
      .gte("updated_at", since)
      .limit(100);
    if (!recent?.length) return { expired: Number(expiredCount ?? 0), notified: 0 };

    let notified = 0;
    for (const item of recent) {
      const appointment = item as Appointment;
      const [orgRes, serviceRes, profileRes, tokenRes, existingRes] = await Promise.all([
        admin.from("organizations").select("*").eq("id", appointment.org_id).maybeSingle(),
        admin.from("services").select("*").eq("id", appointment.service_id).maybeSingle(),
        admin.from("profiles").select("*").eq("id", appointment.customer_id).maybeSingle(),
        admin.from("tokens").select("token_number").eq("appointment_id", appointment.id).maybeSingle(),
        admin
          .from("notification_events")
          .select("id")
          .eq("appointment_id", appointment.id)
          .eq("event_type", "EXPIRATION")
          .limit(1),
      ]);

      if (existingRes.data?.length) continue;
      const org = orgRes.data as Organization | null;
      const service = serviceRes.data as Service | null;
      const profile = profileRes.data as Profile | null;
      if (!org || !service || !profile?.email) continue;

      const links = bookingLinks(org.slug, appointment.id);
      try {
        const result = await sendEmail({
          to: profile.email,
          subject: emailSubject("EXPIRATION", org.name, (tokenRes.data as { token_number?: string } | null)?.token_number ?? "—"),
          react: AppointmentStatusEmail({
            customerName: profile.full_name || profile.email,
            organizationName: org.name,
            serviceName: service.name,
            date: formatAppointmentDate(appointment.appointment_date, appointment.timezone),
            time: formatTimeLabel(appointment.start_time, appointment.end_time),
            tokenNumber: (tokenRes.data as { token_number?: string } | null)?.token_number ?? "—",
            event: "expired",
            actionUrl: links.organizationUrl,
            actionLabel: "Book another appointment",
          }),
          orgId: org.id,
          appointmentId: appointment.id,
          userId: profile.id,
          eventType: "EXPIRATION",
        });
        if (result.sent) notified += 1;
      } catch (error) {
        console.error("[TokenFlow] Expiration notification failed", error);
      }
    }

    return { expired: Number(expiredCount ?? 0), notified };
  },
});
