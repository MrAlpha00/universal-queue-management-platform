const serverEnvKeys = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "TRIGGER_SECRET_KEY",
  "QR_SIGNING_SECRET",
] as const;

export type ServerEnvKey = (typeof serverEnvKeys)[number];

export const SERVER_ENV_KEYS = serverEnvKeys;

export function getServerEnv(key: ServerEnvKey): string | undefined {
  return process.env[key];
}

export function requireServerEnv(key: ServerEnvKey): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[TokenFlow] Missing required environment variable ${key}. See .env.example and docs/setup.md.`,
    );
  }
  return value;
}

export function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  ).replace(/\/$/, "");
}

export function configuredIntegrations() {
  return {
    supabase: hasSupabaseConfig(),
    serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    resend: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
    trigger: Boolean(process.env.TRIGGER_SECRET_KEY),
  };
}
