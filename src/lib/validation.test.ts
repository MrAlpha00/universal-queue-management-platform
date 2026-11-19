import { describe, expect, it } from "vitest";
import {
  availabilityQuerySchema,
  bookingCancelSchema,
  bookingInputSchema,
  clockTimeSchema,
  isoDateSchema,
  organizationCreateSchema,
  scheduleGenerateSchema,
  tokenVerifySchema,
} from "@/lib/validation";

const serviceId = "8f14e45f-ceea-4c8f-9c1b-3d3b0f2a1c11";
const branchId = "1d9f1e3a-2b4c-4d5e-8f60-7a8b9c0d1e2f";

describe("date and time primitives", () => {
  it("accepts ISO dates and rejects impossible formats", () => {
    expect(isoDateSchema.safeParse("2026-03-10").success).toBe(true);
    expect(isoDateSchema.safeParse("10/03/2026").success).toBe(false);
    expect(isoDateSchema.safeParse("2026-3-1").success).toBe(false);
  });

  it("accepts 24-hour clock times", () => {
    expect(clockTimeSchema.safeParse("00:00").success).toBe(true);
    expect(clockTimeSchema.safeParse("23:59").success).toBe(true);
    expect(clockTimeSchema.safeParse("24:00").success).toBe(false);
    expect(clockTimeSchema.safeParse("9:30").success).toBe(false);
  });
});

describe("bookingInputSchema", () => {
  it("accepts a complete booking payload", () => {
    const result = bookingInputSchema.safeParse({
      serviceId,
      branchId,
      date: "2026-03-10",
      startTime: "09:30",
      responses: { reason: "Check-up" },
    });
    expect(result.success).toBe(true);
  });

  it("defaults responses to an empty object", () => {
    const result = bookingInputSchema.parse({
      serviceId,
      branchId,
      date: "2026-03-10",
      startTime: "09:30",
    });
    expect(result.responses).toEqual({});
  });

  it("rejects malformed identifiers and times", () => {
    const result = bookingInputSchema.safeParse({
      serviceId: "not-a-uuid",
      branchId,
      date: "2026-03-10",
      startTime: "9:30",
    });
    expect(result.success).toBe(false);
  });
});

describe("bookingCancelSchema", () => {
  it("allows an omitted reason", () => {
    expect(bookingCancelSchema.parse({})).toEqual({});
  });

  it("caps reasons at 500 characters", () => {
    expect(bookingCancelSchema.safeParse({ reason: "x".repeat(500) }).success).toBe(true);
    expect(bookingCancelSchema.safeParse({ reason: "x".repeat(501) }).success).toBe(false);
  });
});

describe("organizationCreateSchema", () => {
  it("defaults the timezone to UTC", () => {
    const parsed = organizationCreateSchema.parse({ name: "North Clinic", slug: "north-clinic" });
    expect(parsed.timezone).toBe("UTC");
  });

  it("validates email addresses and name lengths", () => {
    expect(
      organizationCreateSchema.safeParse({
        name: "North Clinic",
        slug: "north-clinic",
        email: "hello@example.com",
      }).success,
    ).toBe(true);
    expect(
      organizationCreateSchema.safeParse({
        name: "N",
        slug: "north-clinic",
        email: "not-an-email",
      }).success,
    ).toBe(false);
  });
});

describe("availabilityQuerySchema", () => {
  it("requires both identifiers and a date", () => {
    expect(
      availabilityQuerySchema.safeParse({ serviceId, branchId, date: "2026-03-10" }).success,
    ).toBe(true);
    expect(availabilityQuerySchema.safeParse({ serviceId, date: "2026-03-10" }).success).toBe(false);
  });
});

describe("scheduleGenerateSchema", () => {
  it("accepts an inclusive range", () => {
    expect(
      scheduleGenerateSchema.safeParse({
        orgSlug: "north-clinic",
        serviceId,
        from: "2026-03-10",
        to: "2026-03-10",
      }).success,
    ).toBe(true);
  });

  it("rejects a reversed range", () => {
    const result = scheduleGenerateSchema.safeParse({
      orgSlug: "north-clinic",
      serviceId,
      from: "2026-03-12",
      to: "2026-03-10",
    });
    expect(result.success).toBe(false);
  });
});

describe("tokenVerifySchema", () => {
  it("defaults the scan source to CAMERA", () => {
    const parsed = tokenVerifySchema.parse({ reference: "tfq_example", orgSlug: "north-clinic" });
    expect(parsed.source).toBe("CAMERA");
  });

  it("rejects unknown scan sources and short references", () => {
    expect(
      tokenVerifySchema.safeParse({
        reference: "abc",
        orgSlug: "north-clinic",
        source: "CAMERA",
      }).success,
    ).toBe(false);
    expect(
      tokenVerifySchema.safeParse({
        reference: "tfq_example",
        orgSlug: "north-clinic",
        source: "NFC",
      }).success,
    ).toBe(false);
  });
});
