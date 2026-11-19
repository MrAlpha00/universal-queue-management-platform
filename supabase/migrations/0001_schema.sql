-- TokenFlow · initial schema
-- Industry-independent, multi-organization relational model.
-- Applied with: supabase db push (or paste into the Supabase SQL editor).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.appointment_status as enum (
    'BOOKED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED',
    'CANCELLED', 'RESCHEDULED', 'EXPIRED', 'NO_SHOW'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.organization_status as enum ('PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.membership_role as enum ('OWNER', 'ADMIN', 'MANAGER', 'STAFF');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.field_type as enum (
    'TEXT', 'EMAIL', 'PHONE', 'NUMBER', 'TEXTAREA', 'SELECT', 'RADIO', 'CHECKBOX', 'DATE'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Shared trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Identity & organizations
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  timezone text not null default 'UTC',
  locale text not null default 'en',
  platform_role text not null default 'USER' check (platform_role in ('USER', 'PLATFORM_ADMIN')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  logo_url text,
  website text,
  email text,
  phone text,
  address text,
  timezone text not null default 'UTC',
  status public.organization_status not null default 'PENDING',
  approval_note text,
  settings jsonb not null default '{}'::jsonb,
  approved_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger organizations_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();
create index if not exists organizations_status_idx on public.organizations (status);
create index if not exists organizations_owner_idx on public.organizations (owner_id);

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  address text,
  city text,
  phone text,
  email text,
  timezone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, slug)
);
create trigger branches_updated_at before update on public.branches
  for each row execute function public.set_updated_at();
create index if not exists branches_org_idx on public.branches (org_id);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.membership_role not null default 'STAFF',
  branch_id uuid references public.branches(id) on delete set null,
  membership_status text not null default 'ACTIVE' check (membership_status in ('ACTIVE', 'INACTIVE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, user_id)
);
create trigger organization_members_updated_at before update on public.organization_members
  for each row execute function public.set_updated_at();
create index if not exists organization_members_user_idx on public.organization_members (user_id);
create index if not exists organization_members_org_idx on public.organization_members (org_id);

create table if not exists public.staff_assignments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete cascade,
  role public.membership_role not null default 'STAFF',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (org_id, user_id, branch_id)
);
create index if not exists staff_assignments_org_idx on public.staff_assignments (org_id);

-- ---------------------------------------------------------------------------
-- Services, fields & availability
-- ---------------------------------------------------------------------------
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete cascade,
  name text not null,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  duration_minutes integer not null default 15 check (duration_minutes between 1 and 480),
  buffer_minutes integer not null default 0 check (buffer_minutes between 0 and 240),
  capacity integer not null default 1 check (capacity between 1 and 1000),
  booking_horizon_days integer check (booking_horizon_days between 1 and 365),
  allow_cancellation boolean not null default true,
  cancellation_hours integer not null default 0 check (cancellation_hours >= 0),
  color text not null default 'violet',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, slug)
);
create trigger services_updated_at before update on public.services
  for each row execute function public.set_updated_at();
create index if not exists services_org_idx on public.services (org_id);
create index if not exists services_active_idx on public.services (org_id, is_active);

create table if not exists public.service_fields (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  name text not null check (name ~ '^[a-zA-Z][a-zA-Z0-9_]*$'),
  label text not null,
  field_type public.field_type not null default 'TEXT',
  placeholder text,
  help_text text,
  is_required boolean not null default false,
  options jsonb not null default '[]'::jsonb,
  validation jsonb not null default '{}'::jsonb,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_id, name)
);
create trigger service_fields_updated_at before update on public.service_fields
  for each row execute function public.set_updated_at();
create index if not exists service_fields_service_idx on public.service_fields (service_id, display_order);

create table if not exists public.working_hours (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete cascade,
  service_id uuid references public.services(id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7), -- 1 = Monday
  open_time time not null,
  close_time time not null,
  break_start time,
  break_end time,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (close_time > open_time)
);
create index if not exists working_hours_scope_idx on public.working_hours (org_id, branch_id, service_id, weekday);

create table if not exists public.schedule_exceptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete cascade,
  service_id uuid references public.services(id) on delete cascade,
  exception_date date not null,
  exception_type text not null default 'CLOSED' check (exception_type in ('CLOSED', 'HOLIDAY', 'SPECIAL')),
  open_time time,
  close_time time,
  reason text,
  created_at timestamptz not null default now(),
  check (exception_type <> 'SPECIAL' or (open_time is not null and close_time is not null and close_time > open_time))
);
create index if not exists schedule_exceptions_lookup_idx on public.schedule_exceptions (org_id, exception_date);

create table if not exists public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  slot_date date not null,
  start_time time not null,
  end_time time not null,
  capacity integer not null default 1 check (capacity > 0),
  booked_count integer not null default 0 check (booked_count >= 0),
  status text not null default 'OPEN' check (status in ('OPEN', 'CLOSED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_id, branch_id, slot_date, start_time)
);
create trigger availability_slots_updated_at before update on public.availability_slots
  for each row execute function public.set_updated_at();
create index if not exists availability_slots_lookup_idx
  on public.availability_slots (service_id, branch_id, slot_date, status) include (capacity, booked_count);
create index if not exists availability_slots_org_date_idx on public.availability_slots (org_id, slot_date);

-- ---------------------------------------------------------------------------
-- Appointments & tokens
-- ---------------------------------------------------------------------------
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  slot_id uuid references public.availability_slots(id) on delete set null,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  timezone text not null,
  status public.appointment_status not null default 'BOOKED',
  responses jsonb not null default '{}'::jsonb,
  notes text,
  source text not null default 'ONLINE' check (source in ('ONLINE', 'STAFF', 'WALK_IN')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  completed_at timestamptz,
  rescheduled_at timestamptz
);
create trigger appointments_updated_at before update on public.appointments
  for each row execute function public.set_updated_at();
create index if not exists appointments_org_date_idx on public.appointments (org_id, appointment_date desc);
create index if not exists appointments_customer_idx on public.appointments (customer_id, created_at desc);
create index if not exists appointments_status_idx on public.appointments (org_id, status, appointment_date);
create index if not exists appointments_service_idx on public.appointments (service_id, appointment_date);
create index if not exists appointments_branch_date_idx on public.appointments (branch_id, appointment_date);
create unique index if not exists appointments_active_dedupe_idx
  on public.appointments (customer_id, service_id, appointment_date)
  where status = 'BOOKED';

create table if not exists public.token_sequences (
  scope_key text not null,
  sequence_date date not null,
  value integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (scope_key, sequence_date)
);

create table if not exists public.tokens (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  appointment_id uuid not null unique references public.appointments(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  appointment_date date not null,
  token_number text not null,
  status public.appointment_status not null default 'BOOKED',
  issued_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, appointment_date, token_number)
);
create trigger tokens_updated_at before update on public.tokens
  for each row execute function public.set_updated_at();
create index if not exists tokens_org_date_idx on public.tokens (org_id, appointment_date desc);
create index if not exists tokens_number_idx on public.tokens (org_id, token_number);

create table if not exists public.qr_credentials (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  token_id uuid not null references public.tokens(id) on delete cascade,
  reference_hash text not null unique,
  expires_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index if not exists qr_credentials_appointment_idx on public.qr_credentials (appointment_id);

create table if not exists public.check_in_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  token_id uuid references public.tokens(id) on delete set null,
  scanned_by uuid references public.profiles(id) on delete set null,
  scan_source text not null check (scan_source in ('CAMERA', 'MANUAL')),
  result text not null check (result in ('CHECKED_IN', 'DUPLICATE', 'INVALID', 'EXPIRED', 'NOT_OPEN', 'CANCELLED')),
  created_at timestamptz not null default now()
);
create index if not exists check_in_events_appointment_idx on public.check_in_events (appointment_id, created_at);

-- ---------------------------------------------------------------------------
-- Notifications, jobs & audit
-- ---------------------------------------------------------------------------
create table if not exists public.reminder_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  notification_type text not null default 'REMINDER',
  offset_minutes integer not null,
  scheduled_for timestamptz not null,
  idempotency_key text not null unique,
  status text not null default 'SCHEDULED' check (status in ('SCHEDULED', 'SENT', 'FAILED', 'CANCELLED', 'SKIPPED')),
  task_id text,
  attempts integer not null default 0,
  sent_at timestamptz,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger reminder_events_updated_at before update on public.reminder_events
  for each row execute function public.set_updated_at();
create index if not exists reminder_events_appointment_idx on public.reminder_events (appointment_id, status);
create index if not exists reminder_events_due_idx on public.reminder_events (scheduled_for, status);

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  channel text not null default 'EMAIL',
  event_type text not null,
  recipient text not null,
  subject text,
  status text not null default 'QUEUED' check (status in ('QUEUED', 'SENT', 'FAILED', 'SKIPPED')),
  provider_id text,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger notification_events_updated_at before update on public.notification_events
  for each row execute function public.set_updated_at();
create index if not exists notification_events_org_idx on public.notification_events (org_id, created_at desc);
create index if not exists notification_events_status_idx on public.notification_events (status, created_at desc);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_org_idx on public.audit_logs (org_id, created_at desc);
create index if not exists audit_logs_action_idx on public.audit_logs (action, created_at desc);

create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);
create trigger platform_settings_updated_at before update on public.platform_settings
  for each row execute function public.set_updated_at();

insert into public.platform_settings (key, value, description) values
  ('auto_approve_organizations', 'false'::jsonb, 'Automatically approve new organization registrations'),
  ('allow_public_registration', 'true'::jsonb, 'Allow self-service organization registration'),
  ('default_booking_horizon_days', '3'::jsonb, 'Default booking horizon in calendar days'),
  ('maintenance_mode', 'false'::jsonb, 'Temporarily disable public booking')
on conflict (key) do nothing;
