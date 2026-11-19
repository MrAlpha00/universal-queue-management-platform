import type { Appointment, Service } from "@/types/domain";

/**
 * Statuses a customer can still cancel from. This mirrors the guard in
 * `cancel_booking` so the UI never offers an action the database refuses.
 */
export const CANCELLABLE_APPOINTMENT_STATUSES = ["BOOKED", "CHECKED_IN"] as const;

export type CancellationBlockReason =
  | "NOT_CANCELLABLE_STATUS"
  | "SERVICE_DISABLED"
  | "WINDOW_CLOSED";

export type CancellationPolicy = {
  canCancel: boolean;
  reason: CancellationBlockReason | null;
  /** Instant at which the online cancellation window closes, when one applies. */
  cutoffAt: Date | null;
  /** Customer-facing explanation shown when cancellation is unavailable. */
  message: string | null;
};

type CancellationAppointment = Pick<Appointment, "status" | "start_at">;

type CancellationService = Partial<
  Pick<Service, "allow_cancellation" | "cancellation_hours">
>;

export function getCancellationPolicy(
  appointment: CancellationAppointment,
  service: CancellationService | null | undefined,
  now: Date = new Date(),
): CancellationPolicy {
  const startAt = new Date(appointment.start_at);
  const hours = Math.max(0, Number(service?.cancellation_hours ?? 0));
  const cutoffAt =
    hours > 0 && !Number.isNaN(startAt.getTime())
      ? new Date(startAt.getTime() - hours * 60 * 60 * 1000)
      : null;

  if (!(CANCELLABLE_APPOINTMENT_STATUSES as readonly string[]).includes(appointment.status)) {
    return {
      canCancel: false,
      reason: "NOT_CANCELLABLE_STATUS",
      cutoffAt,
      message: "This appointment can no longer be cancelled online.",
    };
  }

  if (service?.allow_cancellation === false) {
    return {
      canCancel: false,
      reason: "SERVICE_DISABLED",
      cutoffAt,
      message:
        "This organization does not allow online cancellation for this service. Contact the organization if you need to change your booking.",
    };
  }

  if (cutoffAt && now.getTime() > cutoffAt.getTime()) {
    return {
      canCancel: false,
      reason: "WINDOW_CLOSED",
      cutoffAt,
      message: `Online cancellation closed ${hours} ${
        hours === 1 ? "hour" : "hours"
      } before the appointment. Contact the organization if you need to change your booking.`,
    };
  }

  return { canCancel: true, reason: null, cutoffAt, message: null };
}
