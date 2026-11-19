import { describe, expect, it } from "vitest";
import { isAuthPage, isProtectedRoute } from "./routes";

describe("isProtectedRoute", () => {
  it("protects exact routes and their children", () => {
    expect(isProtectedRoute("/dashboard")).toBe(true);
    expect(isProtectedRoute("/appointments/123/ticket")).toBe(true);
    expect(isProtectedRoute("/manage/acme/overview")).toBe(true);
    expect(isProtectedRoute("/platform/users")).toBe(true);
    expect(isProtectedRoute("/onboarding/organization")).toBe(true);
  });

  it("does not protect similarly prefixed public pages", () => {
    expect(isProtectedRoute("/platform-capabilities")).toBe(false);
    expect(isProtectedRoute("/settings-help")).toBe(false);
    expect(isProtectedRoute("/profile-photo")).toBe(false);
    expect(isProtectedRoute("/")).toBe(false);
    expect(isProtectedRoute("/features")).toBe(false);
  });
});

describe("isAuthPage", () => {
  it("recognizes authentication screens only", () => {
    expect(isAuthPage("/login")).toBe(true);
    expect(isAuthPage("/signup")).toBe(true);
    expect(isAuthPage("/forgot-password")).toBe(true);
    expect(isAuthPage("/login?setup=1")).toBe(false);
    expect(isAuthPage("/dashboard")).toBe(false);
  });
});
