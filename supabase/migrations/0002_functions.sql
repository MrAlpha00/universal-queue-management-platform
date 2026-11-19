-- TokenFlow · authorization helpers, atomic booking engine and token lifecycle.
-- All privileged routines are SECURITY DEFINER with a locked search_path and are
-- only reachable through explicit grants in 0003_rls.sql.

-- ---------------------------------------------------------------------------
-- Authorization helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.platform_role = 'PLATFORM_ADMIN'
  );
$$;

create or replace function public.is_org_member(
  p_org uuid,
  p_roles public.membership_role[] default null
)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.organization_members m
    where m.org_id = p_org
      and m.user_id = auth.uid()
      and m.membership_status = 'ACTIVE'
      and (p_roles is null or m.role = any(p_roles))
  );
$$;

create or replace function public.org_role(p_org uuid)
returns public.membership_role language sql stable security definer set search_path = public, pg_temp as $$
  select m.role from public.organization_members m
  where m.org_id = p_org and m.user_id = auth.uid() and m.membership_status = 'ACTIVE'
  limit 1;
$$;

create or replace function public.can_view_profile(p_profile uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select p_profile = auth.uid()
      or public.is_platform_admin()
      or exists (
        select 1 from public.appointments a
        join public.organization_members m on m.org_id = a.org_id and m.user_id = auth.uid()
        where a.customer_id = p_profile and m.membership_status = 'ACTIVE'
      );
$$;

create or replace function public.setting_bool(p_key text, p_default boolean)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select (value #>> '{}')::boolean from public.platform_settings where key = p_key), p_default);
$$;

create or replace function public.setting_int(p_key text, p_default integer)
returns integer language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select (value #>> '{}')::integer from public.platform_settings where key = p_key), p_default);
$$;

create or replace function public.log_audit(
  p_org uuid,
  p_action text,
  p_entity_type text,
  p_entity_id text default null,
  p_details jsonb default '{}'::jsonb
)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.audit_logs (org_id, actor_id, action, entity_type, entity_id, details)
  values (p_org, auth.uid(), p_action, p_entity_type, p_entity_id, p_details);
end;
$$;

-- ---------------------------------------------------------------------------
-- Identity & organization triggers
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url, timezone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url',
    coalesce(new.raw_user_meta_data ->> 'timezone', 'UTC')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.apply_organization_defaults()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  new.owner_id := coalesce(new.owner_id, auth.uid());
  if auth.uid() is not null and not public.is_platform_admin() then
    if public.setting_bool('auto_approve_organizations', false) then
      new.status := 'APPROVED';
      new.approved_at := now();
    else
      new.status := 'PENDING';
    end if;
  end if;
  new.settings := coalesce(new.settings, '{}'::jsonb)
    || jsonb_build_object(
      'booking_horizon_days', coalesce(new.settings -> 'booking_horizon_days', to_jsonb(public.setting_int('default_booking_horizon_days', 3))),
      'token_prefix', coalesce(new.settings -> 'token_prefix', to_jsonb('TK'::text)),
      'checkin_early_minutes', coalesce(new.settings -> 'checkin_early_minutes', to_jsonb(0)),
      'checkin_grace_minutes', coalesce(new.settings -> 'checkin_grace_minutes', to_jsonb(0)),
      'reminder_offsets_minutes', coalesce(new.settings -> 'reminder_offsets_minutes', to_jsonb('[120,90,60,30,10]'::jsonb))
    );
  return new;
end;
$$;

drop trigger if exists organizations_defaults on public.organizations;
create trigger organizations_defaults before insert on public.organizations
  for each row execute function public.apply_organization_defaults();

create or replace function public.after_organization_created()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.owner_id is not null then
    insert into public.organization_members (org_id, user_id, role)
    values (new.id, new.owner_id, 'OWNER')
    on conflict (org_id, user_id) do nothing;
  end if;

  insert into public.branches (org_id, name, slug, timezone)
  values (new.id, 'Main branch', 'main-branch', new.timezone)
  on conflict (org_id, slug) do nothing;

  insert into public.working_hours (org_id, branch_id, weekday, open_time, close_time)
  select new.id, b.id, d.weekday, '09:00'::time, '17:00'::time
  from public.branches b
  cross join (select unnest(array[1,2,3,4,5])::smallint as weekday) d
  where b.org_id = new.id and b.slug = 'main-branch'
  on conflict do nothing;

  perform public.log_audit(new.id, 'ORGANIZATION_CREATED', 'organization', new.id::text,
    jsonb_build_object('name', new.name, 'status', new.status));
  return new;
end;
$$;

drop trigger if exists organizations_after_created on public.organizations;
create trigger organizations_after_created after insert on public.organizations
  for each row execute function public.after_organization_created();

create or replace function public.protect_platform_role()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is not null
     and new.platform_role is distinct from old.platform_role
     and not public.is_platform_admin() then
    raise exception 'Platform roles can only be changed by a platform administrator';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role before update on public.profiles
  for each row execute function public.protect_platform_role();

create or replace function public.protect_organization_status()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is not null
     and new.status is distinct from old.status
     and not public.is_platform_admin() then
    raise exception 'Organization approval status can only be changed by a platform administrator';
  end if;
  return new;
end;
$$;

drop trigger if exists organizations_protect_status on public.organizations;
create trigger organizations_protect_status before update on public.organizations
  for each row execute function public.protect_organization_status();

-- ---------------------------------------------------------------------------
-- Slot generation
-- ---------------------------------------------------------------------------
create or replace function public.generate_slots(
  p_service uuid,
  p_branch uuid,
  p_start_date date,
  p_end_date date
)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_org uuid;
  v_duration integer;
  v_buffer integer;
  v_capacity integer;
  v_day date;
  v_hours record;
  v_exception record;
  v_open time;
  v_close time;
  v_break_start time;
  v_break_end time;
  v_cursor time;
  v_slot_end time;
  v_created integer := 0;
begin
  select s.org_id, s.duration_minutes, s.buffer_minutes, s.capacity
    into v_org, v_duration, v_buffer, v_capacity
  from public.services s where s.id = p_service;
  if not found then raise exception 'Service not found'; end if;

  if p_end_date < p_start_date or (p_end_date - p_start_date) > 366 then
    raise exception 'Invalid slot generation range';
  end if;

  v_day := p_start_date;
  while v_day <= p_end_date loop
    select * into v_exception
    from public.schedule_exceptions e
    where e.org_id = v_org
      and e.exception_date = v_day
      and (e.service_id = p_service or (e.service_id is null and (e.branch_id = p_branch or e.branch_id is null)))
    order by (e.service_id is not null) desc, (e.branch_id is not null) desc
    limit 1;

    if found and v_exception.exception_type in ('CLOSED', 'HOLIDAY') then
      v_day := v_day + 1;
      continue;
    end if;

    select * into v_hours
    from public.working_hours w
    where w.org_id = v_org
      and w.weekday = extract(isodow from v_day)::smallint
      and w.is_active
      and (w.service_id = p_service or w.service_id is null)
      and (w.branch_id = p_branch or w.branch_id is null)
    order by (w.service_id is not null) desc, (w.branch_id is not null) desc
    limit 1;

    if found then
      v_open := v_hours.open_time;
      v_close := v_hours.close_time;
      v_break_start := v_hours.break_start;
      v_break_end := v_hours.break_end;

      if v_exception.exception_type = 'SPECIAL' then
        v_open := v_exception.open_time;
        v_close := v_exception.close_time;
      end if;

      v_cursor := v_open;
      while v_cursor + (v_duration || ' minutes')::interval <= v_close loop
        v_slot_end := v_cursor + (v_duration || ' minutes')::interval;
        if v_break_start is null or v_break_end is null
           or v_cursor >= v_break_end or v_slot_end <= v_break_start then
          insert into public.availability_slots
            (org_id, branch_id, service_id, slot_date, start_time, end_time, capacity, status)
          values (v_org, p_branch, p_service, v_day, v_cursor, v_slot_end, v_capacity, 'OPEN')
          on conflict (service_id, branch_id, slot_date, start_time) do nothing;
          if found then v_created := v_created + 1; end if;
        end if;
        v_cursor := v_cursor + ((v_duration + v_buffer) || ' minutes')::interval;
      end loop;
    end if;

    v_day := v_day + 1;
  end loop;
  return v_created;
end;
$$;

-- Forward declaration; replaced with the real implementation below.
create or replace function public._next_token_number(p_service uuid, p_date date)
returns text language sql as $$ select 'TK-000'::text $$;

-- ---------------------------------------------------------------------------
-- Internal booking insertion (shared by create + reschedule)
-- ---------------------------------------------------------------------------
create or replace function public._insert_booking_internal(
  p_customer uuid,
  p_service uuid,
  p_branch uuid,
  p_slot_date date,
  p_start_time time,
  p_responses jsonb,
  p_source text default 'ONLINE',
  p_skip_dedupe boolean default false
)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_service public.services%rowtype;
  v_org public.organizations%rowtype;
  v_branch uuid;
  v_slot public.availability_slots%rowtype;
  v_tz text;
  v_horizon integer;
  v_local_today date;
  v_start_at timestamptz;
  v_end_at timestamptz;
  v_appointment_id uuid;
  v_token_id uuid;
  v_token_number text;
  v_reference text;
  v_hash text;
  v_field record;
  v_grace integer;
begin
  select * into v_service from public.services where id = p_service;
  if not found or not v_service.is_active then
    raise exception 'This service is not available';
  end if;

  select * into v_org from public.organizations where id = v_service.org_id;
  if not found then raise exception 'Organization not found'; end if;
  if v_org.status <> 'APPROVED'
     and not public.is_org_member(v_org.id, array['OWNER','ADMIN','MANAGER']::public.membership_role[]) then
    raise exception 'This organization is not accepting bookings';
  end if;
  if public.setting_bool('maintenance_mode', false) then
    raise exception 'Booking is temporarily unavailable';
  end if;

  v_tz := coalesce(v_org.settings ->> 'timezone', v_org.timezone, 'UTC');
  v_local_today := (now() at time zone v_tz)::date;
  v_horizon := coalesce(v_service.booking_horizon_days,
                        (v_org.settings ->> 'booking_horizon_days')::integer,
                        public.setting_int('default_booking_horizon_days', 3), 3);

  if p_slot_date < v_local_today or p_slot_date > v_local_today + (v_horizon - 1) then
    raise exception 'The selected date is outside the booking window';
  end if;

  v_branch := p_branch;
  if v_service.branch_id is not null then
    if v_branch is null then v_branch := v_service.branch_id; end if;
    if v_branch <> v_service.branch_id then
      raise exception 'This service is not offered at the selected branch';
    end if;
  end if;
  if v_branch is null then
    select id into v_branch from public.branches
    where org_id = v_org.id and is_active order by created_at limit 1;
    if v_branch is null then raise exception 'No active branch is available'; end if;
  end if;

  perform public.generate_slots(p_service, v_branch, p_slot_date, p_slot_date);

  select * into v_slot
  from public.availability_slots s
  where s.service_id = p_service
    and s.branch_id = v_branch
    and s.slot_date = p_slot_date
    and s.start_time = p_start_time
  for update;
  if not found then raise exception 'That time slot does not exist'; end if;
  if v_slot.status <> 'OPEN' or v_slot.booked_count >= v_slot.capacity then
    raise exception 'That time slot is no longer available';
  end if;

  v_start_at := (p_slot_date + p_start_time) at time zone v_tz;
  v_end_at := v_start_at + (v_service.duration_minutes || ' minutes')::interval;
  if v_start_at <= now() then raise exception 'That time slot has already passed'; end if;

  if not p_skip_dedupe and exists (
    select 1 from public.appointments a
    where a.customer_id = p_customer
      and a.service_id = p_service
      and a.appointment_date = p_slot_date
      and a.status = 'BOOKED'
  ) then
    raise exception 'You already have a booking for this service on that date';
  end if;

  for v_field in
    select f.name, f.label from public.service_fields f
    where f.service_id = p_service and f.is_active and f.is_required
  loop
    if not (coalesce(p_responses, '{}'::jsonb) ? v_field.name)
       or nullif(btrim(coalesce(p_responses ->> v_field.name, '')), '') is null then
      raise exception 'Missing required field: %', v_field.label;
    end if;
  end loop;

  insert into public.appointments (
    org_id, branch_id, service_id, customer_id, slot_id, appointment_date,
    start_time, end_time, start_at, end_at, timezone, status, responses, source
  ) values (
    v_org.id, v_branch, p_service, p_customer, v_slot.id, p_slot_date,
    p_start_time, v_slot.end_time, v_start_at, v_end_at, v_tz, 'BOOKED',
    coalesce(p_responses, '{}'::jsonb), p_source
  ) returning id into v_appointment_id;

  update public.availability_slots
  set booked_count = booked_count + 1
  where id = v_slot.id and booked_count < capacity;

  if not found then
    delete from public.appointments where id = v_appointment_id;
    raise exception 'That time slot is no longer available';
  end if;

  v_token_number := public._next_token_number(p_service, p_slot_date);

  insert into public.tokens (org_id, appointment_id, service_id, appointment_date, token_number, status)
  values (v_org.id, v_appointment_id, p_service, p_slot_date, v_token_number, 'BOOKED')
  returning id into v_token_id;

  v_reference := 'tfq_' || replace(replace(
    replace(encode(gen_random_bytes(24), 'base64'), '=', ''), '+', '-'), '/', '_');
  v_hash := encode(digest(v_reference, 'sha256'), 'hex');
  v_grace := coalesce((v_org.settings ->> 'checkin_grace_minutes')::integer, 0);

  insert into public.qr_credentials (org_id, appointment_id, token_id, reference_hash, expires_at)
  values (v_org.id, v_appointment_id, v_token_id, v_hash,
          v_end_at + (v_grace || ' minutes')::interval);

  perform public.log_audit(v_org.id, 'APPOINTMENT_CREATED', 'appointment', v_appointment_id::text,
    jsonb_build_object('service', v_service.name, 'date', p_slot_date, 'token', v_token_number));

  return jsonb_build_object(
    'appointment_id', v_appointment_id,
    'token_id', v_token_id,
    'token_number', v_token_number,
    'qr_reference', v_reference,
    'org_id', v_org.id,
    'org_slug', v_org.slug,
    'org_name', v_org.name,
    'branch_id', v_branch,
    'service_id', p_service,
    'appointment_date', p_slot_date,
    'start_time', v_slot.end_time - (v_service.duration_minutes || ' minutes')::interval,
    'end_time', v_slot.end_time,
    'start_at', v_start_at,
    'end_at', v_end_at,
    'timezone', v_tz
  );
end;
$$;

-- Token number allocation must be created before _insert_booking_internal can call it.
create or replace function public._next_token_number(p_service uuid, p_date date)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_prefix text;
  v_seq integer;
begin
  select coalesce(o.settings ->> 'token_prefix', 'TK') into v_prefix
  from public.organizations o join public.services s on s.org_id = o.id
  where s.id = p_service;

  insert into public.token_sequences (scope_key, sequence_date, value)
  values (p_service::text, p_date, 1)
  on conflict (scope_key, sequence_date)
  do update set value = public.token_sequences.value + 1, updated_at = now()
  returning value into v_seq;

  return coalesce(v_prefix, 'TK') || '-' || lpad(v_seq::text, 3, '0');
end;
$$;

-- ---------------------------------------------------------------------------
-- Public booking API
-- ---------------------------------------------------------------------------
create or replace function public.create_booking(
  p_service uuid,
  p_branch uuid,
  p_slot_date date,
  p_start_time time,
  p_responses jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_customer uuid := auth.uid();
begin
  if v_customer is null then raise exception 'Authentication is required'; end if;
  return public._insert_booking_internal(v_customer, p_service, p_branch, p_slot_date, p_start_time, p_responses, 'ONLINE', false);
end;
$$;

create or replace function public.cancel_booking(p_appointment uuid, p_reason text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_user uuid := auth.uid();
  v_app public.appointments%rowtype;
begin
  select * into v_app from public.appointments where id = p_appointment;
  if not found then raise exception 'Appointment not found'; end if;
  if v_app.customer_id <> v_user
     and not public.is_org_member(v_app.org_id, array['OWNER','ADMIN','MANAGER']::public.membership_role[])
     and not public.is_platform_admin() then
    raise exception 'Not authorized to cancel this appointment';
  end if;
  if v_app.status not in ('BOOKED', 'CHECKED_IN') then
    raise exception 'This appointment can no longer be cancelled';
  end if;

  update public.appointments
  set status = 'CANCELLED', cancelled_at = now(), notes = coalesce(p_reason, notes)
  where id = p_appointment;

  update public.tokens set status = 'CANCELLED', updated_at = now() where appointment_id = p_appointment;
  update public.qr_credentials set is_active = false, revoked_at = now() where appointment_id = p_appointment;
  update public.reminder_events set status = 'CANCELLED', updated_at = now()
  where appointment_id = p_appointment and status = 'SCHEDULED';

  if v_app.slot_id is not null then
    update public.availability_slots
    set booked_count = greatest(0, booked_count - 1)
    where id = v_app.slot_id;
  end if;

  perform public.log_audit(v_app.org_id, 'APPOINTMENT_CANCELLED', 'appointment', p_appointment::text,
    jsonb_build_object('reason', p_reason));

  return jsonb_build_object(
    'appointment_id', p_appointment,
    'org_id', v_app.org_id,
    'customer_id', v_app.customer_id,
    'start_at', v_app.start_at,
    'status', 'CANCELLED'
  );
end;
$$;

create or replace function public.reschedule_booking(
  p_appointment uuid,
  p_service uuid,
  p_branch uuid,
  p_slot_date date,
  p_start_time time,
  p_responses jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_user uuid := auth.uid();
  v_app public.appointments%rowtype;
  v_new jsonb;
begin
  select * into v_app from public.appointments where id = p_appointment;
  if not found then raise exception 'Appointment not found'; end if;
  if v_app.customer_id <> v_user
     and not public.is_org_member(v_app.org_id, array['OWNER','ADMIN','MANAGER']::public.membership_role[]) then
    raise exception 'Not authorized to reschedule this appointment';
  end if;
  if v_app.status not in ('BOOKED', 'CHECKED_IN') then
    raise exception 'This appointment can no longer be rescheduled';
  end if;

  v_new := public._insert_booking_internal(
    v_app.customer_id, p_service, p_branch, p_slot_date, p_start_time,
    coalesce(p_responses, v_app.responses), 'ONLINE', true
  );

  update public.appointments
  set status = 'RESCHEDULED', rescheduled_at = now()
  where id = p_appointment;

  update public.tokens set status = 'RESCHEDULED', updated_at = now() where appointment_id = p_appointment;
  update public.qr_credentials set is_active = false, revoked_at = now() where appointment_id = p_appointment;
  update public.reminder_events set status = 'CANCELLED', updated_at = now()
  where appointment_id = p_appointment and status = 'SCHEDULED';

  if v_app.slot_id is not null then
    update public.availability_slots
    set booked_count = greatest(0, booked_count - 1)
    where id = v_app.slot_id;
  end if;

  perform public.log_audit(v_app.org_id, 'APPOINTMENT_RESCHEDULED', 'appointment', p_appointment::text,
    jsonb_build_object('new_appointment_id', v_new ->> 'appointment_id'));

  return v_new;
end;
$$;

-- ---------------------------------------------------------------------------
-- QR verification & operational status
-- ---------------------------------------------------------------------------
create or replace function public.verify_qr(
  p_reference text,
  p_org_slug text,
  p_branch_id uuid default null,
  p_source text default 'CAMERA'
)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_org public.organizations%rowtype;
  v_cred public.qr_credentials%rowtype;
  v_app public.appointments%rowtype;
  v_token public.tokens%rowtype;
  v_customer public.profiles%rowtype;
  v_service public.services%rowtype;
  v_hash text;
  v_early integer;
  v_grace integer;
  v_existing jsonb;
begin
  select * into v_org from public.organizations where slug = p_org_slug;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'INVALID_QR', 'message', 'This QR code is not valid.');
  end if;
  if not public.is_org_member(v_org.id, array['OWNER','ADMIN','MANAGER','STAFF']::public.membership_role[])
     and not public.is_platform_admin() then
    raise exception 'Not authorized to verify tokens for this organization';
  end if;

  v_hash := encode(digest(coalesce(p_reference, ''), 'sha256'), 'hex');
  select * into v_cred from public.qr_credentials
  where reference_hash = v_hash and is_active;
  if not found then
    perform public.log_audit(v_org.id, 'QR_SCAN_INVALID', 'token', null, jsonb_build_object('source', p_source));
    return jsonb_build_object('ok', false, 'code', 'INVALID_QR', 'message', 'This QR code is not valid.');
  end if;

  select * into v_app from public.appointments where id = v_cred.appointment_id;
  select * into v_token from public.tokens where id = v_cred.token_id;
  if not found or v_app.org_id <> v_org.id then
    return jsonb_build_object('ok', false, 'code', 'WRONG_ORGANIZATION', 'message', 'This token belongs to a different organization.');
  end if;
  if p_branch_id is not null and v_app.branch_id <> p_branch_id then
    return jsonb_build_object('ok', false, 'code', 'WRONG_BRANCH', 'message', 'This token belongs to a different branch.');
  end if;

  select * into v_customer from public.profiles where id = v_app.customer_id;
  select * into v_service from public.services where id = v_app.service_id;

  v_early := coalesce((v_org.settings ->> 'checkin_early_minutes')::integer, 0);
  v_grace := coalesce((v_org.settings ->> 'checkin_grace_minutes')::integer, 0);

  if v_app.status = 'CANCELLED' then
    return jsonb_build_object('ok', false, 'code', 'CANCELLED', 'message', 'This appointment was cancelled.');
  end if;
  if v_app.status = 'RESCHEDULED' then
    return jsonb_build_object('ok', false, 'code', 'RESCHEDULED', 'message', 'This appointment was rescheduled.');
  end if;
  if v_app.status in ('COMPLETED', 'NO_SHOW') then
    return jsonb_build_object('ok', false, 'code', 'TERMINAL', 'message', 'This appointment is already closed.');
  end if;

  if v_app.status in ('CHECKED_IN', 'IN_PROGRESS') then
    select jsonb_build_object(
      'checked_in_at', e.created_at,
      'source', e.scan_source
    ) into v_existing
    from public.check_in_events e
    where e.appointment_id = v_app.id and e.result = 'CHECKED_IN'
    order by e.created_at limit 1;

    insert into public.check_in_events (org_id, appointment_id, token_id, scanned_by, scan_source, result)
    values (v_org.id, v_app.id, v_token.id, auth.uid(),
            case when p_source = 'MANUAL' then 'MANUAL' else 'CAMERA' end, 'DUPLICATE');

    return jsonb_build_object(
      'ok', true, 'duplicate', true,
      'code', 'ALREADY_CHECKED_IN',
      'message', 'Already checked in.',
      'appointment', jsonb_build_object(
        'id', v_app.id,
        'token_number', v_token.token_number,
        'customer_name', v_customer.full_name,
        'service', v_service.name,
        'date', v_app.appointment_date,
        'start_time', v_app.start_time,
        'end_time', v_app.end_time,
        'status', v_app.status,
        'checked_in_at', v_existing ->> 'checked_in_at'
      )
    );
  end if;

  if now() > v_app.end_at + (v_grace || ' minutes')::interval then
    update public.appointments set status = 'EXPIRED', updated_at = now() where id = v_app.id;
    update public.tokens set status = 'EXPIRED', updated_at = now() where id = v_app.id;
    update public.qr_credentials set is_active = false, revoked_at = now() where appointment_id = v_app.id;
    update public.reminder_events set status = 'SKIPPED', updated_at = now()
    where appointment_id = v_app.id and status = 'SCHEDULED';
    insert into public.check_in_events (org_id, appointment_id, token_id, scanned_by, scan_source, result)
    values (v_org.id, v_app.id, v_token.id, auth.uid(),
            case when p_source = 'MANUAL' then 'MANUAL' else 'CAMERA' end, 'EXPIRED');
    perform public.log_audit(v_org.id, 'TOKEN_EXPIRED', 'token', v_token.id::text, jsonb_build_object('appointment_id', v_app.id));
    return jsonb_build_object('ok', false, 'code', 'EXPIRED', 'message', 'This token has expired.');
  end if;

  if now() < v_app.start_at - (v_early || ' minutes')::interval then
    insert into public.check_in_events (org_id, appointment_id, token_id, scanned_by, scan_source, result)
    values (v_org.id, v_app.id, v_token.id, auth.uid(),
            case when p_source = 'MANUAL' then 'MANUAL' else 'CAMERA' end, 'NOT_OPEN');
    return jsonb_build_object('ok', false, 'code', 'NOT_OPEN', 'message', 'Check-in is not open yet.');
  end if;

  update public.appointments set status = 'CHECKED_IN', updated_at = now() where id = v_app.id;
  update public.tokens set status = 'CHECKED_IN', updated_at = now() where id = v_app.id;
  insert into public.check_in_events (org_id, appointment_id, token_id, scanned_by, scan_source, result)
  values (v_org.id, v_app.id, v_token.id, auth.uid(),
          case when p_source = 'MANUAL' then 'MANUAL' else 'CAMERA' end, 'CHECKED_IN');
  perform public.log_audit(v_org.id, 'TOKEN_CHECKED_IN', 'token', v_token.id::text,
    jsonb_build_object('appointment_id', v_app.id, 'source', p_source));

  return jsonb_build_object(
    'ok', true, 'duplicate', false,
    'code', 'CHECKED_IN', 'message', 'Check-in confirmed.',
    'appointment', jsonb_build_object(
      'id', v_app.id,
      'token_number', v_token.token_number,
      'customer_name', v_customer.full_name,
      'customer_email', v_customer.email,
      'service', v_service.name,
      'date', v_app.appointment_date,
      'start_time', v_app.start_time,
      'end_time', v_app.end_time,
      'timezone', v_app.timezone,
      'status', 'CHECKED_IN'
    )
  );
end;
$$;

create or replace function public.update_appointment_status(
  p_appointment uuid,
  p_status public.appointment_status
)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_app public.appointments%rowtype;
  v_allowed public.appointment_status[];
begin
  select * into v_app from public.appointments where id = p_appointment;
  if not found then raise exception 'Appointment not found'; end if;
  if not public.is_org_member(v_app.org_id, array['OWNER','ADMIN','MANAGER','STAFF']::public.membership_role[]) then
    raise exception 'Not authorized to update this appointment';
  end if;

  v_allowed := case v_app.status
    when 'BOOKED' then array['CANCELLED','EXPIRED','NO_SHOW']::public.appointment_status[]
    when 'CHECKED_IN' then array['IN_PROGRESS','CANCELLED','NO_SHOW']::public.appointment_status[]
    when 'IN_PROGRESS' then array['COMPLETED','CANCELLED']::public.appointment_status[]
    when 'EXPIRED' then array['NO_SHOW']::public.appointment_status[]
    else array[]::public.appointment_status[]
  end;

  if not (p_status = any(v_allowed)) then
    raise exception 'Invalid status transition from % to %', v_app.status, p_status;
  end if;

  update public.appointments set status = p_status,
    completed_at = case when p_status = 'COMPLETED' then now() else completed_at end,
    updated_at = now()
  where id = p_appointment;
  update public.tokens set status = p_status, updated_at = now() where appointment_id = p_appointment;
  if p_status in ('CANCELLED', 'COMPLETED', 'EXPIRED', 'NO_SHOW', 'RESCHEDULED') then
    update public.qr_credentials set is_active = false, revoked_at = now() where appointment_id = p_appointment;
  end if;
  perform public.log_audit(v_app.org_id, 'APPOINTMENT_STATUS_CHANGED', 'appointment', p_appointment::text,
    jsonb_build_object('from', v_app.status, 'to', p_status));
  return jsonb_build_object('appointment_id', p_appointment, 'status', p_status);
end;
$$;

create or replace function public.expire_stale_tokens(p_org uuid default null)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_count integer;
  v_ids uuid[];
begin
  select array_agg(a.id) into v_ids
  from public.appointments a
  join public.organizations o on o.id = a.org_id
  where a.status = 'BOOKED'
    and a.end_at < now() - (coalesce((o.settings ->> 'checkin_grace_minutes')::integer, 0) || ' minutes')::interval
    and (p_org is null or a.org_id = p_org);

  if v_ids is null then return 0; end if;

  update public.appointments set status = 'EXPIRED', updated_at = now() where id = any(v_ids);
  update public.tokens set status = 'EXPIRED', updated_at = now() where appointment_id = any(v_ids);
  update public.qr_credentials set is_active = false, revoked_at = now() where appointment_id = any(v_ids);
  update public.reminder_events set status = 'SKIPPED', updated_at = now()
  where appointment_id = any(v_ids) and status = 'SCHEDULED';

  get diagnostics v_count = row_count;
  return coalesce(array_length(v_ids, 1), 0);
end;
$$;

create or replace function public.reissue_qr(p_appointment uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_app public.appointments%rowtype;
  v_cred public.qr_credentials%rowtype;
  v_ref text;
  v_hash text;
begin
  select * into v_app from public.appointments where id = p_appointment;
  if not found then raise exception 'Appointment not found'; end if;
  if v_app.customer_id <> auth.uid()
     and not public.is_org_member(v_app.org_id, array['OWNER','ADMIN','MANAGER']::public.membership_role[]) then
    raise exception 'Not authorized to reissue this QR code';
  end if;
  if v_app.status <> 'BOOKED' then raise exception 'Only active bookings can be reissued'; end if;

  select * into v_cred from public.qr_credentials where appointment_id = p_appointment and is_active limit 1;
  if found then
    update public.qr_credentials set is_active = false, revoked_at = now() where id = v_cred.id;
  end if;

  v_ref := 'tfq_' || replace(replace(
    replace(encode(gen_random_bytes(24), 'base64'), '=', ''), '+', '-'), '/', '_');
  v_hash := encode(digest(v_ref, 'sha256'), 'hex');

  insert into public.qr_credentials (org_id, appointment_id, token_id, reference_hash, expires_at)
  select v_app.org_id, v_app.id, t.id, v_hash, v_app.end_at + interval '30 minutes'
  from public.tokens t where t.appointment_id = p_appointment;

  perform public.log_audit(v_app.org_id, 'QR_REISSUED', 'appointment', p_appointment::text, '{}'::jsonb);
  return jsonb_build_object('qr_reference', v_ref, 'appointment_id', p_appointment);
end;
$$;
