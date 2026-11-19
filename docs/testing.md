# Testing

TokenFlow uses three layers of verification:

1. **Vitest** for pure logic, validation, formatting and component behavior.
2. **Playwright** for the public site, the auth gate and the JSON API envelope.
3. **Manual database exercises** against a disposable Supabase project for RLS, RPC behavior, capacity and QR lifecycle.

The unit and e2e suites run without secrets. Database behavior requires a real Supabase project and cannot be meaningfully mocked.

## Commands

| Command | Purpose |
| --- | --- |
| `corepack pnpm typecheck` | TypeScript with `--noEmit` |
| `corepack pnpm lint` | ESLint over the repository |
| `corepack pnpm test` | Vitest run, single pass |
| `corepack pnpm test:watch` | Vitest watch mode |
| `corepack pnpm test:e2e` | Playwright with a local dev server |
| `corepack pnpm build` | Production build |
| `corepack pnpm exec playwright install chromium` | One-time browser install |

Recommended local gate before committing:

```bash
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
corepack pnpm build
```

Run the e2e suite before a release, and the database checklist whenever a migration changes.

## Unit and component tests

Configuration: `vitest.config.mts`. The environment is `jsdom`, globals are enabled, setup lives in `src/test/setup.ts`, and the `@` alias points at `src`. Test files are `src/**/*.{test,spec}.{ts,tsx}`; `e2e/` is excluded.

| File | Covers |
| --- | --- |
| `src/lib/api.test.ts` | API success/error envelope and error mapping |
| `src/lib/errors.test.ts` | Stable error codes and HTTP status mapping |
| `src/lib/validation.test.ts` | Booking, cancellation, availability, token and schedule schemas |
| `src/lib/utils.test.ts` | Slugify, initials, truncation, currency, number formatting, safe JSON |
| `src/lib/env.test.ts` | Lazy environment parsing, app URL fallback and integration readiness |
| `src/lib/cancellation.test.ts` | Cancellation status, service switch and cutoff boundary |
| `src/lib/redirects.test.ts` | Same-origin post-auth redirects and encoded URL tricks |
| `src/services/availability.test.ts` | Booking-day generation in the organization timezone and horizon |
| `src/services/notifications.test.ts` | Time labels, lead-time labels, date formatting, subjects and links |
| `src/config/constants.test.ts` | Status/role lists and status style coverage |
| `src/components/ui/button.test.tsx` | Variants, loading and disabled behavior |
| `src/components/ui/badge.test.tsx` | Tone classes and `StatusBadge` labels |
| `src/components/ui/empty-state.test.tsx` | Title, description and action rendering |
| `src/components/ui/stat-card.test.tsx` | Metric rendering and optional trend |

### Testing patterns

- Prefer testing pure functions directly. Server components and route handlers are integration surfaces; verify them with the API and database checks below.
- Use `vi.stubEnv` and `vi.unstubAllEnvs()` for environment tests. Do not write to `process.env` directly.
- Use relative or absolute instants in date tests and assert in a fixed timezone. `getBookingDays` is tested with a faked clock at `2026-03-10T23:30:00.000Z` to prove the organization timezone, not the runner timezone, drives the result.
- For component tests, query by role and accessible name. Avoid class-name assertions except where a variant contract is the behavior under test.
- Keep fake data inside the test that needs it. Do not add seed data or fixtures that the application could import.

Current baseline: all unit and component tests pass across the 15 test files listed above. The count changes as coverage grows; treat a failure as a regression, not a number to update.

### Coverage

A Vitest coverage block is configured for V8 with text, HTML and LCOV reporters. The provider package is not installed by default. To run coverage:

```bash
corepack pnpm add -D @vitest/coverage-v8
corepack pnpm exec vitest run --coverage
```

Coverage excludes application routes, emails and tasks, which are exercised through the build, the API and manual provider checks.

## End-to-end tests

Configuration: `playwright.config.ts`. Tests live in `e2e/` and run in Chromium.

- Default port: `3100`. Override with `PLAYWRIGHT_PORT`.
- Set `PLAYWRIGHT_BASE_URL` to test an already-running deployment; the config then skips its own web server.
- The managed web server runs `corepack pnpm dev --port <port>` and reuses an existing server outside CI.
- Traces are recorded on the first retry; screenshots and video are kept only on failure.

### What is covered

`e2e/public.spec.ts`:

- landing page title, hero headings and primary CTAs;
- every public information page returns 200 with a heading, header and footer;
- the login setup notice when Supabase configuration is absent;
- client-side login validation before any API call;
- the protected-route gate redirects `/dashboard` to `/login`.

`e2e/api.spec.ts`:

- invalid booking payload returns 422 with field paths;
- incomplete availability query returns 422;
- malformed token verification returns 422.

These tests intentionally run without credentials. They verify the honest unconfigured state and the validation layer. Authenticated flows belong in the manual checklist or in a credential-backed CI project.

### Adding an authenticated e2e test

1. Create a dedicated Supabase test project and a test user.
2. Add the credentials as CI secrets only. Never commit them.
3. Use Playwright storage state or a setup project that signs in once.
4. Keep the test data namespaced (`e2e-<timestamp>`) and clean up organizations and appointments.
5. Do not point authenticated e2e tests at production.

## Manual database checklist

Run this against a disposable Supabase project after applying migrations. Apply `0001`–`0007` from scratch first, then repeat on an upgrade path if migrations changed.

The Supabase SQL editor runs with elevated privileges and **bypasses RLS**. Use it for schema checks, and use the app or a normal authenticated client for RLS and RPC authorization tests.

### Schema and grants

```sql
-- Every application table must have RLS enabled.
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

-- Platform settings should have four seeded rows.
select key, value from public.platform_settings order by key;

-- Review the public function surface and security definer flag.
select p.proname, p.prosecdef,
       coalesce(array_to_string(p.proacl, ' | '), '(default)') as acl
from pg_proc p
where p.pronamespace = 'public'::regnamespace
order by p.proname;
```

Confirm that `_insert_booking_internal`, `_next_token_number`, `log_audit`, `setting_bool` and `setting_int` are not executable by `anon` or `authenticated`. `0006` should have removed the default `PUBLIC` grant.

### RLS

1. Sign in as customer A and create a booking with organization A.
2. Sign in as customer B in a private window.
3. Confirm customer B cannot open `/appointments/<A-id>`, query the appointment through PostgREST, or read A's token or QR row.
4. Sign in as staff of organization B and confirm the token from organization A cannot be verified (`WRONG_ORGANIZATION`).
5. Confirm a non-member cannot open `/manage/<org-a-slug>/overview`.
6. Confirm an anonymous request to `/organizations` sees only `APPROVED` organizations.

### Booking and capacity

1. Create a service with one slot of capacity 1.
2. Send two simultaneous `POST /api/bookings` requests for the same slot from two customers.
3. Exactly one should succeed; the other should receive a `SLOT_UNAVAILABLE`/409 response. `availability_slots.booked_count` must remain `1`.
4. Cancel the successful booking and confirm `booked_count` returns to `0`.
5. Reschedule and confirm the old slot is released and the new slot is incremented.
6. Attempt a second active booking for the same customer, service and date. It should be rejected as a conflict.

### Cancellation policy

1. Set a service to `allow_cancellation = false`; confirm the customer UI hides cancel and the API returns a validation error.
2. Set `allow_cancellation = true` and `cancellation_hours = 2`.
3. With an appointment more than two hours away, cancel succeeds.
4. With an appointment inside two hours, the customer UI explains the closed window and the API refuses.
5. As a manager, confirm staff override still cancels inside the window and the audit entry records `policy_override`.

### Registration and approval

1. Disable `allow_public_registration` in `/platform/settings`.
2. Confirm `/onboarding/organization` hides the form and a direct insert is rejected by the trigger.
3. Sign up as a customer and confirm the flow continues to `/dashboard`.
4. As a platform admin, create or approve an organization while registration is closed; admin creation must still work.
5. Approve a pending organization and confirm it becomes discoverable and bookable.

### QR lifecycle

1. Book an appointment and open the ticket page. Confirm the QR reference is not stored in `qr_credentials` (only `reference_hash`).
2. Scan the current code as staff. It becomes `CHECKED_IN` and a `check_in_events` row records `CHECKED_IN`.
3. Scan the same code again. The result is `ALREADY_CHECKED_IN`, a `DUPLICATE` row is written, and the status does not change.
4. Reload the ticket page. A new credential is active and the previous hash is revoked.
5. Scan the old code. It is rejected as invalid.
6. Cancel a booking and confirm the active QR is revoked and a subsequent scan returns `CANCELLED`.
7. Move the appointment past its end time, run `expire_stale_tokens`, and confirm `EXPIRED`, revoked credentials and a cancelled reminder set.

### Email and reminders

1. With Resend configured, make a booking and confirm `notification_events` has a `BOOKING_CONFIRMATION` row with `SENT` and a provider ID.
2. Without Resend, repeat and confirm the row is `SKIPPED` while the booking still succeeds.
3. Confirm `reminder_events` rows match `org.settings.reminder_offsets_minutes` and carry unique idempotency keys.
4. Cancel or reschedule and confirm pending reminders become `CANCELLED`.
5. In Trigger.dev, run a reminder manually. A second run must not send twice.

## CI suggestion

A minimal GitHub Actions pipeline:

```yaml
name: verify
on: [push, pull_request]
jobs:
  app:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 12.21.0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
  e2e:
    runs-on: ubuntu-latest
    needs: app
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 12.21.0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:e2e
        env:
          NEXT_TELEMETRY_DISABLED: "1"
```

Do not add Supabase, Resend or Trigger.dev secrets to pull-request workflows from forks. Use a separate, manually approved job for credential-backed integration tests.

## Known gaps

- No authenticated browser suite is included by default; the manual checklist covers it.
- Database functions are not unit tested in SQL. Validate them on a disposable project.
- Email rendering is checked through the templates and provider delivery, not with snapshot tests.
- Camera scanning requires a secure origin and a real device or a browser with a fake camera; the manual path is the fallback.
- The application does not ship an in-process rate limiter, so rate-limit behavior is verified at the edge.
