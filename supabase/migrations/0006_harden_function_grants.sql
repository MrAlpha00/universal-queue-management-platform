-- TokenFlow · function privilege hardening
-- PostgreSQL grants EXECUTE on new functions to PUBLIC by default. The grants
-- below make the callable surface explicit: browser clients may only invoke the
-- RPCs they actually use, internal helpers are not reachable over PostgREST, and
-- Trigger.dev retains access to the expiration routine through service_role.

-- ---------------------------------------------------------------------------
-- Helper functions used inside RLS policies
-- ---------------------------------------------------------------------------
revoke execute on function public.is_platform_admin() from public;
revoke execute on function public.is_org_member(uuid, public.membership_role[]) from public;
revoke execute on function public.org_role(uuid) from public;
revoke execute on function public.can_view_profile(uuid) from public;

grant execute on function public.is_platform_admin() to anon, authenticated;
grant execute on function public.is_org_member(uuid, public.membership_role[]) to anon, authenticated;
grant execute on function public.org_role(uuid) to authenticated;
grant execute on function public.can_view_profile(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Internal helpers: never callable by API clients
-- ---------------------------------------------------------------------------
revoke execute on function public.setting_bool(text, boolean) from public, anon, authenticated;
revoke execute on function public.setting_int(text, integer) from public, anon, authenticated;
revoke execute on function public.log_audit(uuid, text, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.generate_slots(uuid, uuid, date, date) from public, anon, authenticated;
revoke execute on function public._next_token_number(uuid, date) from public, anon, authenticated;
revoke execute on function public._insert_booking_internal(uuid, uuid, uuid, date, time, jsonb, text, boolean) from public, anon, authenticated;
revoke execute on function public.expire_stale_tokens(uuid) from public, anon, authenticated;
grant execute on function public.expire_stale_tokens(uuid) to service_role;

-- Trigger-only functions.
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.apply_organization_defaults() from public, anon, authenticated;
revoke execute on function public.after_organization_created() from public, anon, authenticated;
revoke execute on function public.protect_platform_role() from public, anon, authenticated;
revoke execute on function public.protect_organization_status() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Customer and staff RPCs
-- ---------------------------------------------------------------------------
revoke execute on function public.create_booking(uuid, uuid, date, time, jsonb) from public, anon;
revoke execute on function public.cancel_booking(uuid, text) from public, anon;
revoke execute on function public.reschedule_booking(uuid, uuid, uuid, date, time, jsonb) from public, anon;
revoke execute on function public.verify_qr(text, text, uuid, text) from public, anon;
revoke execute on function public.update_appointment_status(uuid, public.appointment_status) from public, anon;
revoke execute on function public.reissue_qr(uuid) from public, anon;
revoke execute on function public.reissue_qr_for_staff(uuid) from public, anon;
revoke execute on function public.admin_generate_slots(uuid, date, date) from public, anon;
revoke execute on function public.admin_expire_tokens(uuid) from public, anon;

grant execute on function public.create_booking(uuid, uuid, date, time, jsonb) to authenticated;
grant execute on function public.cancel_booking(uuid, text) to authenticated;
grant execute on function public.reschedule_booking(uuid, uuid, uuid, date, time, jsonb) to authenticated;
grant execute on function public.verify_qr(text, text, uuid, text) to authenticated;
grant execute on function public.update_appointment_status(uuid, public.appointment_status) to authenticated;
grant execute on function public.reissue_qr(uuid) to authenticated;
grant execute on function public.reissue_qr_for_staff(uuid) to authenticated;
grant execute on function public.admin_generate_slots(uuid, date, date) to authenticated;
grant execute on function public.admin_expire_tokens(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Platform administrator RPCs
-- ---------------------------------------------------------------------------
revoke execute on function public.set_organization_status(uuid, public.organization_status, text) from public, anon;
revoke execute on function public.set_user_platform_role(uuid, text) from public, anon;
revoke execute on function public.update_platform_setting(text, jsonb) from public, anon;

grant execute on function public.set_organization_status(uuid, public.organization_status, text) to authenticated;
grant execute on function public.set_user_platform_role(uuid, text) to authenticated;
grant execute on function public.update_platform_setting(text, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Public discovery RPC
-- ---------------------------------------------------------------------------
revoke execute on function public.get_available_slots(uuid, uuid, date) from public;
grant execute on function public.get_available_slots(uuid, uuid, date) to anon, authenticated;
