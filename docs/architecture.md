# Architecture

TokenFlow is a single Next.js application that serves three experiences over one PostgreSQL database:

- a public marketing and documentation site,
- a customer workspace for discovery, booking and QR tickets,
- an organization workspace and a platform super-admin console.

The design keeps trust boundaries explicit: browser code uses the Supabase publishable key under Row Level Security, while sensitive operations run in server components, route handlers, server actions or Trigger.dev tasks.

## Runtime topology

```text
Browser
  │  HTML / RSC / JSON
  ▼
Next.js on Vercel
  ├── proxy ──────────────── refreshes Supabase auth cookies, gates protected routes
  ├── Server Components ── render with the caller's cookie session (RLS)
  ├── Route Handlers    ── typed JSON envelope for the public API
  ├── Server Actions    ── authenticated management mutations
  └── Service modules   ── domain logic, Supabase clients, email helpers
        │
        ├── Supabase Auth ──────────────── identity, sessions, auth email
        ├── Supabase Postgres + RLS ───── data, RPCs, constraints, audit
        ├── Resend + React Email ──────── transactional email
        └── Trigger.dev ───────────────── delayed reminders, expiration sweep
```

No application server holds database credentials beyond the configured environment. Vercel functions are stateless; all durable state lives in Supabase or Trigger.dev.

## Route groups

| Group | Path prefix | Responsibility |
| --- | --- | --- |
| `(public)` | `/`, `/features`, `/how-it-works`, `/platform-capabilities`, `/about`, `/contact`, `/docs` | Marketing, product information, in-app documentation |
| `(auth)` | `/login`, `/signup`, `/forgot-password` | Authentication and account recovery, with a shared visual shell |
| `(customer)` | `/dashboard`, `/organizations`, `/book`, `/appointments`, `/profile`, `/settings`, `/onboarding` | Customer experience, wrapped in the dashboard shell |
| `manage/[orgSlug]` | `/manage/<slug>/…` | Organization operations, wrapped in the management shell |
| `platform` | `/platform/…` | Platform super-admin console |
| `api` | `/api/…` | JSON endpoints for bookings, availability, tokens, schedules, organizations |
| `auth` | `/auth/callback`, `/auth/confirm`, `/auth/sign-out` | OAuth/PKCE callback, email token confirmation, session termination |

Server components are the default. Client components are used only where interaction requires them: forms, charts, menus, the booking flow, the QR scanner and ticket display.

## Request lifecycle

### Page request

1. The proxy (`src/proxy.ts` → `src/lib/supabase/proxy.ts`) refreshes the Supabase session cookies.
2. If Supabase is not configured, protected prefixes redirect to `/login?setup=1`.
3. If there is no user and the route is protected, the user is redirected to `/login?next=…`.
4. If there is a user on an auth page, they are redirected to `/dashboard`.
5. The page's layout resolves the session and organization context. Customer and management layouts render an honest `SetupRequired` state when configuration or membership is missing.
6. Services (`src/services/*`) query Supabase with the request-scoped client. RLS applies unless the service explicitly uses the admin client described below.

Protected prefixes: `/dashboard`, `/appointments`, `/profile`, `/settings`, `/onboarding`, `/manage`, `/platform`.

### JSON API request

1. The route parses and validates the body/query with a schema from `src/lib/validation.ts`.
2. The service calls `requireSession`/`requirePlatformAdmin` or relies on RLS and RPC authorization.
3. Success returns `{ ok: true, data }`; failures are normalized by `toAppError` into `{ ok: false, error: { code, message, details? } }`.
4. Zod failures become HTTP 422 with field paths. Unexpected errors are logged server-side and return a sanitized 500 message.

### Booking request

```text
POST /api/bookings
  → bookingInputSchema.parse
  → createBooking()
  → supabase.rpc('create_booking', …)
      ├── validate service, org status, maintenance mode
      ├── validate booking horizon in the organization timezone
      ├── validate branch, service fields and duplicate booking
      ├── generate slots lazily
      ├── SELECT … FOR UPDATE the slot row
      ├── insert appointment, increment capacity atomically
      ├── allocate daily token number from token_sequences
      ├── generate opaque QR reference, store SHA-256 hash only
      └── write audit log
  → send booking confirmation email (best effort, recorded)
  → create reminder rows and Trigger.dev delayed runs (best effort)
  → respond with appointment, token and one-time QR reference
```

The database transaction is the source of truth. Email and job failures never roll back a booking.

## Data access layers

| Layer | Example | Trust level |
| --- | --- | --- |
| Browser Supabase client | Realtime-free auth calls, password reset | Publishable key, RLS |
| Request-scoped server client | Pages, services, RPC calls | User cookies + RLS |
| Admin client | Email logging, reminder jobs, expiration | Service role, bypasses RLS |
| Database functions | Booking, QR verification, admin status changes | `SECURITY DEFINER`, explicit checks and grants |

`createClient()` in `src/lib/supabase/server.ts` must be used for anything that should be scoped to the signed-in user. `createAdminClient()` is reserved for trusted server modules and never imported into client code.

## Domain services

| Module | Responsibility |
| --- | --- |
| `services/auth.ts` | Session, profile, platform-admin checks, organization context and role minimums |
| `services/organizations.ts` | Discovery, organization CRUD, services, branches, platform status changes |
| `services/availability.ts` | Booking-day calculation, slot lookup, schedule data, slot generation |
| `services/bookings.ts` | Booking, cancel, reschedule, appointment listings, check-in history |
| `services/tokens.ts` | QR verification, reissue, QR image generation |
| `services/notifications.ts` | Resend delivery, notification log, reminder scheduling and cancellation |
| `services/management.ts` | Management dashboards, queues, analytics, staff and settings data |
| `services/platform.ts` | Cross-organization metrics, users, bookings, activity |
| `services/audit.ts` | Audit log writes for application-level mutations |

## State machines

### Appointment and token

The token mirrors the appointment status. Allowed operator transitions are enforced in `update_appointment_status`:

```text
BOOKED      → CANCELLED | EXPIRED | NO_SHOW
CHECKED_IN  → IN_PROGRESS | CANCELLED | NO_SHOW
IN_PROGRESS → COMPLETED | CANCELLED
EXPIRED     → NO_SHOW
others      → none
```

Booking creates `BOOKED`. Verification moves `BOOKED` to `CHECKED_IN` exactly once; repeat scans record a `DUPLICATE` check-in event and do not change status. Cancellation, reschedule, completion, expiration and no-show revoke active QR credentials.

### Organization

```text
PENDING → APPROVED | REJECTED
APPROVED → SUSPENDED
SUSPENDED → APPROVED
```

Status changes are only possible through the platform RPC; a trigger blocks direct status modification by non-platform-admins. A pending organization can still be configured by its members, but it is not publicly discoverable and booking creation is refused.

## Background work

Trigger.dev owns time-based work because Vercel functions are request-scoped:

- **Reminders** are stored in `reminder_events` with a unique idempotency key, then triggered with a delay. The task re-checks the row status, appointment status and start time before sending. Retries cannot send twice.
- **Expiration** runs every five minutes, calls the service-role-only `expire_stale_tokens`, and sends at most one expiration email per appointment.

Scanning also expires a stale token lazily, so check-in remains correct if the cron is unavailable.

## Error and configuration strategy

- `AppError` carries a stable code, HTTP status and optional details.
- Missing optional providers degrade explicitly: `SKIPPED` notification rows, setup calls in the UI, and documented behavior instead of silent failures.
- Required configuration is validated lazily at the point of use, keeping the marketing site renderable without secrets.
- There is no in-process rate limiter. Public endpoints return typed rate-limit errors and should be protected at the edge (Vercel Firewall or an upstream proxy).

## Extension points

- **Branding** — `src/config/brand.ts` and the tokens in `src/app/globals.css`.
- **Statuses and roles** — `src/config/constants.ts` plus the corresponding PostgreSQL enums.
- **Service-specific questions** — `service_fields` with typed options; no schema migration per field.
- **Notification channels** — add a delivery adapter alongside `sendEmail` while preserving `notification_events`.
- **Platform settings** — add keys to `platform_settings` and a control in `/platform/settings`.

## Known constraints

- Email is the only notification channel in this release.
- The product is hardware-free; scanning uses the device camera or manual entry.
- Organization approval is manual unless auto-approval is enabled.
- Migrations must be validated against a disposable Supabase project before production rollout.
- The Next.js 16 `proxy` convention is used instead of the deprecated `middleware` name. Route protection compares full path segments, so public pages such as `/platform-capabilities` are not mistaken for the `/platform` console.
