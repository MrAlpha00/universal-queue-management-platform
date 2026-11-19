import { task } from "@trigger.dev/sdk";
import { AppointmentReminderEmail } from "@/emails/reminder";
import { createAdminClient } from "@/lib/supabase/server";
import {
  emailSubject,
  formatAppointmentDate,
  formatTimeLabel,
  bookingLinks,
  sendEmail,
} from "@/services/notifications";
import type { Organization, Profile, Service, Branch, Appointment, Token } from "@/types/domain";

type ReminderPayload = {
  reminderEventId: string;
  appointmentId: string;
  idempotencyKey: string;
};

export const appointmentReminderTask = task({
  id: "appointment-reminder",
  retry: { maxAttempts: 3, factor: 2, minTimeoutInMs: 1000, maxTimeoutInMs: 60_000 },
  run: async (payload: ReminderPayload) => {
    const admin = createAdminClient();

    const { data: event } = await admin
      .from("reminder_events")
      .select("*")
      .eq("id", payload.reminderEventId)
      .single();
    if (!event || event.status !== "SCHEDULED") {
      return { skipped: true, reason: "Reminder is no longer scheduled" };
    }

    const { data: appointmentData } = await admin
      .from("appointments")
      .select("*")
      .eq("id", payload.appointmentId)
      .single();
    if (!appointmentData) return { skipped: true, reason: "Appointment not found" };
    const appointment = appointmentData as Appointment;

    if (!["BOOKED", "CHECKED_IN"].includes(appointment.status)) {
      await admin
        .from("reminder_events")
        .update({ status: "SKIPPED", updated_at: new Date().toISOString() })
        .eq("id", payload.reminderEventId);
      return { skipped: true, reason: `Appointment status is ${appointment.status}` };
    }
    if (new Date(appointment.start_at).getTime() <= Date.now()) {
      await admin
        .from("reminder_events")
        .update({ status: "SKIPPED", updated_at: new Date().toISOString() })
        .eq("id", payload.reminderEventId);
      return { skipped: true, reason: "Appointment has already started" };
    }

    const [tokenRes, orgRes, serviceRes, branchRes, profileRes] = await Promise.all([
      admin.from("tokens").select("*").eq("appointment_id", appointment.id).maybeSingle(),
      admin.from("organizations").select("*").eq("id", appointment.org_id).maybeSingle(),
      admin.from("services").select("*").eq("id", appointment.service_id).maybeSingle(),
      admin.from("branches").select("*").eq("id", appointment.branch_id).maybeSingle(),
      admin.from("profiles").select("*").eq("id", appointment.customer_id).maybeSingle(),
    ]);

    const token = tokenRes.data as Token | null;
    const org = orgRes.data as Organization | null;
    const service = serviceRes.data as Service | null;
    const branch = branchRes.data as Branch | null;
    const profile = profileRes.data as Profile | null;

    if (!token || !org || !service || !profile?.email) {
      return { skipped: true, reason: "Required appointment data is unavailable" };
    }

    const links = bookingLinks(org.slug, appointment.id);
    const leadLabel =
      (event.metadata as { lead_label?: string } | null)?.lead_label ?? "Upcoming appointment";

    // Re-check the idempotency key immediately before delivery. Retries and
    // duplicate triggers can never produce a second email.
    const { data: fresh } = await admin
      .from("reminder_events")
      .select("status")
      .eq("id", payload.reminderEventId)
      .single();
    if (!fresh || fresh.status !== "SCHEDULED") {
      return { skipped: true, reason: "Reminder was already processed" };
    }

    const result = await sendEmail({
      to: profile.email,
      subject: emailSubject("REMINDER", org.name, token.token_number),
      react: AppointmentReminderEmail({
        customerName: profile.full_name || profile.email,
        organizationName: org.name,
        serviceName: service.name,
        date: formatAppointmentDate(appointment.appointment_date, appointment.timezone),
        time: formatTimeLabel(appointment.start_time, appointment.end_time),
        tokenNumber: token.token_number,
        leadLabel,
        ticketUrl: links.ticketUrl,
      }),
      orgId: org.id,
      appointmentId: appointment.id,
      userId: profile.id,
      eventType: "REMINDER",
      metadata: { idempotency_key: payload.idempotencyKey, branch: branch?.name ?? null },
    });

    if (!result.sent && result.reason === "not-configured") {
      await admin
        .from("reminder_events")
        .update({ status: "SKIPPED", error: "Resend is not configured", updated_at: new Date().toISOString() })
        .eq("id", payload.reminderEventId);
      return { skipped: true, reason: "Resend is not configured" };
    }

    await admin
      .from("reminder_events")
      .update({
        status: "SENT",
        sent_at: new Date().toISOString(),
        attempts: (event.attempts as number) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.reminderEventId)
      .eq("status", "SCHEDULED");

    return { sent: true, reminderEventId: payload.reminderEventId };
  },
});
