/** Route prefixes that require an authenticated session. */
export const PROTECTED_PREFIXES = [
  "/dashboard",
  "/appointments",
  "/profile",
  "/settings",
  "/onboarding",
  "/manage",
  "/platform",
] as const;

/** Public pages that redirect signed-in users to the dashboard. */
export const AUTH_PAGES = ["/login", "/signup", "/forgot-password"] as const;

/**
 * Matches an exact protected route or one of its children. Comparing with a
 * trailing slash prevents marketing paths such as `/platform-capabilities`
 * from being mistaken for the `/platform` console.
 */
export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isAuthPage(pathname: string): boolean {
  return (AUTH_PAGES as readonly string[]).includes(pathname);
}
