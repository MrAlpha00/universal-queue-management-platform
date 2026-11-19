import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { hasSupabaseConfig } from "@/lib/env";

/**
 * Creates a request-scoped Supabase client using the caller's cookie session.
 * All database access through this client is subject to Row Level Security.
 */
export async function createClient() {
  if (!hasSupabaseConfig()) {
    throw new Error(
      "[TokenFlow] Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see .env.example).",
    );
  }
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot write cookies; middleware refreshes them.
          }
        },
      },
    },
  );
}

/** Admin client that bypasses RLS. Only use in trusted server code. */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "[TokenFlow] SUPABASE_SERVICE_ROLE_KEY is not configured. See .env.example.",
    );
  }
  return createServerClient(url, key, { cookies: { getAll: () => [], setAll: () => {} } });
}
