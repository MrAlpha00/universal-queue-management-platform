import { afterEach, describe, expect, it, vi } from "vitest";
import {
  configuredIntegrations,
  getAppUrl,
  hasSupabaseConfig,
  requireServerEnv,
  SERVER_ENV_KEYS,
} from "@/lib/env";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("requireServerEnv", () => {
  it("returns configured server secrets", () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    expect(requireServerEnv("RESEND_API_KEY")).toBe("re_test");
  });

  it("throws a helpful error when a secret is missing", () => {
    vi.stubEnv("TRIGGER_SECRET_KEY", "");
    expect(() => requireServerEnv("TRIGGER_SECRET_KEY")).toThrow(/TRIGGER_SECRET_KEY/);
    expect(() => requireServerEnv("TRIGGER_SECRET_KEY")).toThrow(/docs\/setup\.md/);
  });

  it("lists every required server key", () => {
    expect(SERVER_ENV_KEYS).toEqual([
      "SUPABASE_SERVICE_ROLE_KEY",
      "RESEND_API_KEY",
      "RESEND_FROM_EMAIL",
      "TRIGGER_SECRET_KEY",
    ]);
  });
});

describe("getAppUrl", () => {
  it("prefers the explicit app URL and strips a trailing slash", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://flows.example.com/");
    expect(getAppUrl()).toBe("https://flows.example.com");
  });

  it("falls back to the Vercel deployment URL", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("VERCEL_URL", "tokenflow-preview.vercel.app");
    expect(getAppUrl()).toBe("https://tokenflow-preview.vercel.app");
  });

  it("falls back to localhost in development", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    expect(getAppUrl()).toBe("http://localhost:3000");
  });
});

describe("integration configuration", () => {
  it("requires both Supabase public values", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    expect(hasSupabaseConfig()).toBe(false);

    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    expect(hasSupabaseConfig()).toBe(false);

    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    expect(hasSupabaseConfig()).toBe(true);
  });

  it("reports which integrations are ready", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "sb_secret_test");
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("RESEND_FROM_EMAIL", "TokenFlow <tickets@example.com>");
    vi.stubEnv("TRIGGER_SECRET_KEY", "");

    expect(configuredIntegrations()).toEqual({
      supabase: true,
      serviceRole: true,
      resend: true,
      trigger: false,
    });
  });
});
