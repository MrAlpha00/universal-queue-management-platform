-- TokenFlow · Row Level Security, grants and policies.
-- Every organization-owned table is scoped. Writes to booking/token tables go
-- exclusively through the SECURITY DEFINER functions in 0002_functions.sql.

alter table public.profiles               enable row level security;
alter table public.organizations          enable row level security;
alter table public.branches               enable row level security;
alter table public.organization_members   enable row level security;
alter table public.staff_assignments      enable row level security;
alter table public.services               enable row level security;
alter table public.service_fields         enable row level security;
alter table public.working_hours          enable row level security;
alter table public.schedule_exceptions    enable row level security;
alter table public.availability_slots     enable row level security;
alter table public.appointments           enable row level security;
alter table public.token_sequences        enable row level security;
alter table public.tokens                 enable row level security;
alter table public.qr_credentials         enable row level security;
alter table public.check_in_events        enable row level security;
alter table public.reminder_events        enable row level security;
alter table public.notification_events    enable row level security;
alter table public.audit_logs             enable row level security;
alter table public.platform_settings      enable row level security;

-- ---------------------------------------------------------------------------
-- Grants. Least privilege: public read for discovery, member-only writes.
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant insert (id, full_name, email, avatar_url, timezone) on public.profiles to authenticated;
grant update (full_name, phone, avatar_url, timezone, locale, updated_at) on public.profiles to authenticated;

grant select on public.organizations, public.branches, public.services,
  public.service_fields, public.working_hours, public.schedule_exceptions,
  public.availability_slots to anon, authenticated;
grant insert, update, delete on public.organizations, public.branches,
  public.service_fields, public.working_hours, public.schedule_exceptions to authenticated;
grant insert, update, delete on public.services to authenticated;

grant select on public.organization_members, public.staff_assignments,
  public.appointments, public.tokens, public.check_in_events,
  public.reminder_events, public.notification_events, public.audit_logs to authenticated;
grant insert, update, delete on public.organization_members, public.staff_assignments to authenticated;

revoke all on public.token_sequences, public.qr_credentials from anon, authenticated;
grant select on public.platform_settings to authenticated;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated using (public.can_view_profile(id));

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- Organizations
-- ---------------------------------------------------------------------------
drop policy if exists "organizations_select" on public.organizations;
create policy "organizations_select" on public.organizations
  for select to public using (
    status = 'APPROVED' or public.is_platform_admin() or public.is_org_member(id)
  );

drop policy if exists "organizations_insert" on public.organizations;
create policy "organizations_insert" on public.organizations
  for insert to authenticated with check (auth.uid() is not null);

drop policy if exists "organizations_update" on public.organizations;
create policy "organizations_update" on public.organizations
  for update to authenticated using (
    public.is_org_member(id, array['OWNER','ADMIN']::public.membership_role[])
    or public.is_platform_admin()
  ) with check (
    public.is_org_member(id, array['OWNER','ADMIN']::public.membership_role[])
    or public.is_platform_admin()
  );

drop policy if exists "organizations_delete" on public.organizations;
create policy "organizations_delete" on public.organizations
  for delete to authenticated using (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Branches, services and scheduling configuration
-- ---------------------------------------------------------------------------
drop policy if exists "branches_select" on public.branches;
create policy "branches_select" on public.branches
  for select to public using (
    exists (
      select 1 from public.organizations o
      where o.id = org_id and (o.status = 'APPROVED' or public.is_platform_admin() or public.is_org_member(o.id))
    )
  );
drop policy if exists "branches_write" on public.branches;
create policy "branches_write" on public.branches
  for all to authenticated using (
    public.is_org_member(org_id, array['OWNER','ADMIN','MANAGER']::public.membership_role[])
    or public.is_platform_admin()
  ) with check (
    public.is_org_member(org_id, array['OWNER','ADMIN','MANAGER']::public.membership_role[])
    or public.is_platform_admin()
  );

drop policy if exists "services_select" on public.services;
create policy "services_select" on public.services
  for select to public using (
    exists (
      select 1 from public.organizations o
      where o.id = org_id and (o.status = 'APPROVED' or public.is_platform_admin() or public.is_org_member(o.id))
    )
  );
drop policy if exists "services_write" on public.services;
create policy "services_write" on public.services
  for all to authenticated using (
    public.is_org_member(org_id, array['OWNER','ADMIN','MANAGER']::public.membership_role[])
    or public.is_platform_admin()
  ) with check (
    public.is_org_member(org_id, array['OWNER','ADMIN','MANAGER']::public.membership_role[])
    or public.is_platform_admin()
  );

drop policy if exists "service_fields_select" on public.service_fields;
create policy "service_fields_select" on public.service_fields
  for select to public using (
    exists (
      select 1 from public.organizations o
      where o.id = org_id and (o.status = 'APPROVED' or public.is_platform_admin() or public.is_org_member(o.id))
    )
  );
drop policy if exists "service_fields_write" on public.service_fields;
create policy "service_fields_write" on public.service_fields
  for all to authenticated using (
    public.is_org_member(org_id, array['OWNER','ADMIN','MANAGER']::public.membership_role[])
    or public.is_platform_admin()
  ) with check (
    public.is_org_member(org_id, array['OWNER','ADMIN','MANAGER']::public.membership_role[])
    or public.is_platform_admin()
  );

drop policy if exists "working_hours_select" on public.working_hours;
create policy "working_hours_select" on public.working_hours
  for select to public using (
    exists (
      select 1 from public.organizations o
      where o.id = org_id and (o.status = 'APPROVED' or public.is_platform_admin() or public.is_org_member(o.id))
    )
  );
drop policy if exists "working_hours_write" on public.working_hours;
create policy "working_hours_write" on public.working_hours
  for all to authenticated using (
    public.is_org_member(org_id, array['OWNER','ADMIN','MANAGER']::public.membership_role[])
    or public.is_platform_admin()
  ) with check (
    public.is_org_member(org_id, array['OWNER','ADMIN','MANAGER']::public.membership_role[])
    or public.is_platform_admin()
  );

drop policy if exists "schedule_exceptions_select" on public.schedule_exceptions;
create policy "schedule_exceptions_select" on public.schedule_exceptions
  for select to public using (
    exists (
      select 1 from public.organizations o
      where o.id = org_id and (o.status = 'APPROVED' or public.is_platform_admin() or public.is_org_member(o.id))
    )
  );
drop policy if exists "schedule_exceptions_write" on public.schedule_exceptions;
create policy "schedule_exceptions_write" on public.schedule_exceptions
  for all to authenticated using (
    public.is_org_member(org_id, array['OWNER','ADMIN','MANAGER']::public.membership_role[])
    or public.is_platform_admin()
  ) with check (
    public.is_org_member(org_id, array['OWNER','ADMIN','MANAGER']::public.membership_role[])
    or public.is_platform_admin()
  );

drop policy if exists "availability_slots_select" on public.availability_slots;
create policy "availability_slots_select" on public.availability_slots
  for select to public using (
    exists (
      select 1 from public.organizations o
      where o.id = org_id and (o.status = 'APPROVED' or public.is_platform_admin() or public.is_org_member(o.id))
    )
  );

-- ---------------------------------------------------------------------------
-- Membership & staff
-- ---------------------------------------------------------------------------
drop policy if exists "organization_members_select" on public.organization_members;
create policy "organization_members_select" on public.organization_members
  for select to authenticated using (
    user_id = auth.uid() or public.is_org_member(org_id) or public.is_platform_admin()
  );
drop policy if exists "organization_members_write" on public.organization_members;
create policy "organization_members_write" on public.organization_members
  for all to authenticated using (
    public.is_org_member(org_id, array['OWNER','ADMIN']::public.membership_role[])
    or public.is_platform_admin()
  ) with check (
    public.is_org_member(org_id, array['OWNER','ADMIN']::public.membership_role[])
    or public.is_platform_admin()
  );

drop policy if exists "staff_assignments_select" on public.staff_assignments;
create policy "staff_assignments_select" on public.staff_assignments
  for select to authenticated using (
    user_id = auth.uid() or public.is_org_member(org_id) or public.is_platform_admin()
  );
drop policy if exists "staff_assignments_write" on public.staff_assignments;
create policy "staff_assignments_write" on public.staff_assignments
  for all to authenticated using (
    public.is_org_member(org_id, array['OWNER','ADMIN','MANAGER']::public.membership_role[])
    or public.is_platform_admin()
  ) with check (
    public.is_org_member(org_id, array['OWNER','ADMIN','MANAGER']::public.membership_role[])
    or public.is_platform_admin()
  );

-- ---------------------------------------------------------------------------
-- Appointments, tokens and check-ins
-- ---------------------------------------------------------------------------
drop policy if exists "appointments_select" on public.appointments;
create policy "appointments_select" on public.appointments
  for select to authenticated using (
    customer_id = auth.uid()
    or public.is_org_member(org_id)
    or public.is_platform_admin()
  );

drop policy if exists "tokens_select" on public.tokens;
create policy "tokens_select" on public.tokens
  for select to authenticated using (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_id
        and (a.customer_id = auth.uid() or public.is_org_member(a.org_id))
    )
    or public.is_platform_admin()
  );

drop policy if exists "check_in_events_select" on public.check_in_events;
create policy "check_in_events_select" on public.check_in_events
  for select to authenticated using (
    public.is_org_member(org_id) or public.is_platform_admin()
  );

-- ---------------------------------------------------------------------------
-- Operational & platform tables
-- ---------------------------------------------------------------------------
drop policy if exists "reminder_events_select" on public.reminder_events;
create policy "reminder_events_select" on public.reminder_events
  for select to authenticated using (
    public.is_org_member(org_id, array['OWNER','ADMIN','MANAGER']::public.membership_role[])
    or public.is_platform_admin()
  );

drop policy if exists "notification_events_select" on public.notification_events;
create policy "notification_events_select" on public.notification_events
  for select to authenticated using (
    public.is_org_member(org_id, array['OWNER','ADMIN','MANAGER']::public.membership_role[])
    or public.is_platform_admin()
  );

drop policy if exists "audit_logs_select" on public.audit_logs;
create policy "audit_logs_select" on public.audit_logs
  for select to authenticated using (
    public.is_org_member(org_id, array['OWNER','ADMIN','MANAGER']::public.membership_role[])
    or public.is_platform_admin()
  );

drop policy if exists "platform_settings_select" on public.platform_settings;
create policy "platform_settings_select" on public.platform_settings
  for select to authenticated using (public.is_platform_admin());
