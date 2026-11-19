# Setup guide

This guide takes a fresh checkout to a working local TokenFlow environment. The marketing site renders without any external services, but authentication, booking, email and background jobs require the providers below.

## 1. Prerequisites

- Node.js 22 or newer (Node 24 is used by the Trigger.dev runtime).
- Corepack, which ships with Node. This repository pins `pnpm@12.21.0`.
- A Supabase project (free tier is sufficient for development).
- Optional: a Resend account and a Trigger.dev project for email and durable jobs.
- Optional: the Supabase CLI if you prefer `supabase db push` over the SQL editor.

```bash
corepack enable
corepack pnpm install
```

## 2. Environment variables

Copy the example file and fill in the values you have:

```bash
cp .env.example .env.local
```

| Variable | Required | Exposure | Where to find it |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Browser | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Browser | Supabase → Project Settings → API keys |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes for jobs/email | Server only | Supabase → Project Settings → API keys |
| `RESEND_API_KEY` | Optional | Server only | Resend → API Keys |
| `RESEND_FROM_EMAIL` | Optional | Server only | A verified Resend sender |
| `TRIGGER_PROJECT_ID` | Optional | Server/CLI | Trigger.dev → Project settings |
| `TRIGGER_SECRET_KEY` | Optional | Server only | Trigger.dev → API keys |
| `NEXT_PUBLIC_APP_URL` | Recommended | Browser | `http://localhost:3000` locally, canonical URL in production |

Rules:

- Never prefix a secret with `NEXT_PUBLIC_`. Anything with that prefix is shipped to the browser.
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. It is only read by trusted server modules (email logging, reminder jobs, privileged lookups).
- `.env.local` is git-ignored. Do not commit filled-in environment files.
- Restart the dev server after changing `.env.local`.

Without Supabase values, marketing pages still render and protected routes redirect to `/login?setup=1` with a setup callout. Without Resend, email deliveries are recorded as `SKIPPED`. Without Trigger.dev, reminder rows are created but delayed runs and the expiration schedule do not execute.

## 3. Prepare Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Apply the migrations in `supabase/migrations/` **in numeric order**:
   - `0001_schema.sql` — enums, tables, indexes, triggers.
   - `0002_functions.sql` — authorization helpers, slot generation, atomic booking/reschedule/cancel, QR verification, expiration, reissue.
   - `0003_rls.sql` — row-level security policies and grants.
   - `0004_admin_functions.sql` — availability discovery and management RPCs.
   - `0005_platform_console.sql` — platform role and setting RPCs.
   - `0006_harden_function_grants.sql` — explicit function grants; internal helpers are removed from the API surface.
   - `0007_enforce_policies.sql` — registration gate and service cancellation policy enforced in the database.

   With the CLI:

   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```

   Or paste each file into the Supabase SQL editor in order. Do not skip `0006`: earlier migrations rely on PostgreSQL's default `EXECUTE` grant to `PUBLIC`, which would expose internal helpers over PostgREST. Do not skip `0007`: it enforces the registration switch and the customer cancellation policy.

3. Verify the schema:

   ```sql
   select count(*) from public.platform_settings; -- 4 default rows
   select proname, prosecdef from pg_proc
   where pronamespace = 'public'::regnamespace
   order by proname;
   ```

4. Copy the project URL, publishable key and service-role key into `.env.local`.

### Authentication URLs

In **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000` for local development, your production URL otherwise.
- **Redirect URLs**:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/auth/confirm`
  - `https://your-domain.com/auth/callback`
  - `https://your-domain.com/auth/confirm`

Email confirmation and password recovery links use these routes. The callback exchanges a PKCE code for a session; `/auth/confirm` verifies a token hash for email/recovery links.

### Email templates

Supabase sends authentication email (confirmation, recovery). Configure the sender and templates in **Authentication → Emails**. Booking confirmations, reminders and status updates are sent by Resend from the application, not by Supabase.

## 4. Create the first platform administrator

Sign up through the app, verify the email, then promote the account once from the SQL editor:

```sql
update public.profiles
set platform_role = 'PLATFORM_ADMIN'
where email = 'you@example.com';
```

Reload the app and open `/platform/overview`. After the first administrator exists, additional administrators can be promoted from `/platform/users`. The privileged RPC prevents an administrator from removing their own access.

## 5. Configure Resend (optional)

1. Create a Resend account and verify the sending domain.
2. Create an API key.
3. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` (for example `TokenFlow <tickets@yourdomain.com>`).
4. Send a test booking to confirm delivery.

Every attempt writes a row to `notification_events` with `SENT`, `FAILED` or `SKIPPED`. Organization settings can disable specific email types; reminders use `org.settings.reminder_offsets_minutes`.

## 6. Configure Trigger.dev (optional)

1. Create a Trigger.dev project.
2. Set `TRIGGER_PROJECT_ID` and `TRIGGER_SECRET_KEY`.
3. Run the tasks locally in a second terminal:

   ```bash
   corepack pnpm trigger:dev
   ```

4. Deploy for production:

   ```bash
   corepack pnpm trigger:deploy
   ```

Tasks:

- `appointment-reminder` — delayed per-reminder run with an idempotency key, retries and a status re-check before delivery.
- `token-expiration` — cron `*/5 * * * *` calling `expire_stale_tokens` and sending one expiration email per appointment.

Trigger.dev needs `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in its own environment so tasks can use the admin client.

## 7. Run the app

```bash
corepack pnpm dev
```

Open `http://localhost:3000`. The database starts empty by design: there is no seed script and no mock production content.

### First-run walkthrough

1. Sign up as an **organization** account. You are redirected to `/onboarding/organization` even before email confirmation is complete if Supabase returns a session.
2. Create the organization. A `PENDING` organization is created with you as `OWNER`; a trigger creates a `Main branch` and weekday 09:00–17:00 working hours.
3. Open the management workspace at `/manage/<slug>/overview`. Configure services, dynamic fields and schedules while approval is pending.
4. Approve the organization from `/platform/organizations` (or enable auto-approval in `/platform/settings`).
5. In another browser (or after signing out), sign up as a customer and book a service. The confirmation email and reminders are recorded even when Resend is not configured.
6. Open the QR ticket, then scan it from `/manage/<slug>/scanner` or paste the reference manually.

## 8. Verify the installation

- `/` renders the landing page.
- `/login` shows a setup notice only when Supabase is missing; with credentials it accepts a real account.
- `/dashboard` requires a session.
- `/manage/<slug>/overview` requires active membership (platform administrators can inspect any workspace).
- `/platform/overview` requires `platform_role = 'PLATFORM_ADMIN'`.
- A booking creates an `appointments`, `tokens` and `qr_credentials` row. The QR reference is never stored in plaintext.
- A second scan of the same token returns `ALREADY_CHECKED_IN` without changing state.
- `notification_events` records a `BOOKING_CONFIRMATION` row for every booking (status `SENT` or `SKIPPED`).

## 9. Troubleshooting

| Symptom | Likely cause | Resolution |
| --- | --- | --- |
| Redirect loop to `/login?setup=1` | Supabase URL/key missing | Add both public values and restart |
| `new row violates row-level security policy` | Migration not applied or wrong project | Apply migrations in order; confirm the project ref |
| Organization cannot be created | Slug already exists | Choose another slug; the API returns `CONFLICT` |
| Customer cannot book | Organization is `PENDING`, `SUSPENDED` or rejected; no service/availability | Approve the organization, add services, check working hours |
| No reminder emails | Resend or Trigger.dev not configured | Inspect `reminder_events` and `notification_events` |
| Camera scanner does not start | Browser blocks camera on insecure origins | Use `localhost` or HTTPS and grant camera permission; manual entry always works |
| `permission denied for function` | `0006` not applied, or calling an internal helper | Apply `0006`; call only documented RPCs |
| Organization registration unexpectedly allowed or blocked | `0007` not applied, or platform setting changed | Apply `0007`; check `/platform/settings` |
| Customer can cancel inside a closed window | `0007` not applied | Apply `0007` and re-test the service policy |
| Build fails on missing env | `NEXT_PUBLIC_APP_URL` invalid | Use a valid absolute URL |

## 10. Next steps

- [Architecture](architecture.md)
- [Database schema](database-schema.md)
- [Security model](security.md)
- [Deployment](deployment.md)
- [Testing](testing.md)
