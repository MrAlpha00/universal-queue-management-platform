import { describe, expect, it } from "vitest";
import {
  ACTIVE_APPOINTMENT_STATUSES,
  APPOINTMENT_STATUSES,
  DEFAULT_BOOKING_HORIZON_DAYS,
  DEFAULT_REMINDER_OFFSETS_MINUTES,
  ORGANIZATION_STATUSES,
  STATUS_STYLES,
  TERMINAL_APPOINTMENT_STATUSES,
} from "@/config/constants";

describe("appointment status model", () => {
  it("splits every status into exactly one lifecycle bucket", () => {
    const active = new Set(ACTIVE_APPOINTMENT_STATUSES);
    const terminal = new Set(TERMINAL_APPOINTMENT_STATUSES);

    for (const status of APPOINTMENT_STATUSES) {
      expect(active.has(status)).toBe(!terminal.has(status));
    }
    expect(active.size + terminal.size).toBe(APPOINTMENT_STATUSES.length);
  });

  it("marks booked, checked in and in progress as active", () => {
    expect(ACTIVE_APPOINTMENT_STATUSES).toEqual(["BOOKED", "CHECKED_IN", "IN_PROGRESS"]);
  });
});

describe("status presentation", () => {
  it("defines a complete visual style for every appointment and organization status", () => {
    for (const status of [...APPOINTMENT_STATUSES, ...ORGANIZATION_STATUSES]) {
      const style = STATUS_STYLES[status];
      expect(style.label.length).toBeGreaterThan(0);
      expect(style.tone).toContain("border");
      expect(style.dot).toContain("bg-");
    }
  });
});

describe("defaults", () => {
  it("uses a three-calendar-day booking horizon", () => {
    expect(DEFAULT_BOOKING_HORIZON_DAYS).toBe(3);
  });

  it("keeps reminders in ascending proximity order", () => {
    expect(DEFAULT_REMINDER_OFFSETS_MINUTES).toEqual([120, 90, 60, 30, 10]);
  });
});
