# TokenFlow

TokenFlow is a production-oriented, multi-organization appointment and digital token platform. Organizations publish services and availability, customers book appointments and receive secure QR tickets, and staff manage the queue, check-ins and notifications from one workspace. A separate platform console handles organization approval, user roles and global settings.

The application is industry-independent and hardware-free in this release: the QR code is displayed on the customer's phone and scanned with the staff device camera or entered manually.

## What is included

- **Customer experience** — discovery, organization pages, a guided booking flow, appointment history, QR ticket, profile and account settings.
- **Organization workspace** — overview, appointments, live queue, QR scanner, tokens, services with dynamic booking fields, schedules, branches, customers, staff, notification history, analytics, audit log and settings.
- **Platform console** — cross-organization metrics, organization approval/suspension, user platform roles, global bookings and notification activity, platform settings.
- **Booking engine** — database-level slot generation and capacity reservation with atomic booking, cancellation and reschedule RPCs.
- **Token lifecycle** — independent token state per appointment, opaque QR references stored only as SHA-256 hashes, reissue/revocation, duplicate check-in protection.
- **Email and reminders** — Resend delivery with React Email templates; durable Trigger.dev delayed jobs with idempotency keys; scheduled expiration sweep.
- **Security** — Supabase Auth with SSR cookies, row-level security on every organization-owned table, audited privileged RPCs, explicit function grants and service-role isolation.
- **Premium dark UI** — Tailwind CSS v4 tokens, Radix primitives, Motion for React, responsive dashboards, reduced-motion support.
- **Quality gates** — strict TypeScript, ESLint, Vitest/React Testing Library, Playwright.

There is no seed data and no mock production content. A fresh database starts empty and every screen renders an honest empty state.

## Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 App Router, React 19, TypeScript strict |
| Styling | Tailwind CSS v4, Radix UI primitives, class-variance-authority, Motion for React, Lucide |
| Data and auth | Supabase Postgres, Supabase Auth, `@supabase/ssr`, RLS |
| Email | Resend, React Email |
| Background jobs | Trigger.dev v4 |
| QR | `qrcode` generation, `@zxing/browser` camera scanning |
| Charts and forms | Recharts, React Hook Form, Zod |
| Dates | date-fns, date-fns-tz |
| Testing | Vitest, React Testing Library, jest-dom, Playwright |
| Hosting | Vercel (`vercel.json` included) |

## Quick start

Requirements: Node.js 22+, Corepack (ships with Node), and a Supabase project. Trigger.dev and Resend are optional for local UI work; their absence is reported in the UI and notification log rather than crashing the app.

```bash
corepack enable
corepack pnpm install
cp .env.example .env.local
# fill in the values described below
corepack pnpm dev
```

Open `http://localhost:3000`.

### Configure Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Apply the migrations in `supabase/migrations/` in numeric order. With the Supabase CLI:

   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```

   Alternatively, paste each file into the SQL editor in order (`0001` through `0007`).
3. Copy the project URL, publishable/anon key and service-role key into `.env.local`.
4. In **Authentication → URL Configuration**, set the site URL and add `http://localhost:3000/auth/callback` plus your production callback URL.

Without Supabase values the marketing pages still render and protected routes redirect to `/login?setup=1` with setup guidance.

### Create the first platform administrator

Sign up normally, then promote that account from the Supabase SQL editor:

```sql
update public.profiles
set platform_role = 'PLATFORM_ADMIN'
where email = 'you@example.com';
```

Reload the app and open `/platform/overview`. Additional administrators can be promoted from `/platform/users`; the API prevents an administrator from removing their own access.

### Configure email and jobs (optional locally)

- Verify a sending domain in Resend and set `RESEND_API_KEY` and `RESEND_FROM_EMAIL`.
- Set `TRIGGER_PROJECT_ID` and `TRIGGER_SECRET_KEY`, then run `corepack pnpm trigger:dev` in a second terminal.
- Without Resend, deliveries are recorded as `SKIPPED` in the notification log. Without Trigger.dev, reminder rows are still created, but delayed runs and the five-minute expiration sweep do not execute.

## Environment variables

| Variable | Exposure | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser | Publishable/anon key; RLS still applies |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Bypasses RLS for trusted jobs, email logging and privileged lookups |
| `RESEND_API_KEY` | Server only | Resend API access |
| `RESEND_FROM_EMAIL` | Server only | Verified sender, e.g. `TokenFlow <tickets@example.com>` |
| `TRIGGER_PROJECT_ID` | Server/CLI | Trigger.dev project ref used by `trigger.config.ts` |
| `TRIGGER_SECRET_KEY` | Server only | Authenticates delayed runs and cancellations |
| `NEXT_PUBLIC_APP_URL` | Browser | Canonical URL used in emails, redirects and metadata |

Never commit `.env.local` or a filled-in environment file. See `docs/setup.md` for the full provider setup and `docs/deployment.md` for production values.

## Scripts

| Command | Description |
| --- | --- |
| `corepack pnpm dev` | Start the Next.js development server |
| `corepack pnpm build` | Create a production build |
| `corepack pnpm start` | Serve the production build |
| `corepack pnpm lint` | Run ESLint |
| `corepack pnpm typecheck` | Run TypeScript with no emit |
| `corepack pnpm test` | Run the Vitest unit/component suite |
| `corepack pnpm test:watch` | Run Vitest in watch mode |
| `corepack pnpm test:e2e` | Run Playwright against a local dev server |
| `corepack pnpm trigger:dev` | Run Trigger.dev tasks locally |
| `corepack pnpm trigger:deploy` | Deploy Trigger.dev tasks |

Playwright starts its own dev server on port `3100` by default. Set `PLAYWRIGHT_BASE_URL` to test an already-running deployment, or `PLAYWRIGHT_PORT` to change the port. Install the browser once with `corepack pnpm exec playwright install chromium`.

## Route map

### Public

| Route | Purpose |
| --- | --- |
| `/` | Product landing page |
| `/features` | Capability overview |
| `/how-it-works` | End-to-end workflow |
| `/platform-capabilities` | Multi-organization platform detail |
| `/about` | Principles and company information |
| `/contact` | Contact details and guidance |
| `/docs` | In-app documentation |
| `/login`, `/signup`, `/forgot-password` | Authentication |

### Customer

| Route | Purpose |
| --- | --- |
| `/dashboard` | Next appointment and quick actions |
| `/organizations` | Browse approved organizations |
| `/organizations/[slug]` | Organization profile and services |
| `/book/[slug]` | Guided booking flow |
| `/appointments` | Upcoming and past appointments |
| `/appointments/[id]` | Appointment detail and actions |
| `/appointments/[id]/ticket` | Secure QR ticket |
| `/profile`, `/settings` | Personal details and security |

### Organization workspace

`/manage/[orgSlug]/overview`, `appointments`, `queue`, `scanner`, `tokens`, `services`, `schedules`, `branches`, `customers`, `staff`, `notifications`, `analytics`, `audit-logs`, `settings`.

Access requires active membership. `OWNER`/`ADMIN` can manage organization settings and staff; `MANAGER` can manage services, schedules, branches and appointments; `STAFF` can operate the queue, scan tokens and update appointment state. Platform administrators can inspect any workspace.

### Platform console

`/platform/overview`, `organizations`, `users`, `bookings`, `notifications`, `activity`, `settings`. Requires `profiles.platform_role = 'PLATFORM_ADMIN'`.

### JSON API

| Endpoint | Method | Notes |
| --- | --- | --- |
| `/api/organizations` | POST | Create an organization (pending approval) |
| `/api/organizations/[slug]/availability` | GET | Public slot discovery |
| `/api/bookings` | POST | Create a booking and issue a token |
| `/api/bookings/[id]/cancel` | POST | Cancel a booking |
| `/api/bookings/[id]/reschedule` | POST | Move a booking to a new slot |
| `/api/tokens/verify` | POST | Staff QR/manual verification and check-in |
| `/api/tokens/[id]/reissue` | POST | Rotate the active QR credential |
| `/api/schedules/generate` | POST | Generate slots for a service (manager+) |

Responses use `{ ok: true, data }` or `{ ok: false, error: { code, message, details? } }`. Zod schema failures become HTTP 422 with field paths; unexpected errors are sanitized.

## How the core flow works

1. An organization is created in `PENDING` state (or `APPROVED` when the platform auto-approve setting is enabled). A trigger creates the owner membership, a main branch and weekday working hours.
2. Services and optional dynamic fields define what customers answer at booking time. Working hours and exceptions define when slots can exist.
3. Availability is generated lazily for the requested date. `create_booking` locks the chosen slot row, checks capacity, booking horizon, required fields and duplicates, inserts the appointment, allocates the next daily token number, and stores only a hash of the QR reference.
4. Confirmation email and reminder rows are created after the database transaction commits. Notification failures never roll back a booking.
5. Staff scan the QR (or type the reference). `verify_qr` resolves the hash, checks organization, branch, time window and status, records the check-in event, and returns `CHECKED_IN` or a duplicate result without changing state twice.
6. Cancellation and reschedule release capacity and revoke the old QR credential. The expiration sweep marks bookings past their end time as `EXPIRED`.

More detail: [architecture](docs/architecture.md), [database schema](docs/database-schema.md), [security model](docs/security.md).

## Repository layout

```text
src/
  app/
    (auth)/            login, signup, password reset
    (customer)/        customer dashboard and booking
    (public)/          marketing and documentation
    manage/[orgSlug]/  organization workspace
    platform/          platform super-admin console
    api/               JSON endpoints
    auth/              callback, confirm, sign-out
  components/          UI kit, booking, management, marketing, platform
  config/              brand, constants, navigation
  emails/              React Email templates
  lib/                 API envelope, errors, env, Supabase clients, validation
  services/            server-side data and domain services
  trigger/             reminder and expiration tasks
  types/               domain types
supabase/migrations/   schema, functions, RLS, platform RPCs, grants, policy enforcement
e2e/                   Playwright tests
docs/                  operational and technical documentation
```

## Testing

```bash
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
corepack pnpm test:e2e
corepack pnpm build
```

The unit suite covers utilities, environment parsing, error mapping, request schemas, booking-day calculations, notification formatting, status constants and core UI primitives. Playwright covers the public site, login validation, the protected-route gate and API validation. Database behavior should be verified against a disposable Supabase project before promoting a migration.

## Deployment

The repository includes a Vercel configuration and a complete deployment guide. In short:

1. Apply migrations to the production Supabase project.
2. Import the repository into Vercel and add all environment variables for Production and Preview.
3. Configure Supabase redirect URLs and Resend domain verification.
4. Deploy Trigger.dev tasks with `corepack pnpm trigger:deploy` and configure their environment.
5. Run the post-deploy checklist in [docs/deployment.md](docs/deployment.md).

## Documentation

- [Setup](docs/setup.md)
- [Architecture](docs/architecture.md)
- [Database schema](docs/database-schema.md)
- [Design system](docs/design-system.md)
- [Features](docs/features.md)
- [Security](docs/security.md)
- [Deployment](docs/deployment.md)
- [Testing](docs/testing.md)

## Operational notes and current scope

- Email is the only notification channel in this release. SMS and paid messaging are intentionally excluded.
- The release is hardware-free. A phone camera is used for scanning; manual reference entry is always available.
- Trigger.dev is required for proactive reminders and the periodic expiration sweep. Scanning still expires a stale token lazily if the sweep is unavailable.
- Organization approval is manual by default; platform settings can enable auto-approval.
- Rate limiting is expected at the edge (Vercel Firewall or an upstream proxy) for public endpoints; the application exposes typed rate-limit errors but does not ship an in-process limiter.
- Migrations are written for Supabase Postgres and should be validated against a disposable project before a production rollout.

## License

See [LICENSE](LICENSE).
