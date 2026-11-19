# Features

TokenFlow is organized around three experiences over one multi-tenant database: a customer workspace, an organization workspace and a platform console. This document describes what each surface does and where the corresponding code lives.

## Customer experience

### Discovery

- `/organizations` lists approved organizations with logo, description, address and service count.
- `/organizations/[slug]` shows the public profile, branches and bookable services.
- Pending, suspended and rejected organizations are not discoverable and cannot be booked.
- Anonymous visitors can read public discovery data; booking requires a session.

### Guided booking

`/book/[slug]` uses a client-side stepper backed by server data:

1. Choose a service and branch.
2. Choose a date within the organization's booking horizon (default three calendar days, in the organization timezone). A service-level horizon overrides the organization setting.
3. Pick an available slot. Slots are generated lazily from working hours and exceptions and expose remaining capacity.
4. Answer the service's dynamic fields. Required fields, option values and type-specific rules are validated on the client and again in the database.
5. Confirm. The database reserves capacity atomically, allocates the next daily token number and returns the one-time QR reference.

The confirmation page and appointment detail show the token, time, branch and QR entry point. A partial unique index prevents a customer from holding two `BOOKED` appointments for the same service and date; the API returns a conflict with a clear message.

### Appointments

- `/appointments` lists every appointment, filterable by all, active, booked, completed or cancelled.
- `/appointments/[id]` shows visit details, dynamic responses, booking source and management actions.
- `/appointments/[id]/ticket` renders the secure QR ticket. The page reissues the active credential on each render so a shared screenshot is replaced by the newest code.

### Reschedule and cancellation

- Reschedule is available while the appointment is `BOOKED` or `CHECKED_IN`. It creates a replacement booking, then closes the original as `RESCHEDULED`, releases its capacity and revokes its QR.
- Online cancellation is available only when:
  - the appointment is `BOOKED` or `CHECKED_IN`;
  - the service's `allow_cancellation` is true; and
  - the service's `cancellation_hours` cutoff has not passed.
- When cancellation is unavailable, the appointment page explains why instead of hiding the reason. Staff and platform administrators keep an operational override.
- The database enforces the same rules, so a direct API call cannot bypass a closed window.

### Account

- `/profile` edits name, phone, timezone and locale.
- `/settings` changes the password and signs out other sessions through Supabase Auth.
- `/onboarding/organization` creates an organization workspace when public registration is open. The page shows existing organizations, the review status and a link into the workspace.

## Organization workspace

Access is granted by `organization_members`. `OWNER` and `ADMIN` manage the organization and staff; `MANAGER` adds services, schedules, branches and appointments; `STAFF` operates the queue and scanner. Platform administrators can inspect any workspace.

| Page | What it does |
| --- | --- |
| `/manage/[orgSlug]/overview` | Today's bookings, queue health, upcoming appointments, recent activity and setup checklist |
| `appointments` | Filter by status, service and date; open details; change status; cancel or reschedule with staff override |
| `queue` | Live board of `CHECKED_IN` and `IN_PROGRESS` visits with next-action controls |
| `scanner` | Camera QR scanning through `@zxing/browser` plus a manual reference field; result cards for success, duplicate and every rejection code |
| `tokens` | Today's token list, status, reissue and audit context |
| `services` | Create and edit services, cancellation policy, capacity, buffer, color and dynamic booking fields |
| `schedules` | Working hours, breaks, exceptions and slot generation |
| `branches` | Branch contact details, address and active state |
| `customers` | Customers with appointments in this organization, with visit history |
| `staff` | Invite/assign members, change role and deactivate access |
| `notifications` | Delivery log with event type, recipient, status and provider error |
| `analytics` | Booking volume, status mix, peak times and service performance |
| `audit-logs` | Organization-scoped privileged actions |
| `settings` | Organization profile, timezone, reminder offsets, check-in windows and email toggles |

### Organization lifecycle

- A new organization starts as `PENDING` unless auto-approval is enabled. Members can configure services and schedules while pending; public discovery and booking stay closed.
- `APPROVED` organizations are discoverable and bookable.
- `SUSPENDED` organizations keep their data but cannot take new bookings.
- `REJECTED` organizations are retained for the review trail.
- Direct status changes are blocked by a trigger; only the audited platform RPC can change status.
- When public registration is disabled, the onboarding form is hidden and the database trigger rejects direct organization inserts from non-admins.

### Dynamic booking fields

Each service can define ordered fields with type `TEXT`, `EMAIL`, `PHONE`, `NUMBER`, `TEXTAREA`, `SELECT`, `RADIO`, `CHECKBOX` or `DATE`. Labels, placeholders, help text, required flags, options and validation hints are stored as data, so adding a question never requires a migration.

## Platform console

Requires `profiles.platform_role = 'PLATFORM_ADMIN'`.

| Page | What it does |
| --- | --- |
| `/platform/overview` | Cross-organization counts, recent bookings, platform health |
| `organizations` | Approve, reject and suspend organizations with a review note |
| `users` | Search profiles and promote or demote platform administrators |
| `bookings` | Read-only cross-tenant booking activity |
| `notifications` | Platform-wide email delivery log |
| `activity` | Platform and tenant audit events |
| `settings` | Auto-approval, public registration, default booking horizon and maintenance mode |

Privileged actions run through audited RPCs:

- `set_organization_status` — status, approval metadata and audit entry.
- `set_user_platform_role` — promote/demote; an administrator cannot remove their own access.
- `update_platform_setting` — known keys only, with before/after values in the audit log.

`allow_public_registration` is enforced in the organization trigger and prechecked by the onboarding form. `auto_approve_organizations` is applied by the same trigger. `maintenance_mode` blocks new bookings inside `create_booking`. `default_booking_horizon_days` applies when neither the organization nor the service has an override.

## Booking engine

- **Atomic capacity** — `create_booking` locks the slot row, checks capacity, inserts the appointment and increments `booked_count` in one transaction. Concurrent requests cannot oversell.
- **Lazy availability** — `get_available_slots` generates missing slots for the requested date, respecting service duration, buffer, working hours, breaks and exceptions.
- **Horizon** — the requested date must fall inside the organization or service horizon, calculated in the organization timezone.
- **Duplicates** — a partial unique index plus an RPC check stops duplicate active bookings for the same customer, service and date.
- **Restrictions** — pending/suspended organizations, maintenance mode, inactive services and unavailable branches are refused with explicit error messages.
- **Reschedule** — the new slot is reserved before the old appointment is closed, so a failed reschedule leaves the original intact.

## Token and QR lifecycle

- Every appointment has exactly one token row. Tokens are independent: issuing or reissuing one appointment never changes another.
- Token numbers are allocated per service per day from `token_sequences` with an atomic upsert, then formatted with the organization prefix (default `TK`).
- The QR payload is an opaque `tfq_...` reference. Only its SHA-256 hash is stored in `qr_credentials`; the plaintext value is returned once from the booking or reissue RPC.
- The customer ticket page reissues the active credential before rendering the image, which limits the value of a previously shared screenshot.
- Cancellation, reschedule, completion, expiration and no-show revoke the active credential.
- Verification checks the hash, organization, optional branch, appointment status and check-in window.
- A repeated scan records a `DUPLICATE` event and returns `ALREADY_CHECKED_IN` without changing state.
- `expire_stale_tokens` lazily expires a stale appointment during scanning and is also called by the scheduled sweep.

## Email and reminders

- Resend delivers React Email templates for booking confirmation, reminder, cancellation, reschedule, expiration and staff status updates.
- Every attempt writes to `notification_events` with `SENT`, `FAILED` or `SKIPPED`.
- A missing Resend configuration never blocks a booking; it is recorded as `SKIPPED`.
- Reminder offsets default to `[120, 90, 60, 30, 10]` minutes and are stored per organization.
- Reminder rows carry a unique idempotency key. Trigger.dev tasks re-check the row and appointment before sending, so retries do not duplicate mail.
- Cancellation and reschedule cancel pending reminders and best-effort cancel their Trigger.dev runs.
- Organization settings can disable specific email event types.

## Scope and non-goals

Included in this release:

- email-only notifications (no SMS or paid messaging),
- hardware-free scanning using a device camera or manual entry,
- manual organization approval unless auto-approval is enabled,
- accessibility and reduced-motion support,
- honest empty states with no seed or demo data.

Explicitly out of scope:

- in-person kiosk hardware, printers or Bluetooth scanners,
- payments, deposits or invoicing,
- a native mobile app,
- an in-process rate limiter (use Vercel Firewall or an upstream proxy),
- a light theme.
