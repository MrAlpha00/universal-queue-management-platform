# Security

TokenFlow is multi-tenant software. The primary security goal is that no customer, organization member or anonymous visitor can read or mutate another tenant's data, and that a QR token cannot be guessed, replayed across organizations or used twice to check in.

This document describes the controls in the repository. Deployment-specific controls (WAF, edge rate limiting, log retention) are noted where they must be added operationally.

## Trust boundaries

| Boundary | Runs with | Rules |
| --- | --- | --- |
| Browser | Publishable Supabase key | All reads/writes are subject to RLS; no service-role key is ever shipped |
| Next.js request context | User session cookies + RLS | Default for pages, services and route handlers |
| Server actions / route handlers | User session, then explicit authorization | Validate input with Zod; call RPCs rather than writing privileged tables |
| Trusted server modules | `SUPABASE_SERVICE_ROLE_KEY` | Email logging, reminder tasks, expiration jobs; never imported into client components |
| Database functions | `SECURITY DEFINER` owner | Re-check authorization inside each function; explicit grants |
| Trigger.dev | Service role in its own environment | Only reminder and expiration work |

The service-role client lives in `createAdminClient()` (`src/lib/supabase/admin` is intentionally absent — the helper is exported from `src/lib/supabase/server.ts`). Keep it out of `"use client"` modules and out of any component that ships to the browser.

## Authentication and sessions

- Supabase Auth handles sign-up, login, email confirmation, password recovery and session refresh.
- Sessions are stored in cookies through `@supabase/ssr`. Middleware refreshes cookies on every matched request and redirects unauthenticated users away from protected prefixes.
- Protected prefixes: `/dashboard`, `/appointments`, `/profile`, `/settings`, `/onboarding`, `/manage`, `/platform`.
- When Supabase public configuration is missing, protected routes redirect to `/login?setup=1` and show explicit setup guidance instead of throwing.
- Signed-in users visiting `/login`, `/signup` or `/forgot-password` are redirected to `/dashboard`.
- Sign-out is a `POST` route (`/auth/sign-out`) so it is not triggerable by a cross-site image or link.
- Post-authentication `next` values are sanitized by `safeRedirectPath()` in `src/lib/redirects.ts`. Absolute, protocol-relative, backslash and encoded-separator URLs fall back to `/dashboard`.
- Password changes use Supabase Auth and require the current session. The UI never stores passwords locally.
- No custom JWT, cookie or password code exists in the application. Do not add one; use Supabase Auth.

## Authorization model

There are two independent role systems:

- `organization_members.role` — `OWNER`, `ADMIN`, `MANAGER`, `STAFF`. Scoped to one organization.
- `profiles.platform_role` — `USER` or `PLATFORM_ADMIN`. Cross-tenant.

Platform administrators are not implicitly organization members for writes, except where an RPC explicitly grants an override for support operations. `getOrgContext()` requires an active membership at the requested minimum role; the management layout renders a setup or access state rather than leaking data when membership is missing.

### Role expectations

| Capability | OWNER / ADMIN | MANAGER | STAFF |
| --- | --- | --- | --- |
| Organization settings, staff roles | Yes | No | No |
| Services, schedules, branches | Yes | Yes | No |
| Appointments, reschedule, cancel | Yes | Yes | Status updates only |
| Queue and scanner | Yes | Yes | Yes |
| Analytics, notifications, audit log | Yes | Yes | No |
| Platform console | Platform admin only | Platform admin only | Platform admin only |

The database is the final authority. Hiding a button is a usability measure, not a security control.

## Row Level Security

RLS is enabled on every public table.

| Table | Read | Write |
| --- | --- | --- |
| `profiles` | Own profile, platform admins, organization staff who share an appointment | Own profile columns only |
| `organizations` | Approved organizations publicly; members and platform admins see all | `OWNER`/`ADMIN` or platform admin update; platform admin delete |
| `branches`, `services`, `service_fields`, `working_hours`, `schedule_exceptions` | Approved organizations publicly; members see their own | `MANAGER`+ or platform admin |
| `availability_slots` | Approved organizations publicly; members see their own | No direct writes; RPC only |
| `organization_members`, `staff_assignments` | Self, fellow members, platform admins | `OWNER`/`ADMIN` (staff assignments allow `MANAGER`+) |
| `appointments` | Owning customer, organization members, platform admins | No direct writes; RPC only |
| `tokens` | Via the owning appointment | No direct writes; RPC only |
| `qr_credentials`, `token_sequences` | No API access | RPC only |
| `check_in_events` | Organization members, platform admins | RPC only |
| `reminder_events`, `notification_events`, `audit_logs` | `MANAGER`+ or platform admin | Server-side service role / RPC |
| `platform_settings` | Platform admins | RPC only |

Anonymous users can read approved discovery data and slots. They cannot read appointments, tokens, QR credentials, check-in history or operational logs.

RLS predicates (`is_org_member`, `org_role`, `is_platform_admin`, `can_view_profile`) are `SECURITY DEFINER` helpers with a fixed `search_path`. They are callable where RLS needs them but cannot be used to enumerate other tenants.

## Privileged database functions

All sensitive mutations run through `SECURITY DEFINER` functions:

- `create_booking` — validates organization status, maintenance mode, horizon, branch, service fields, duplicate bookings and slot capacity.
- `cancel_booking` — ownership or staff check, status guard, service cancellation policy and cutoff.
- `reschedule_booking` — ownership or manager check, status guard, atomic replacement.
- `update_appointment_status` — organization member check and an explicit transition table.
- `verify_qr` — organization membership, hashed reference lookup, tenant/branch scope, status and time window, duplicate check-in protection.
- `reissue_qr`, `reissue_qr_for_staff` — ownership or staff check; rotates the active credential.
- `set_organization_status`, `set_user_platform_role`, `update_platform_setting` — platform admin only; audited; self-demotion is blocked.
- `expire_stale_tokens` — service role only.

`0006_harden_function_grants.sql` removes the default `EXECUTE` grant from `PUBLIC` for internal helpers and grants only the intended surface. `0007_enforce_policies.sql` re-states the grants for the replaced functions and adds the registration and cancellation policy checks. If a new function is added, update the grants in the same migration.

Trigger functions on `auth.users`, `organizations` and `profiles` are not part of the API surface. Direct writes to `profiles.platform_role` and `organizations.status` are blocked for non-platform-admins by protective triggers, so a compromised client cannot promote itself.

## QR token security

1. **Opaque payload.** The QR encodes a random `tfq_...` reference. It contains no appointment ID, email, phone or token number.
2. **Hash at rest.** Only `sha256(reference)` is stored in `qr_credentials.reference_hash`. A database read does not reveal a usable code.
3. **One active credential.** Reissue revokes the previous credential. The customer ticket page reissues before rendering, limiting the lifetime of a screenshot.
4. **Tenant and branch scope.** `verify_qr` requires a member of the organization that owns the token and rejects a token presented at the wrong branch.
5. **Status and time window.** Cancelled, rescheduled, expired and terminal appointments are refused. Check-in is limited by `checkin_early_minutes` and `checkin_grace_minutes`.
6. **Duplicate protection.** The first successful scan moves the appointment to `CHECKED_IN`. A repeat scan returns `ALREADY_CHECKED_IN`, records a `DUPLICATE` event and does not change state. The state check runs inside the database function, so two concurrent scans cannot both succeed.
7. **Revocation.** Cancellation, reschedule, completion, expiration and no-show deactivate the credential.
8. **Token independence.** Each appointment owns its own token row. Issuing or rotating one token never alters another.

Tokens are not secrets shared between organizations. Treat the QR reference as a bearer credential for the duration of its active window, which is why rotation and status checks matter.

## Input validation

- Every route handler parses request data with a Zod schema from `src/lib/validation.ts`.
- `toAppError` maps `ZodError` to `VALIDATION`/422 and includes field paths, not raw stack traces.
- Database functions repeat critical validation: horizon dates, required dynamic fields, option values, service/branch consistency and status transitions.
- Dynamic field values are stored as JSONB and re-validated server-side; the client-side form is not trusted.
- SQL injection is avoided by using parameterized RPC arguments and PostgREST query builders. No string-concatenated SQL is executed from application code.

## Output and error handling

- API responses use `{ ok: true, data }` or `{ ok: false, error: { code, message, details? } }`.
- Unexpected errors are logged server-side and returned as a sanitized 500 message. Database error text is surfaced only where it is safe and actionable.
- Notification failures are logged and recorded, never allowed to roll back a booking.
- The UI does not render provider secrets, service-role keys or raw SQL errors.

## Secrets and configuration

| Secret | Exposure | Storage |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser | Safe to expose |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser | Safe to expose; RLS applies |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Vercel environment + Trigger.dev environment |
| `RESEND_API_KEY` | Server only | Vercel environment |
| `RESEND_FROM_EMAIL` | Server only | Vercel environment |
| `TRIGGER_SECRET_KEY` | Server only | Vercel environment + Trigger.dev |
| `TRIGGER_PROJECT_ID` | Server/CLI | Not a secret, still keep in environment config |
| `NEXT_PUBLIC_APP_URL` | Browser | Safe to expose |

Rules:

- Never prefix a secret with `NEXT_PUBLIC_`.
- `.env.local` is git-ignored. `.env.example` contains placeholders only.
- Rotate a key immediately if it was pasted into an issue, a commit or a screenshot.
- Use different Supabase projects and Resend keys for development and production.
- Vercel Preview environments should use a disposable or staging Supabase project, not production.

## Audit trail

`audit_logs` records privileged and lifecycle actions: organization creation and status changes, appointment create/cancel/reschedule, check-in results, token reissue, staff and role changes, and platform setting changes. Rows are readable by `MANAGER`+ and platform admins; application code writes through `log_audit` or the audited RPC, not through a broad client write policy.

Audit rows include `org_id`, `actor_id`, `action`, `entity_type`, `entity_id`, `details` and `created_at`. `ip_address` exists but is not populated by database RPCs; populate it from a trusted server context if your compliance requirements demand it.

## Abuse and rate limiting

The application exposes typed rate-limit errors but does not ship an in-process limiter. Vercel functions are stateless, so an in-memory limiter would be unreliable.

Add one of the following before a high-traffic launch:

- Vercel Firewall rules for `/api/bookings`, `/api/tokens/verify` and `/api/organizations/*/availability`;
- an upstream proxy or API gateway with per-IP and per-session limits;
- a durable counter (for example Upstash Redis) behind the route handlers.

Recommended starting points: 10 booking attempts per minute per user, 30 verification attempts per minute per staff user, 60 availability lookups per minute per IP.

## Data protection and retention

- Soft-disable branches, services and staff rather than deleting history where possible.
- Deleting an auth user cascades to their profile; appointment and audit references use `set null` or snapshots so tenant history remains readable.
- QR credentials are hashed and can be revoked; do not add plaintext reference storage.
- Notification rows contain recipient email addresses. Restrict access to `MANAGER`+ and platform admins.
- Back up Supabase according to your plan. Test a restore before relying on it.
- If you add file uploads, keep them in a private bucket with signed URLs and organization-scoped policies.

## Security checklist for a release

1. Migrations `0001`–`0007` applied in order to the target project.
2. `0006` present; confirm internal helpers are not executable by `anon` or `authenticated` unless intended.
3. `0007` present; verify `organization_registration_open()` and cancellation policy behavior.
4. RLS enabled on every public table; run the queries in `docs/testing.md`.
5. Service-role key absent from the browser bundle and from client components.
6. Post-auth redirect sanitization in place (`safeRedirectPath`).
7. Supabase redirect URLs limited to the real app origins.
8. Resend domain verified; sender matches the product.
9. Trigger.dev environment contains the service-role key and project ID.
10. Platform administrators reviewed; at least two admins with recovery access.
11. Maintenance mode and registration switches tested.
12. Edge rate limits configured for public and verification endpoints.
13. Dependency audit reviewed and production logs monitored.
14. Backups and restore procedure confirmed.
