/**
 * Restricts post-auth redirects to same-origin application paths. Untrusted
 * `next` values must never be able to send a freshly authenticated user to
 * another origin.
 */
export function safeRedirectPath(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;

  // Reject encoded separator tricks such as /%2F%2Fevil.example and
  // /%5Cevil.example. Decode a few layers before inspecting.
  let decoded = value;
  for (let depth = 0; depth < 3; depth += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      return fallback;
    }
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.includes("\\")) {
    return fallback;
  }

  try {
    const base = "https://tokenflow.invalid";
    const resolved = new URL(value, base);
    if (resolved.origin !== base) return fallback;
    if (!resolved.pathname.startsWith("/")) return fallback;
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return fallback;
  }
}
