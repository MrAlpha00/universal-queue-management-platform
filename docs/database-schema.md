# Database schema

TokenFlow uses a single Supabase Postgres database. Every organization-owned row carries `org_id`, and Row Level Security limits access to active members, the owning customer or a platform administrator.

Migrations live in `supabase/migrations/` and must be applied in numeric order.

| Migration | Contents |
| --- | --- |
| `0001_schema.sql` | Extensions, enums, tables, indexes, updated-at triggers, default platform settings |
| `0002_functions.sql` | Authorization helpers, identity/organization triggers, slot generation, booking, QR, expiration RPCs |
| `0003_rls.sql` | Grants and row-level security policies |
| `0004_admin_functions.sql` | Availability discovery and management RPCs |
| `0005_platform_console.sql` | Platform role and setting RPCs |
| `0006_harden_function_grants.sql` | Explicit function grants; internal helpers removed from the API surface |
| `0007_enforce_policies.sql` | Organization registration gate and service cancellation policy enforced in the database |

## Entity relationships

```text
auth.users 1──1 profiles
profiles 1──* organizations (owner)
organizations 1──* branches
organizations 1──* organization_members *──1 profiles
organizations 1──* services 1──* service_fields
organizations 1──* working_hours
organizations 1──* schedule_exceptions
services 1──* availability_slots
appointments *──1 organizations / branches / services / profiles
appointments 1──1 tokens
appointments 1──* qr_credentials
appointments 1──* check_in_events
appointments 1──* reminder_events
organizations 1──* notification_events / audit_logs
platform_settings (global key/value)
```

## Enums

| Enum | Values |
| --- | --- |
| `appointment_status` | `BOOKED`, `CHECKED_IN`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `RESCHEDULED`, `EXPIRED`, `NO_SHOW` |
| `organization_status` | `PENDING`, `APPROVED`, `SUSPENDED`, `REJECTED` |
| `membership_role` | `OWNER`, `ADMIN`, `MANAGER`, `STAFF` |
| `field_type` | `TEXT`, `EMAIL`, `PHONE`, `NUMBER`, `TEXTAREA`, `SELECT`, `RADIO`, `CHECKBOX`, `DATE` |

`profiles.platform_role` is a constrained text column with `USER` or `PLATFORM_ADMIN`. It is intentionally separate from organization membership: platform access spans tenants, organization roles do not.

## Tables

### Identity and tenancy

#### `profiles`

One row per authenticated user, keyed by `id` referencing `auth.users(id)` with cascade delete.

| Column | Notes |
| --- | --- |
| `full_name`, `email`, `phone`, `avatar_url` | Display and contact data |
| `timezone`, `locale` | Defaults `UTC` and `en` |
| `platform_role` | `USER` by default; changed only through the audited platform RPC |
| `created_at`, `updated_at` | `updated_at` maintained by trigger |

A trigger on `auth.users` inserts the profile and copies `full_name`/`name`, email and avatar from user metadata.

#### `organizations`

| Column | Notes |
| --- | --- |
| `id` | UUID primary key |
| `owner_id` | References `profiles`; defaults to the inserting user |
| `name` | 2–120 characters |
| `slug` | Globally unique, lowercase kebab-case, URL identifier |
| `description`, `logo_url`, `website`, `email`, `phone`, `address` | Public profile |
| `timezone` | IANA zone used for booking days and reminders |
| `status` | `PENDING` by default |
| `approval_note`, `approved_at`, `approved_by` | Platform review trail |
| `settings` | JSONB booking policy (see below) |

Default `settings` keys added by the before-insert trigger:

```json
{
  "booking_horizon_days": 3,
  "token_prefix": "TK",
  "checkin_early_minutes": 0,
  "checkin_grace_minutes": 0,
  "reminder_offsets_minutes": [120, 90, 60, 30, 10]
}
```

An optional `enabled_email_types` array can disable specific email event types for the organization. `timezone` may also be mirrored inside `settings`; the database treats `coalesce(settings->>'timezone', organizations.timezone, 'UTC')` as authoritative.

After insert, a trigger creates:

- an `OWNER` membership for `owner_id`,
- a `Main branch` with slug `main-branch`,
- Monday–Friday `09:00–17:00` working hours.

#### `branches`

Belongs to an organization; `(org_id, slug)` is unique. Branch-level `timezone` overrides are available for display, while booking time uses the organization timezone. Deactivating a branch removes it from public service discovery.

#### `organization_members`

| Column | Notes |
| --- | --- |
| `org_id`, `user_id` | Unique pair |
| `role` | `OWNER`, `ADMIN`, `MANAGER`, `STAFF` |
| `branch_id` | Optional staff scope |
| `membership_status` | `ACTIVE` or `INACTIVE` |

#### `staff_assignments`

Optional branch-scoped staffing record with `(org_id, user_id, branch_id)` uniqueness and an `is_active` flag. Organization membership remains the authorization source.

### Services and availability

#### `services`

| Column | Notes |
| --- | --- |
| `org_id`, `branch_id` | Branch is optional; `null` means all active branches |
| `name`, `slug` | Slug unique per organization |
| `duration_minutes` | 1–480 |
| `buffer_minutes` | 0–240; gap between generated slots |
| `capacity` | 1–1000; bookings allowed per slot |
| `booking_horizon_days` | Optional per-service override, 1–365 |
| `allow_cancellation`, `cancellation_hours` | Customer cancellation policy |
| `color` | Accent token used in the UI |
| `is_active` | Hides the service when false |

#### `service_fields`

Dynamic questions collected at booking time.

| Column | Notes |
| --- | --- |
| `service_id` | Cascades with the service |
| `name` | Machine key; unique per service |
| `label`, `placeholder`, `help_text` | Presentation |
| `field_type` | Enum above |
| `is_required` | Required fields are enforced by `create_booking` |
| `options` | JSONB array for select/radio/checkbox |
| `validation` | JSONB hints such as min/max/pattern |
| `display_order`, `is_active` | Ordering and soft disable |

#### `working_hours`

Recurring weekly availability with a scope of organization, optional branch and optional service.

| Column | Notes |
| --- | --- |
| `weekday` | ISO weekday, 1 = Monday … 7 = Sunday |
| `open_time`, `close_time` | `close_time > open_time` |
| `break_start`, `break_end` | Optional daily break |
| `is_active` | Excludes the row when false |

More specific scopes win: service-specific rows override branch rows, which override organization-wide rows.

#### `schedule_exceptions`

| Column | Notes |
| --- | --- |
| `exception_date` | Calendar date |
| `exception_type` | `CLOSED`, `HOLIDAY` or `SPECIAL` |
| `open_time`, `close_time` | Required for `SPECIAL`; must form a valid range |
| `reason` | Free text |

Service-specific exceptions take precedence over branch-specific, then organization-wide.

#### `availability_slots`

Materialized slots generated lazily for a service, branch and date.

| Column | Notes |
| --- | --- |
| `slot_date`, `start_time`, `end_time` | Slot identity and duration |
| `capacity`, `booked_count` | `booked_count >= 0`, `booked_count <= capacity` enforced by booking logic |
| `status` | `OPEN` or `CLOSED` |

Unique on `(service_id, branch_id, slot_date, start_time)`. The booking RPC locks the row `FOR UPDATE` before checking capacity, so concurrent requests cannot oversell the slot.

### Appointments and tokens

#### `appointments`

| Column | Notes |
| --- | --- |
| `org_id`, `branch_id`, `service_id`, `customer_id` | Required relationships |
| `slot_id` | Optional reference to the reserved slot |
| `appointment_date`, `start_time`, `end_time` | Local schedule values |
| `start_at`, `end_at` | Timezone-aware instants used for ordering and expiry |
| `timezone` | Snapshot of the organization timezone at booking time |
| `status` | Defaults `BOOKED` |
| `responses` | JSONB answers to service fields |
| `notes` | Customer or staff notes; cancellation reason is appended |
| `source` | `ONLINE`, `STAFF` or `WALK_IN` |
| `cancelled_at`, `completed_at`, `rescheduled_at` | Lifecycle timestamps |

Indexes cover `(org_id, appointment_date)`, `(customer_id, created_at)`, `(org_id, status, appointment_date)`, `(service_id, appointment_date)` and `(branch_id, appointment_date)`.

A partial unique index prevents duplicate active bookings:

```sql
create unique index appointments_active_dedupe_idx
  on public.appointments (customer_id, service_id, appointment_date)
  where status = 'BOOKED';
```

#### `tokens`

Exactly one token per appointment (`appointment_id` unique).

| Column | Notes |
| --- | --- |
| `token_number` | Human-readable, e.g. `TK-014` |
| `appointment_date` | Used for daily numbering |
| `status` | Mirrors the appointment status |

Unique on `(org_id, appointment_date, token_number)`.

#### `token_sequences`

Daily counter keyed by `(scope_key, sequence_date)`, where `scope_key` is the service UUID. Incrementing is atomic through `insert … on conflict do update … returning`, so concurrent bookings receive distinct numbers. Numbering is per service per day; the organization prefix comes from `settings.token_prefix`.

#### `qr_credentials`

| Column | Notes |
| --- | --- |
| `reference_hash` | SHA-256 hex digest, globally unique |
| `expires_at` | Appointment end plus the organization grace window |
| `is_active`, `revoked_at` | Only one active credential should exist per appointment |

The plaintext reference is **never stored**. It is returned once from the booking RPC or reissue RPC. Only `reference_hash` is persisted and queried.

#### `check_in_events`

Append-only scan history.

| Column | Notes |
| --- | --- |
| `scan_source` | `CAMERA` or `MANUAL` |
| `result` | `CHECKED_IN`, `DUPLICATE`, `INVALID`, `EXPIRED`, `NOT_OPEN`, `CANCELLED` |
| `scanned_by` | Staff profile, nullable after deletion |

### Operations

#### `reminder_events`

| Column | Notes |
| --- | --- |
| `notification_type` | `REMINDER` by default |
| `offset_minutes`, `scheduled_for` | Delivery schedule |
| `idempotency_key` | Unique, e.g. `reminder:<appointment_id>:<offset>` |
| `status` | `SCHEDULED`, `SENT`, `FAILED`, `CANCELLED`, `SKIPPED` |
| `task_id` | Trigger.dev run identifier |
| `attempts`, `sent_at`, `error`, `metadata` | Delivery diagnostics |

#### `notification_events`

Audit trail for every email attempt.

| Column | Notes |
| --- | --- |
| `org_id`, `appointment_id`, `user_id` | Optional context |
| `channel` | `EMAIL` in this release |
| `event_type` | `BOOKING_CONFIRMATION`, `REMINDER`, `CANCELLATION`, `RESCHEDULE`, `EXPIRATION`, `STATUS_UPDATE` |
| `recipient`, `subject` | Delivery target |
| `status` | `QUEUED`, `SENT`, `FAILED`, `SKIPPED` |
| `provider_id`, `error`, `metadata` | Provider response and diagnostics |

#### `audit_logs`

| Column | Notes |
| --- | --- |
| `org_id` | Null for platform-wide actions |
| `actor_id` | Acting profile |
| `action` | e.g. `APPOINTMENT_CREATED`, `TOKEN_CHECKED_IN`, `PLATFORM_ROLE_CHANGED` |
| `entity_type`, `entity_id` | Target |
| `details` | JSONB before/after or context |
| `ip_address` | Available column; not populated by database RPCs |

#### `platform_settings`

Global key/value configuration. Seeded rows:

| Key | Default | Effect |
| --- | --- | --- |
| `auto_approve_organizations` | `false` | New organizations skip manual review |
| `allow_public_registration` | `true` | New organizations can be created from onboarding; enforced by the defaults trigger and prechecked in the UI |
| `default_booking_horizon_days` | `3` | Fallback horizon |
| `maintenance_mode` | `false` | Blocks new bookings with a clear error |

## Database functions

All privileged functions are `SECURITY DEFINER` with `set search_path = public, pg_temp`. Authorization is checked inside the function; `0006` removes `EXECUTE` from `PUBLIC` and grants only the intended roles. `0007` replaces the organization defaults trigger to honor `allow_public_registration`, adds the read-only `organization_registration_open()` helper, and re-creates `cancel_booking` with the customer cancellation policy below.

### Discovery and scheduling

| Function | Caller | Behavior |
| --- | --- | --- |
| `get_available_slots(p_service, p_branch, p_date)` | `anon`, `authenticated` | Returns open slots with capacity after lazy generation; refuses non-approved organizations and dates outside the horizon |
| `generate_slots(p_service, p_branch, p_start, p_end)` | internal | Builds slots from working hours, exceptions, duration and buffer |
| `admin_generate_slots(p_service, p_start, p_end)` | org `MANAGER`+ or platform admin | Generates slots for a service across its branch scope and writes an audit entry |
| `organization_registration_open()` | `anon`, `authenticated` | Read-only flag used by the sign-up and onboarding screens; returns the `allow_public_registration` setting |

### Booking lifecycle

| Function | Caller | Behavior |
| --- | --- | --- |
| `create_booking(p_service, p_branch, p_slot_date, p_start_time, p_responses)` | `authenticated` | Validates organization, maintenance mode, horizon, branch, required fields, duplicates; locks the slot; inserts appointment, token and QR credential |
| `cancel_booking(p_appointment, p_reason)` | owning customer, org `MANAGER`+, platform admin | Cancels only from `BOOKED`/`CHECKED_IN`; customers must be allowed by `services.allow_cancellation` and outside `cancellation_hours`; staff retain override; releases capacity; revokes token and QR; cancels reminder rows |
| `reschedule_booking(p_appointment, p_service, p_branch, p_slot_date, p_start_time, p_responses)` | owning customer, org `MANAGER`+ | Creates a replacement appointment, then closes the original as `RESCHEDULED`; releases old capacity and revokes the old QR |
| `update_appointment_status(p_appointment, p_status)` | org member (`STAFF` included) | Enforces the status transition table; revokes QR for terminal states |

### Check-in and tokens

| Function | Caller | Behavior |
| --- | --- | --- |
| `verify_qr(p_reference, p_org_slug, p_branch_id, p_source)` | org member, platform admin | Hashes the reference, enforces organization and branch scope, checks status and time window, records a check-in event, prevents duplicate state changes |
| `reissue_qr(p_appointment)` | owning customer, org `MANAGER`+ | Rotates the credential for an active booking |
| `reissue_qr_for_staff(p_appointment)` | org staff and above | Staff-side rotation variant |
| `expire_stale_tokens(p_org)` | internal, `service_role` | Marks past-window bookings `EXPIRED`, updates tokens, revokes QR credentials, skips reminders |
| `admin_expire_tokens(p_org)` | org `MANAGER`+ or platform admin | Authorized wrapper around the expiration routine |

`verify_qr` returns a structured JSON result rather than raising for expected outcomes. `ok: true` with `duplicate: true` means the appointment was already checked in; `ok: false` carries codes such as `INVALID_QR`, `WRONG_ORGANIZATION`, `WRONG_BRANCH`, `CANCELLED`, `RESCHEDULED`, `TERMINAL`, `EXPIRED` or `NOT_OPEN`.

### Platform administration

| Function | Caller | Behavior |
| --- | --- | --- |
| `set_organization_status(p_org, p_status, p_note)` | platform admin | Updates status, approval metadata and audit log |
| `set_user_platform_role(p_user, p_role)` | platform admin | Changes `profiles.platform_role`; prevents self-demotion |
| `update_platform_setting(p_key, p_value)` | platform admin | Updates a known setting and records before/after |

### Internal helpers

| Function | Purpose | API access |
| --- | --- | --- |
| `is_platform_admin()` | RLS predicate | `anon`, `authenticated` |
| `is_org_member(org, roles[])` | RLS predicate | `anon`, `authenticated` |
| `org_role(org)` | Current membership role | `authenticated` |
| `can_view_profile(profile)` | Profile visibility | `authenticated` |
| `setting_bool`, `setting_int` | Read platform settings | none |
| `log_audit(...)` | Audit insertion | none |
| `_insert_booking_internal(...)` | Shared booking implementation | none |
| `_next_token_number(...)` | Daily sequence allocation | none |

## Triggers

| Trigger | Table | Purpose |
| --- | --- | --- |
| `*_updated_at` | Most tables | Maintains `updated_at` |
| `on_auth_user_created` | `auth.users` | Creates the profile row |
| `organizations_defaults` | `organizations` (before insert) | Sets owner, approval status, default settings; rejects non-admin inserts while public registration is closed |
| `organizations_after_created` | `organizations` (after insert) | Owner membership, main branch, weekday hours, audit entry |
| `profiles_protect_role` | `profiles` | Blocks non-platform-admin role changes |
| `organizations_protect_status` | `organizations` | Blocks non-platform-admin status changes |

## Row Level Security summary

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

Anonymous users can read approved discovery data and slots. They cannot read appointments, tokens, credentials or operational logs.

## Operational notes

- **Token independence** — each appointment owns its own token. Issuing token B never changes token A; only the appointment's own lifecycle affects its token.
- **Capacity** — `booked_count` is incremented inside the locked booking transaction. Cancellation and reschedule decrement it with a floor of zero.
- **Booking horizon** — validated in the organization timezone. The default is three calendar days including today. A service-level `booking_horizon_days` overrides the organization setting.
- **Cancellation policy** — customers can cancel only from `BOOKED`/`CHECKED_IN`, when `services.allow_cancellation` is true, and before the `services.cancellation_hours` cutoff. Staff and platform administrators keep an override. The appointment page and `cancel_booking` apply the same rule.
- **Registration policy** — `allow_public_registration` is checked in the organization defaults trigger and in the onboarding/signup UI. Platform administrators can still create organizations while registration is closed.
- **Reminder cancellation** — cancellation and reschedule mark pending reminder rows `CANCELLED` and best-effort cancel Trigger.dev runs.
- **No mock data** — migrations seed only `platform_settings`. All dashboards render real empty states.
- **Validation** — before production, apply all migrations to a disposable project and exercise booking, duplicate scan, reschedule and expiration.
