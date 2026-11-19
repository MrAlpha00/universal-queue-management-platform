import type { ReactElement } from "react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { DEFAULT_REMINDER_OFFSETS_MINUTES } from "@/config/constants";
import { brand } from "@/config/brand";
import { getAppUrl, requireServerEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/server";
import type { BookingResult, Organization } from "@/types/domain";

export type EmailInput = {
  to: string;
  subject: string;
  react: ReactElement;
  orgId?: string | null;
  appointmentId?: string | null;
  userId?: string | null;
  eventType: string;
  metadata?: Record<string, unknown>;
};

function emailEnabled(org: Organization | null, eventType: string) {
  const enabled = org?.settings?.enabled_email_types;
  if (!Array.isArray(enabled)) return true;
  return enabled.includes(eventType);
}

/** Sends through Resend and always records a notification event. */
export async function sendEmail(input: EmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const admin = createAdminClient();

  if (!apiKey || !from) {
    await admin.from("notification_events").insert({
      org_id: input.orgId ?? null,
      appointment_id: input.appointmentId ?? null,
      user_id: input.userId ?? null,
      channel: "EMAIL",
      event_type: input.eventType,
      recipient: input.to,
      subject: input.subject,
      status: "SKIPPED",
      error: "RESEND_API_KEY / RESEND_FROM_EMAIL are not configured",
      metadata: input.metadata ?? {},
    });
    return { sent: false, reason: "not-configured" as const };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to: [input.to],
      subject: input.subject,
      react: input.react,
      tags: [{ name: "event", value: input.eventType }],
    });
    if (result.error) throw new Error(result.error.message);

    await admin.from("notification_events").insert({
      org_id: input.orgId ?? null,
      appointment_id: input.appointmentId ?? null,
      user_id: input.userId ?? null,
      channel: "EMAIL",
      event_type: input.eventType,
      recipient: input.to,
      subject: input.subject,
      status: "SENT",
      provider_id: result.data?.id ?? null,
      metadata: input.metadata ?? {},
    });
    return { sent: true, id: result.data?.id as string | undefined };
  } catch (error) {
    await admin.from("notification_events").insert({
      org_id: input.orgId ?? null,
      appointment_id: input.appointmentId ?? null,
      user_id: input.userId ?? null,
      channel: "EMAIL",
      event_type: input.eventType,
      recipient: input.to,
      subject: input.subject,
      status: "FAILED",
      error: error instanceof Error ? error.message : "Unknown delivery error",
      metadata: input.metadata ?? {},
    });
    throw error;
  }
}

export function formatAppointmentDate(date: string, timezone: string) {
  try {
    return format(toZonedTime(new Date(`${date}T12:00:00`), timezone), "EEEE, d MMMM yyyy");
  } catch {
    return date;
  }
}

export function formatTimeLabel(startTime: string, endTime: string) {
  return `${startTime.slice(0, 5)} – ${endTime.slice(0, 5)}`;
}

export function leadTimeLabel(minutes: number) {
  if (minutes >= 60) {
    const hours = minutes / 60;
    return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} hour${hours === 1 ? "" : "s"} before`;
  }
  return `${minutes} minutes before`;
}

/**
 * Creates durable reminder rows and Trigger.dev delayed runs. Idempotency keys
 * make repeated calls harmless; cancellation invalidates every pending row.
 */
export async function scheduleReminders(input: {
  booking: BookingResult;
  org: Organization;
  customerEmail: string;
  customerName: string;
  customerId: string;
  serviceName: string;
  branchName?: string;
}) {
  const { booking, org } = input;
  if (!emailEnabled(org, "REMINDER")) return 0;

  const offsets = Array.isArray(org.settings?.reminder_offsets_minutes)
    ? org.settings.reminder_offsets_minutes
    : DEFAULT_REMINDER_OFFSETS_MINUTES;
  const admin = createAdminClient();
  const startsAt = new Date(booking.start_at).getTime();
  const now = Date.now();
  let scheduled = 0;

  for (const offset of offsets) {
    const scheduledFor = new Date(startsAt - offset * 60_000);
    if (scheduledFor.getTime() <= now) continue;

    const idempotencyKey = `reminder:${booking.appointment_id}:${offset}`;
    const { data: event, error } = await admin
      .from("reminder_events")
      .upsert(
        {
          org_id: org.id,
          appointment_id: booking.appointment_id,
          notification_type: "REMINDER",
          offset_minutes: offset,
          scheduled_for: scheduledFor.toISOString(),
          idempotency_key: idempotencyKey,
          status: "SCHEDULED",
          metadata: { lead_label: leadTimeLabel(offset) },
        },
        { onConflict: "idempotency_key", ignoreDuplicates: true },
      )
      .select()
      .single();
    if (error || !event) continue;

    if (process.env.TRIGGER_SECRET_KEY) {
      try {
        const { appointmentReminderTask } = await import("@/trigger/reminders");
        const handle = await appointmentReminderTask.trigger(
          {
            reminderEventId: event.id as string,
            appointmentId: booking.appointment_id,
            idempotencyKey,
          },
          {
            idempotencyKey,
            delay: scheduledFor,
          },
        );
        await admin
          .from("reminder_events")
          .update({ task_id: handle.id })
          .eq("id", event.id as string);
      } catch (triggerError) {
        console.error("[TokenFlow] Failed to schedule Trigger.dev reminder", triggerError);
      }
    }
    scheduled += 1;
  }
  return scheduled;
}

/** Invalidates every pending reminder for an appointment (cancel / reschedule). */
export async function cancelReminders(appointmentId: string) {
  const admin = createAdminClient();
  const { data: events } = await admin
    .from("reminder_events")
    .select("id, task_id")
    .eq("appointment_id", appointmentId)
    .eq("status", "SCHEDULED");
  if (!events?.length) return 0;

  if (process.env.TRIGGER_SECRET_KEY && events.length) {
    try {
      const { runs } = await import("@trigger.dev/sdk");
      await Promise.allSettled(
        events
          .filter((event) => event.task_id)
          .map((event) => runs.cancel(event.task_id as string)),
      );
    } catch (error) {
      console.error("[TokenFlow] Failed to cancel Trigger.dev runs", error);
    }
  }

  await admin
    .from("reminder_events")
    .update({ status: "CANCELLED", updated_at: new Date().toISOString() })
    .eq("appointment_id", appointmentId)
    .eq("status", "SCHEDULED");
  return events.length;
}

export function bookingLinks(orgSlug: string, appointmentId: string) {
  const base = getAppUrl();
  return {
    dashboardUrl: `${base}/appointments/${appointmentId}`,
    ticketUrl: `${base}/appointments/${appointmentId}/ticket`,
    organizationUrl: `${base}/organizations/${orgSlug}`,
  };
}

export function emailSubject(event: string, organizationName: string, tokenNumber: string) {
  const subjects: Record<string, string> = {
    BOOKING_CONFIRMATION: `${organizationName} · Booking confirmed (${tokenNumber})`,
    REMINDER: `Reminder from ${organizationName} · ${tokenNumber}`,
    CANCELLATION: `${organizationName} · Appointment cancelled`,
    RESCHEDULE: `${organizationName} · Appointment rescheduled`,
    EXPIRATION: `${organizationName} · Appointment expired`,
    STATUS_UPDATE: `${brand.name} · Appointment update`,
  };
  return subjects[event] ?? `${organizationName} · Appointment update`;
}

export function assertTriggerConfigured() {
  return requireServerEnv("TRIGGER_SECRET_KEY");
}
