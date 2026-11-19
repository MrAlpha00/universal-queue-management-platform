-- TokenFlow · privileged management RPCs (all server-authorized).

-- Public, read-only slot discovery. Generates slots lazily from configured
-- working hours so customers see real availability before the first booking.
create or replace function public.get_available_slots(
  p_service uuid,
  p_branch uuid,
  p_date date
)
returns table (
  id uuid,
  start_time time,
  end_time time,
  capacity integer,
  booked_count integer
)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_org uuid;
  v_status public.organization_status;
  v_active boolean;
  v_tz text;
  v_today date;
  v_horizon integer;
begin
  select s.org_id, s.is_active, o.status,
         coalesce(o.settings ->> 'timezone', o.timezone, 'UTC'),
         coalesce(s.booking_horizon_days, (o.settings ->> 'booking_horizon_days')::integer,
                  public.setting_int('default_booking_horizon_days', 3), 3)
  into v_org, v_active, v_status, v_tz, v_horizon
  from public.services s join public.organizations o on o.id = s.org_id
  where s.id = p_service;

  if not found or not v_active or v_status <> 'APPROVED' then
    return;
  end if;

  v_today := (now() at time zone v_tz)::date;
  if p_date < v_today or p_date > v_today + (v_horizon - 1) then
    return;
  end if;

  perform public.generate_slots(p_service, p_branch, p_date, p_date);

  return query
    select s.id, s.start_time, s.end_time, s.capacity, s.booked_count
    from public.availability_slots s
    where s.service_id = p_service
      and s.branch_id = p_branch
      and s.slot_date = p_date
      and s.status = 'OPEN'
      and s.booked_count < s.capacity
      and (p_date > v_today or s.start_time > (now() at time zone v_tz)::time)
    order by s.start_time;
end;
$$;

grant execute on function public.get_available_slots(uuid, uuid, date) to anon, authenticated;

create or replace function public.admin_generate_slots(
  p_service uuid,
  p_start_date date,
  p_end_date date
)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_org uuid;
  v_branch uuid;
  v_total integer := 0;
begin
  select s.org_id, s.branch_id into v_org, v_branch from public.services s where s.id = p_service;
  if not found then raise exception 'Service not found'; end if;
  if not public.is_org_member(v_org, array['OWNER','ADMIN','MANAGER']::public.membership_role[])
     and not public.is_platform_admin() then
    raise exception 'Not authorized to manage this schedule';
  end if;

  if v_branch is not null then
    v_total := public.generate_slots(p_service, v_branch, p_start_date, p_end_date);
  else
    select coalesce(sum(public.generate_slots(p_service, b.id, p_start_date, p_end_date)), 0)
    into v_total
    from public.branches b where b.org_id = v_org and b.is_active;
  end if;

  perform public.log_audit(v_org, 'SLOTS_GENERATED', 'service', p_service::text,
    jsonb_build_object('from', p_start_date, 'to', p_end_date, 'count', v_total));
  return v_total;
end;
$$;

create or replace function public.set_organization_status(
  p_org uuid,
  p_status public.organization_status,
  p_note text default null
)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_old public.organization_status;
begin
  if not public.is_platform_admin() then
    raise exception 'Only a platform administrator can change organization status';
  end if;
  select status into v_old from public.organizations where id = p_org;
  if not found then raise exception 'Organization not found'; end if;

  update public.organizations
  set status = p_status,
      approval_note = coalesce(p_note, approval_note),
      approved_at = case when p_status = 'APPROVED' then now() else approved_at end,
      approved_by = case when p_status = 'APPROVED' then auth.uid() else approved_by end
  where id = p_org;

  perform public.log_audit(p_org, 'ORGANIZATION_STATUS_CHANGED', 'organization', p_org::text,
    jsonb_build_object('from', v_old, 'to', p_status, 'note', p_note));
  return jsonb_build_object('organization_id', p_org, 'status', p_status);
end;
$$;

create or replace function public.admin_expire_tokens(p_org uuid default null)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_org is not null
     and not public.is_org_member(p_org, array['OWNER','ADMIN','MANAGER']::public.membership_role[])
     and not public.is_platform_admin() then
    raise exception 'Not authorized to expire tokens for this organization';
  end if;
  return public.expire_stale_tokens(p_org);
end;
$$;

create or replace function public.reissue_qr_for_staff(p_appointment uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_app public.appointments%rowtype;
  v_ref text;
  v_hash text;
begin
  select * into v_app from public.appointments where id = p_appointment;
  if not found then raise exception 'Appointment not found'; end if;
  if not public.is_org_member(v_app.org_id, array['OWNER','ADMIN','MANAGER','STAFF']::public.membership_role[]) then
    raise exception 'Not authorized to reissue this token';
  end if;
  if v_app.status <> 'BOOKED' then
    raise exception 'Only active bookings can be reissued';
  end if;

  v_ref := 'tfq_' || replace(replace(
    replace(encode(gen_random_bytes(24), 'base64'), '=', ''), '+', '-'), '/', '_');
  v_hash := encode(digest(v_ref, 'sha256'), 'hex');

  update public.qr_credentials set is_active = false, revoked_at = now()
  where appointment_id = p_appointment and is_active;

  insert into public.qr_credentials (org_id, appointment_id, token_id, reference_hash, expires_at)
  select v_app.org_id, v_app.id, t.id, v_hash, v_app.end_at + interval '30 minutes'
  from public.tokens t where t.appointment_id = p_appointment;

  perform public.log_audit(v_app.org_id, 'QR_REISSUED', 'appointment', p_appointment::text, '{}'::jsonb);
  return jsonb_build_object('qr_reference', v_ref, 'appointment_id', p_appointment);
end;
$$;
