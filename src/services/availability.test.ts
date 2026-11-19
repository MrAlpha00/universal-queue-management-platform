import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getBookingDays } from "@/services/availability";

describe("getBookingDays", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 23:30 UTC is still the same calendar day in New York, but already
    // tomorrow in Tokyo. This proves the helper uses the organization's zone.
    vi.setSystemTime(new Date("2026-03-10T23:30:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the default three-day horizon in the organization timezone", () => {
    const days = getBookingDays("America/New_York");
    expect(days.map((day) => day.date)).toEqual([
      "2026-03-10",
      "2026-03-11",
      "2026-03-12",
    ]);
  });

  it("formats display labels for the booking picker", () => {
    const days = getBookingDays("America/New_York");
    expect(days[0]).toMatchObject({ weekday: "Tue", day: "10", month: "Mar", label: "Today" });
    expect(days[1].label).toBe("Tomorrow");
    expect(days[2].label).toBe("Thursday");
  });

  it("crosses the date boundary in eastern timezones", () => {
    const days = getBookingDays("Asia/Tokyo");
    expect(days[0].date).toBe("2026-03-11");
    expect(days[0].label).toBe("Today");
  });

  it("respects a custom horizon", () => {
    const days = getBookingDays("UTC", 5);
    expect(days).toHaveLength(5);
    expect(days.at(-1)?.date).toBe("2026-03-14");
  });
});
