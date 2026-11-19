import { afterEach, describe, expect, it, vi } from "vitest";
import {
  bookingLinks,
  emailSubject,
  formatAppointmentDate,
  formatTimeLabel,
  leadTimeLabel,
} from "@/services/notifications";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("formatTimeLabel", () => {
  it("renders a compact range from database time values", () => {
    expect(formatTimeLabel("09:05:00", "09:35:00")).toBe("09:05 – 09:35");
    expect(formatTimeLabel("13:00", "13:15")).toBe("13:00 – 13:15");
  });
});

describe("leadTimeLabel", () => {
  it("pluralizes hours correctly", () => {
    expect(leadTimeLabel(60)).toBe("1 hour before");
    expect(leadTimeLabel(120)).toBe("2 hours before");
    expect(leadTimeLabel(90)).toBe("1.5 hours before");
  });

  it("uses minutes below one hour", () => {
    expect(leadTimeLabel(45)).toBe("45 minutes before");
    expect(leadTimeLabel(1)).toBe("1 minutes before");
  });
});

describe("formatAppointmentDate", () => {
  it("formats a calendar date in the supplied timezone", () => {
    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    expect(formatAppointmentDate("2026-03-10", localTimezone)).toBe("Tuesday, 10 March 2026");
  });

  it("returns the raw value when the date cannot be parsed", () => {
    expect(formatAppointmentDate("not-a-date", "UTC")).toBe("not-a-date");
  });
});

describe("emailSubject", () => {
  it("uses organization-specific subjects", () => {
    expect(emailSubject("BOOKING_CONFIRMATION", "North Clinic", "TK-004")).toBe(
      "North Clinic · Booking confirmed (TK-004)",
    );
    expect(emailSubject("REMINDER", "North Clinic", "TK-004")).toBe(
      "Reminder from North Clinic · TK-004",
    );
  });

  it("falls back safely for unknown events", () => {
    expect(emailSubject("STATUS_UPDATE", "North Clinic", "TK-004")).toBe(
      "TokenFlow · Appointment update",
    );
    expect(emailSubject("SOMETHING_NEW", "North Clinic", "TK-004")).toBe(
      "North Clinic · Appointment update",
    );
  });
});

describe("bookingLinks", () => {
  it("builds absolute customer links from the app URL", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://flows.example.com/");
    expect(bookingLinks("north-clinic", "appointment-1")).toEqual({
      dashboardUrl: "https://flows.example.com/appointments/appointment-1",
      ticketUrl: "https://flows.example.com/appointments/appointment-1/ticket",
      organizationUrl: "https://flows.example.com/organizations/north-clinic",
    });
  });
});
