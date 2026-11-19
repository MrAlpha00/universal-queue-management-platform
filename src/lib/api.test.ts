// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { apiError, apiSuccess, getClientIp } from "@/lib/api";
import { errors } from "@/lib/errors";

describe("apiSuccess", () => {
  it("wraps data in the standard success envelope", async () => {
    const response = apiSuccess({ slot: "09:30" }, 201);
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: { slot: "09:30" },
    });
  });
});

describe("apiError", () => {
  it("maps known AppError codes to their HTTP status", async () => {
    const response = apiError(errors.slotUnavailable("That slot was taken"));
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: { code: "SLOT_UNAVAILABLE", message: "That slot was taken" },
    });
  });

  it("includes safe validation details", async () => {
    const response = apiError(errors.validation("Check the form", { field: "date" }));
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.error.details).toEqual({ field: "date" });
  });

  it("turns schema failures into 422 responses", async () => {
    const schema = z.object({ email: z.string().email() });
    let caught: unknown;
    try {
      schema.parse({ email: "nope" });
    } catch (error) {
      caught = error;
    }
    const response = apiError(caught);
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION");
    expect(body.error.details[0].path).toBe("email");
  });

  it("never exposes unexpected internal error messages", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = apiError(new Error("connection string secret"));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.code).toBe("INTERNAL");
    expect(body.error.message).not.toContain("secret");
    expect(spy).toHaveBeenCalled();
  });
});

describe("getClientIp", () => {
  it("reads the first forwarded address", () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "203.0.113.4, 10.0.0.1" },
    });
    expect(getClientIp(request)).toBe("203.0.113.4");
  });

  it("falls back to the real IP header and finally unknown", () => {
    expect(
      getClientIp(new Request("https://example.com", { headers: { "x-real-ip": "198.51.100.7" } })),
    ).toBe("198.51.100.7");
    expect(getClientIp(new Request("https://example.com"))).toBe("unknown");
  });
});
