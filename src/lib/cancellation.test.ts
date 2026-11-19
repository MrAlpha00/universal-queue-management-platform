import { describe, expect, it } from "vitest";
import type { AppointmentStatus } from "@/config/constants";
import { getCancellationPolicy } from "./cancellation";

const startAt = "2026-03-10T15:00:00.000Z";

function appointment(status: AppointmentStatus = "BOOKED") {
  return { status, start_at: startAt } as const;
}

describe("getCancellationPolicy", () => {
  it("allows cancellation outside the cutoff when the service permits it", () => {
    const policy = getCancellationPolicy(
      appointment(),
      { allow_cancellation: true, cancellation_hours: 2 },
      new Date("2026-03-10T10:00:00.000Z"),
    );
    expect(policy.canCancel).toBe(true);
    expect(policy.reason).toBeNull();
    expect(policy.cutoffAt?.toISOString()).toBe("2026-03-10T13:00:00.000Z");
  });

  it("allows cancellation exactly at the cutoff", () => {
    const policy = getCancellationPolicy(
      appointment(),
      { allow_cancellation: true, cancellation_hours: 2 },
      new Date("2026-03-10T13:00:00.000Z"),
    );
    expect(policy.canCancel).toBe(true);
  });

  it("blocks cancellation after the cutoff", () => {
    const policy = getCancellationPolicy(
      appointment(),
      { allow_cancellation: true, cancellation_hours: 2 },
      new Date("2026-03-10T13:30:00.000Z"),
    );
    expect(policy.canCancel).toBe(false);
    expect(policy.reason).toBe("WINDOW_CLOSED");
    expect(policy.message).toContain("2 hours");
  });

  it("uses a singular hour label", () => {
    const policy = getCancellationPolicy(
      appointment(),
      { allow_cancellation: true, cancellation_hours: 1 },
      new Date("2026-03-10T14:30:00.000Z"),
    );
    expect(policy.message).toContain("1 hour before");
  });

  it("blocks cancellation when the service disables it", () => {
    const policy = getCancellationPolicy(
      appointment(),
      { allow_cancellation: false, cancellation_hours: 0 },
      new Date("2026-03-01T00:00:00.000Z"),
    );
    expect(policy.canCancel).toBe(false);
    expect(policy.reason).toBe("SERVICE_DISABLED");
  });

  it("blocks cancellation for statuses that are not cancellable", () => {
    for (const status of ["IN_PROGRESS", "COMPLETED", "CANCELLED", "EXPIRED", "NO_SHOW"] as const) {
      const policy = getCancellationPolicy(
        appointment(status),
        { allow_cancellation: true, cancellation_hours: 0 },
        new Date("2026-03-01T00:00:00.000Z"),
      );
      expect(policy.canCancel).toBe(false);
      expect(policy.reason).toBe("NOT_CANCELLABLE_STATUS");
    }
  });

  it("defaults to permitting cancellation when policy fields are missing", () => {
    const policy = getCancellationPolicy(
      appointment(),
      { allow_cancellation: true },
      new Date("2026-03-10T14:59:00.000Z"),
    );
    expect(policy.canCancel).toBe(true);
    expect(policy.cutoffAt).toBeNull();
  });

  it("treats a missing service relation as allowing cancellation", () => {
    const policy = getCancellationPolicy(appointment(), undefined);
    expect(policy.canCancel).toBe(true);
  });
});
