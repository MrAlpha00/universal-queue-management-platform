-- TokenFlow · enforce organization registration and service cancellation policy.
-- These rules live in the database so every write path (API, server action,
-- direct PostgREST call) observes the same policy.

-- ---------------------------------------------------------------------------
-- Organization registration switch
-- ---------------------------------------------------------------------------
-- Read-only helper for the onboarding UI. Returns true unless a platform
-- administrator has explicitly disabled public organization registration.
create or replace function public.organization_registration_open()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(
    (select (value #>> '{}')::boolean
     from public.platform_settings
     where key = 'allow_public_registration'),
    true
  );
$$;

revoke execute on function public.organization_registration_open() from public, anon;
grant execute on function public.organization_registration_open() to authenticated;

-- Re-create the defaults trigger with the registration gate. Platform
-- administrators can still create organizations while registration is closed.
create or replace function public.apply_organization_defaults()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  new.owner_id := coalesce(new.owner_id, auth.uid());
  if auth.uid() is not null and not public.is_platform_admin() then
    if not public.setting_bool('allow_public_registration', true) then
      raise exception 'Organization registration is currently closed';
    end if;
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

-- ---------------------------------------------------------------------------
-- Customer cancellation policy
-- ---------------------------------------------------------------------------
-- Customers may cancel only while the service allows it and before the
-- configured cutoff. Staff and platform administrators retain operational
-- override so a bad-faith or exceptional case can still be resolved.
create or replace function public.cancel_booking(p_appointment uuid, p_reason text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_user uuid := auth.uid();
  v_app public.appointments%rowtype;
  v_service public.services%rowtype;
  v_is_staff boolean;
begin
  select * into v_app from public.appointments where id = p_appointment;
  if not found then raise exception 'Appointment not found'; end if;

  v_is_staff := public.is_org_member(v_app.org_id, array['OWNER','ADMIN','MANAGER']::public.membership_role[])
    or public.is_platform_admin();

  if v_app.customer_id <> v_user and not v_is_staff then
    raise exception 'Not authorized to cancel this appointment';
  end if;
  if v_app.status not in ('BOOKED', 'CHECKED_IN') then
    raise exception 'This appointment can no longer be cancelled';
  end if;

  select * into v_service from public.services where id = v_app.service_id;

  if v_app.customer_id = v_user and not v_is_staff then
    if not coalesce(v_service.allow_cancellation, true) then
      raise exception 'This service does not allow customer cancellation';
    end if;
    if coalesce(v_service.cancellation_hours, 0) > 0
       and now() > v_app.start_at - (v_service.cancellation_hours || ' hours')::interval then
      raise exception 'The cancellation window for this appointment has closed';
    end if;
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
    jsonb_build_object(
      'reason', p_reason,
      'policy_override', (v_app.customer_id = v_user and v_is_staff)
    ));

  return jsonb_build_object(
    'appointment_id', p_appointment,
    'org_id', v_app.org_id,
    'customer_id', v_app.customer_id,
    'start_at', v_app.start_at,
    'status', 'CANCELLED'
  );
end;
$$;

-- Replacing a function preserves its ACL, but make the intended surface
-- explicit for fresh databases and future readers.
revoke execute on function public.cancel_booking(uuid, text) from public, anon;
grant execute on function public.cancel_booking(uuid, text) to authenticated;
