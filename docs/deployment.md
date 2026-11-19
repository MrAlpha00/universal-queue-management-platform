# Deployment

TokenFlow deploys as a single Next.js application on Vercel, backed by Supabase, Resend and Trigger.dev. This guide covers a first production deployment, the required provider configuration and the checks to run before and after going live.

## 1. Prerequisites

- A production Supabase project (separate from development).
- A Resend account with a verified sending domain.
- A Trigger.dev project (v4) for reminders and the expiration schedule.
- A Vercel account with the repository connected.
- A production domain, for example `app.yourdomain.com`.
- Node.js 22+ and Corepack locally for running migrations and deploying tasks.

The repository includes `vercel.json`:

```json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "installCommand": "corepack enable && pnpm install --frozen-lockfile",
  "regions": ["iad1"]
}
```

Change `regions` if your Supabase project and users are in another region. Keep the function region close to the database to reduce latency.

## 2. Prepare Supabase

1. Create the production project and store the database password in your password manager.
2. Apply migrations `0001`–`0007` **in numeric order**:

   ```bash
   supabase link --project-ref <production-ref>
   supabase db push
   ```

   Or paste each file into the SQL editor in order. Do not skip `0006_harden_function_grants.sql` (function exposure) or `0007_enforce_policies.sql` (registration and cancellation policy).
3. Verify:

   ```sql
   select count(*) from public.platform_settings; -- 4
   select tablename, rowsecurity from pg_tables
   where schemaname = 'public' order by tablename;
   ```

   Every application table should show `rowsecurity = true`.
4. In **Authentication → URL Configuration**:
   - Site URL: `https://app.yourdomain.com`
   - Redirect URLs:
     - `https://app.yourdomain.com/auth/callback`
     - `https://app.yourdomain.com/auth/confirm`
     - `http://localhost:3000/auth/callback` (keep only if you still develop against this project)
     - `http://localhost:3000/auth/confirm`
5. Configure Supabase Auth emails (confirmation, recovery) with the product name and a sender on the verified domain. Booking email is sent by Resend, not Supabase.
6. Copy the project URL, publishable key and service-role key for the next step.
7. Enable point-in-time recovery or scheduled backups appropriate to your plan.

### Production data notes

- Migrations seed only `platform_settings`. There is no demo data.
- Create the first platform administrator after the first sign-up:

  ```sql
  update public.profiles
  set platform_role = 'PLATFORM_ADMIN'
  where email = 'admin@yourdomain.com';
  ```

- Use `/platform/settings` to decide on auto-approval, public registration, the default booking horizon and maintenance mode.

## 3. Configure Resend

1. Add and verify the sending domain in Resend (SPF, DKIM and DMARC as instructed).
2. Create a production API key restricted to sending.
3. Set `RESEND_FROM_EMAIL` to a sender on that domain, for example `TokenFlow <tickets@yourdomain.com>`.
4. Send a real booking confirmation and inspect the `notification_events` row and Resend delivery log.

If Resend is not configured, bookings still succeed and delivery rows are recorded as `SKIPPED`. Do not ship without email if customers rely on reminders.

## 4. Configure Trigger.dev

1. Create the production project in Trigger.dev.
2. Set the project ref locally as `TRIGGER_PROJECT_ID` and authenticate the CLI with your Trigger.dev account.
3. In the Trigger.dev environment variables for the production environment, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `NEXT_PUBLIC_APP_URL`
4. Deploy the tasks:

   ```bash
   corepack pnpm trigger:deploy
   ```

5. Confirm in the Trigger.dev dashboard that:
   - `token-expiration` is scheduled at `*/5 * * * *`;
   - `appointment-reminder` exists and accepts delayed runs;
   - a test run can reach Supabase.

Trigger.dev uses the service-role key. Treat that environment as production-sensitive and limit access to the project.

## 5. Deploy on Vercel

1. Import the repository into Vercel.
2. Framework preset: **Next.js**. Build and install commands come from `vercel.json`.
3. Add environment variables for **Production** and **Preview**:

   | Variable | Production value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<project>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Service-role key (Sensitive) |
   | `RESEND_API_KEY` | Resend API key (Sensitive) |
   | `RESEND_FROM_EMAIL` | `TokenFlow <tickets@yourdomain.com>` |
   | `TRIGGER_PROJECT_ID` | Trigger.dev project ref |
   | `TRIGGER_SECRET_KEY` | Trigger.dev secret key (Sensitive) |
   | `NEXT_PUBLIC_APP_URL` | `https://app.yourdomain.com` |

4. Use a staging or disposable Supabase project for Preview if possible. Preview deployments should not write to production data.
5. Deploy. The first build runs `pnpm build`.
6. Add the production domain in Vercel and update DNS. Keep the Vercel-generated URL available for diagnostics.
7. Update `NEXT_PUBLIC_APP_URL` and the Supabase redirect URLs if the final domain differs from the one used during the first deploy.

### Build behavior

- `output` is not overridden; Vercel uses the standard Next.js build.
- The `src/proxy.ts` convention refreshes Supabase session cookies. `allowDevOrigins` permits `127.0.0.1` for Playwright's dev server.
- Page routes that read session or database state are `force-dynamic`; there is no attempt to statically cache tenant data.
- `next.config.ts` sets security headers: `nosniff`, `strict-origin-when-cross-origin`, `DENY` framing and a camera-only permissions policy.

## 6. Post-deploy verification

Run these checks against the production URL:

1. `/` renders and the header/footer links work over HTTPS.
2. `/login` does not show the setup notice; a real account can sign in.
3. `/dashboard` redirects anonymous visitors to `/login`.
4. An organization can be created and appears as `PENDING` in `/platform/organizations`.
5. Approving the organization makes it visible in `/organizations`.
6. A customer can book, receives a token, and the QR ticket renders.
7. A staff scan returns check-in; a second scan returns `ALREADY_CHECKED_IN`.
8. Cancellation respects `allow_cancellation` and `cancellation_hours`.
9. A booking confirmation row appears in `notification_events` with `SENT`; a reminder run appears in Trigger.dev.
10. `/manage/<slug>/overview` denies a non-member and allows a member.
11. `/platform/overview` denies a normal user and allows a platform admin.
12. `POST /api/bookings` with an invalid body returns 422 with field details.
13. Security headers are present on the HTML response.
14. No service-role key appears in the browser bundle (`grep` the built client chunks if unsure).

## 7. Rollback and recovery

- **Application rollback** — promote the previous Vercel deployment. Environment variables are deployment-scoped, so confirm they still match the database.
- **Migration rollback** — migrations are forward-only. Write a new corrective migration; do not edit an applied file. Test on a disposable project first.
- **Supabase recovery** — use the provider backup or PITR point. After restoring, re-check function grants and RLS because a partial restore can leave them inconsistent.
- **Job recovery** — pause the `token-expiration` schedule if it is producing incorrect state. Scanning expires stale tokens lazily, so check-in correctness does not depend on the cron.
- **Email incident** — disable the affected event type in organization settings or rotate the Resend key. Bookings are never rolled back by email failure.

## 8. Operations

### Monitoring

- Vercel function logs for unexpected 500s and database errors.
- Supabase logs for failed queries and RLS denials.
- Resend delivery and bounce events.
- Trigger.dev run history, retries and failures.
- `notification_events` and `reminder_events` for delivery drift.

Add an external uptime check for `/` and authenticated smoke checks for `/dashboard` and a management overview if your plan allows synthetic sessions.

### Scaling notes

- The booking path is database-bound by design. Keep the Vercel region near Supabase.
- Availability is generated lazily per requested date; high traffic on one date will contend on the slot rows. Capacity is protected by row locks.
- The expiration sweep runs every five minutes and processes at most the appointments that have ended. If volume grows, batch the sweep or use a queue.
- The platform console and analytics queries are read-only; add indexes before adding new aggregate views.

### Cost controls

- Trigger.dev runs per reminder plus a five-minute schedule.
- Resend charges per delivered email; reminder offsets can be reduced per organization.
- Supabase compute and storage dominate at scale; monitor the database before increasing Vercel concurrency.

## 9. Release checklist

- [ ] Migrations applied through `0007` and verified.
- [ ] RLS enabled on all public tables.
- [ ] Internal function grants reviewed after `0006`/`0007`.
- [ ] Production environment variables set for Vercel and Trigger.dev.
- [ ] Supabase Auth URLs restricted to real origins.
- [ ] Resend domain verified and a live email received.
- [ ] Trigger.dev tasks deployed and the schedule visible.
- [ ] First platform administrator promoted and a second admin added.
- [ ] Booking, scan, duplicate scan, cancel and reschedule exercised.
- [ ] Rate limits configured at the edge for public endpoints.
- [ ] Backups and restore path confirmed.
- [ ] `docs/security.md` checklist reviewed.
