-- TokenFlow · platform console RPCs
-- Platform administrators bypass organization RLS through narrowly scoped,
-- server-authorized functions instead of broad table-level write policies.

create or replace function public.set_user_platform_role(
  p_user uuid,
  p_role text
)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_old text;
begin
  if not public.is_platform_admin() then
    raise exception 'Only a platform administrator can change platform roles';
  end if;
  if p_role not in ('USER', 'PLATFORM_ADMIN') then
    raise exception 'Invalid platform role';
  end if;
  if p_user = auth.uid() and p_role <> 'PLATFORM_ADMIN' then
    raise exception 'You cannot remove your own platform administrator access';
  end if;

  select platform_role into v_old from public.profiles where id = p_user;
  if not found then
    raise exception 'Profile not found';
  end if;

  update public.profiles set platform_role = p_role where id = p_user;

  perform public.log_audit(
    null,
    'PLATFORM_ROLE_CHANGED',
    'profile',
    p_user::text,
    jsonb_build_object('from', v_old, 'to', p_role)
  );

  return jsonb_build_object('user_id', p_user, 'platform_role', p_role);
end;
$$;

grant execute on function public.set_user_platform_role(uuid, text) to authenticated;

create or replace function public.update_platform_setting(
  p_key text,
  p_value jsonb
)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_old jsonb;
begin
  if not public.is_platform_admin() then
    raise exception 'Only a platform administrator can change platform settings';
  end if;

  select value into v_old from public.platform_settings where key = p_key;
  if not found then
    raise exception 'Unknown platform setting: %', p_key;
  end if;

  update public.platform_settings
  set value = p_value, updated_by = auth.uid()
  where key = p_key;

  perform public.log_audit(
    null,
    'PLATFORM_SETTING_CHANGED',
    'platform_setting',
    p_key,
    jsonb_build_object('from', v_old, 'to', p_value)
  );

  return jsonb_build_object('key', p_key, 'value', p_value);
end;
$$;

grant execute on function public.update_platform_setting(text, jsonb) to authenticated;
