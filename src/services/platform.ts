import { createClient } from "@/lib/supabase/server";
import type { AuditLog, NotificationEvent, Organization, Profile } from "@/types/domain";

export async function getPlatformStats() {
  const supabase = await createClient();
  const [orgs, users, appointments, pending, notifications, reminders] = await Promise.all([
    supabase.from("organizations").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("appointments").select("id", { count: "exact", head: true }),
    supabase.from("organizations").select("id", { count: "exact", head: true }).eq("status", "PENDING"),
    supabase.from("notification_events").select("id", { count: "exact", head: true }),
    supabase.from("reminder_events").select("id", { count: "exact", head: true }).eq("status", "SCHEDULED"),
  ]);

  return {
    organizations: orgs.count ?? 0,
    users: users.count ?? 0,
    appointments: appointments.count ?? 0,
    pending: pending.count ?? 0,
    notifications: notifications.count ?? 0,
    reminders: reminders.count ?? 0,
  };
}

export async function listPlatformOrganizations(search?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("organizations")
    .select("*, owner:profiles!organizations_owner_id_fkey(id, full_name, email)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (search?.trim()) query = query.ilike("name", `%${search.trim()}%`);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Array<Organization & { owner: Profile | null }>;
}

export async function listPlatformUsers(search?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);
  if (search?.trim()) {
    const term = search.trim();
    query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function getPlatformUserMemberships() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_members")
    .select("user_id, role, org_id, organizations(name, slug)")
    .limit(2000);
  if (error) throw error;
  return (data ?? []) as unknown as Array<{
    user_id: string;
    role: string;
    org_id: string;
    organizations: { name: string; slug: string } | null;
  }>;
}

export async function listPlatformBookings(limit = 200) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(`
      id, appointment_date, start_time, end_time, status, created_at,
      organization:organizations(name, slug),
      service:services(name),
      customer:profiles(full_name, email)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as Array<{
    id: string;
    appointment_date: string;
    start_time: string;
    end_time: string;
    status: string;
    created_at: string;
    organization: { name: string; slug: string } | null;
    service: { name: string } | null;
    customer: { full_name: string | null; email: string | null } | null;
  }>;
}

export type PlatformNotification = NotificationEvent & {
  organization: { name: string; slug: string } | null;
};

export async function listPlatformNotifications(limit = 150): Promise<PlatformNotification[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notification_events")
    .select("*, organization:organizations(name, slug)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as PlatformNotification[];
}

export type PlatformActivity = AuditLog & {
  organization: { name: string; slug: string } | null;
};

export async function listPlatformActivity(limit = 200): Promise<PlatformActivity[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*, actor:profiles(id, full_name, email, avatar_url), organization:organizations(name, slug)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as PlatformActivity[];
}

export async function getPlatformSettings() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("platform_settings").select("*").order("key");
  if (error) throw error;
  return (data ?? []) as Array<{ key: string; value: unknown; description: string | null; updated_at: string }>;
}

export async function updatePlatformSetting(key: string, value: unknown) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_platform_setting", {
    p_key: key,
    p_value: value,
  });
  if (error) throw error;
  return { ok: true };
}
