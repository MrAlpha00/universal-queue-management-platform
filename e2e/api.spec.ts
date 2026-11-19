import { expect, test } from "@playwright/test";

test.describe("public JSON API envelope", () => {
  test("rejects an invalid booking payload with 422 and field details", async ({ request }) => {
    const response = await request.post("/api/bookings", {
      data: {
        serviceId: "not-a-uuid",
        branchId: "also-not-a-uuid",
        date: "10/03/2026",
        startTime: "9:30",
      },
    });

    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("VALIDATION");
    expect(body.error.details.length).toBeGreaterThan(0);
    expect(body.error.details.every((issue: { path: string }) => issue.path.length > 0)).toBe(true);
  });

  test("rejects incomplete availability queries with 422", async ({ request }) => {
    const response = await request.get("/api/organizations/example/availability");
    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("VALIDATION");
  });

  test("rejects malformed token verification requests with 422", async ({ request }) => {
    const response = await request.post("/api/tokens/verify", {
      data: { reference: "", orgSlug: "" },
    });
    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("VALIDATION");
  });
});
