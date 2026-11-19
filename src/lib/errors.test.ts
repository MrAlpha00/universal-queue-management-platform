import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { AppError, errors, toAppError } from "@/lib/errors";

describe("AppError", () => {
  it.each([
    ["UNAUTHORIZED", 401],
    ["FORBIDDEN", 403],
    ["NOT_FOUND", 404],
    ["VALIDATION", 422],
    ["CONFLICT", 409],
    ["RATE_LIMITED", 429],
    ["INVALID_QR", 400],
    ["EXPIRED_QR", 410],
    ["WRONG_ORGANIZATION", 403],
    ["ALREADY_CHECKED_IN", 409],
    ["SLOT_UNAVAILABLE", 409],
    ["CONFIGURATION", 503],
    ["INTERNAL", 500],
  ] as const)("maps %s to HTTP %i", (code, status) => {
    const error = new AppError(code, "message");
    expect(error.code).toBe(code);
    expect(error.status).toBe(status);
    expect(error).toBeInstanceOf(Error);
  });

  it("preserves details for validation errors", () => {
    const error = errors.validation("Invalid input", { field: "email" });
    expect(error.details).toEqual({ field: "email" });
  });

  it("exposes readable helper defaults", () => {
    expect(errors.unauthorized().message).toBe("Authentication is required");
    expect(errors.slotUnavailable().message).toContain("no longer available");
    expect(errors.alreadyCheckedIn().code).toBe("ALREADY_CHECKED_IN");
  });
});

describe("toAppError", () => {
  it("returns an AppError unchanged", () => {
    const original = errors.forbidden();
    expect(toAppError(original)).toBe(original);
  });

  it("maps Zod failures to a validation error with field details", () => {
    const result = toAppError(
      new z.ZodError([
        { code: "custom", message: "Use a valid email", path: ["email"], input: "nope" },
      ]),
    );
    expect(result.code).toBe("VALIDATION");
    expect(result.status).toBe(422);
    expect(result.details).toEqual([{ path: "email", message: "Use a valid email" }]);
  });

  it("wraps unknown errors without leaking their message", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = toAppError(new Error("database password leaked"));
    expect(result.code).toBe("INTERNAL");
    expect(result.message).toBe("Something went wrong. Please try again.");
    expect(result.message).not.toContain("password");
    expect(spy).toHaveBeenCalled();
  });
});
