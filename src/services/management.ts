import { createClient } from "@/lib/supabase/server";
import type {
  Appointment,
  AuditLog,
  Branch,
  CheckInEvent,
  NotificationEvent,
  OrganizationMember,
  ReminderEvent,
  ScheduleException,
  Service,
  ServiceField,
  WorkingHour,
} from "@/types/domain";

export async function listOrgServices(orgId: string): Promise<Service[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("org_id", orgId)
    .order("name");
  if (error) throw error;
  return (data ?? []) as Service[];
}

export async function listServiceFields(orgId: string): Promise<ServiceField[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("service_fields")
    .select("*")
    .eq("org_id", orgId)
    .order("display_order");
  if (error) throw error;
  return (data ?? []) as ServiceField[];
}

export async function listOrgBranches(orgId: string): Promise<Branch[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("branches")
    .select("*")
    .eq("org_id", orgId)
    .order("name");
  if (error) throw error;
  return (data ?? []) as Branch[];
}

export async function listWorkingHours(orgId: string): Promise<WorkingHour[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("working_hours")
    .select("*")
    .eq("org_id", orgId)
    .order("weekday")
    .order("open_time");
  if (error) throw error;
  return (data ?? []) as WorkingHour[];
}

export async function listScheduleExceptions(orgId: string): Promise<ScheduleException[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("schedule_exceptions")
    .select("*")
    .eq("org_id", orgId)
    .order("exception_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ScheduleException[];
}

export async function listOrgMembers(orgId: string): Promise<OrganizationMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_members")
    .select("*, profile:profiles(*)")
    .eq("org_id", orgId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as unknown as OrganizationMember[];
}

export async function listOrgCustomers(orgId: string): Promise<
  Array<{
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
    visits: number;
    last_visit: string | null;
    completed: number;
  }>
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("customer_id, appointment_date, status, customer:profiles(id, full_name, email, phone, avatar_url)")
    .eq("org_id", orgId)
    .order("appointment_date", { ascending: false })
    .limit(1000);
  if (error) throw error;

  const map = new Map<string, {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
    visits: number;
    last_visit: string | null;
    completed: number;
  }>();

  for (const row of (data ?? []) as unknown as Array<{
    customer_id: string;
    appointment_date: string;
    status: string;
    customer: { id: string; full_name: string | null; email: string | null; phone: string | null; avatar_url: string | null } | null;
  }>) {
    const existing = map.get(row.customer_id);
    const customer = row.customer;
    if (!existing) {
      map.set(row.customer_id, {
        id: row.customer_id,
        full_name: customer?.full_name ?? null,
        email: customer?.email ?? null,
        phone: customer?.phone ?? null,
        avatar_url: customer?.avatar_url ?? null,
        visits: 1,
        last_visit: row.appointment_date,
        completed: row.status === "COMPLETED" ? 1 : 0,
      });
    } else {
      existing.visits += 1;
      if (row.status === "COMPLETED") existing.completed += 1;
      if (!existing.last_visit || row.appointment_date > existing.last_visit) {
        existing.last_visit = row.appointment_date;
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => (b.last_visit ?? "").localeCompare(a.last_visit ?? ""));
}

export async function listNotificationEvents(orgId: string, limit = 100): Promise<NotificationEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notification_events")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as NotificationEvent[];
}

export async function listReminderEvents(orgId: string, limit = 100): Promise<ReminderEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reminder_events")
    .select("*")
    .eq("org_id", orgId)
    .order("scheduled_for", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ReminderEvent[];
}

export async function listAuditLogs(orgId: string, limit = 150): Promise<AuditLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*, actor:profiles(id, full_name, email, avatar_url)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as AuditLog[];
}

export async function listRecentCheckIns(orgId: string, limit = 50): Promise<CheckInEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("check_in_events")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as CheckInEvent[];
}

export type AnalyticsSeries = {
  date: string;
  booked: number;
  completed: number;
  cancelled: number;
};

export async function getOrgAnalytics(orgId: string, days = 14) {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  const sinceDate = since.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("appointments")
    .select("appointment_date, status, service_id, service:services(name)")
    .eq("org_id", orgId)
    .gte("appointment_date", sinceDate)
    .limit(5000);
  if (error) throw error;

  const rows = (data ?? []) as unknown as Array<{
    appointment_date: string;
    status: string;
    service_id: string;
    service: { name: string } | null;
  }>;

  const byDate = new Map<string, AnalyticsSeries>();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    byDate.set(key, { date: key, booked: 0, completed: 0, cancelled: 0 });
  }

  const byService = new Map<string, { name: string; count: number }>();
  const byStatus = new Map<string, number>();

  for (const row of rows) {
    const entry = byDate.get(row.appointment_date);
    if (entry) {
      if (row.status === "COMPLETED") entry.completed += 1;
      else if (["CANCELLED", "EXPIRED", "NO_SHOW"].includes(row.status)) entry.cancelled += 1;
      else entry.booked += 1;
    }
    const serviceName = row.service?.name ?? "Unknown";
    const serviceEntry = byService.get(row.service_id) ?? { name: serviceName, count: 0 };
    serviceEntry.count += 1;
    byService.set(row.service_id, serviceEntry);
    byStatus.set(row.status, (byStatus.get(row.status) ?? 0) + 1);
  }

  return {
    series: Array.from(byDate.values()),
    services: Array.from(byService.values()).sort((a, b) => b.count - a.count).slice(0, 6),
    statuses: Array.from(byStatus.entries()).map(([status, count]) => ({ status, count })),
    total: rows.length,
  };
}

export type QueueAppointment = Appointment;

export async function getQueueAppointments(orgId: string, date: string): Promise<Appointment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(`
      id, org_id, branch_id, service_id, customer_id, appointment_date, start_time, end_time,
      start_at, end_at, timezone, status, responses, notes, source, created_at,
      token:tokens(id, token_number, status),
      service:services(id, name, color),
      branch:branches(id, name),
      customer:profiles(id, full_name, email, avatar_url)
    `)
    .eq("org_id", orgId)
    .eq("appointment_date", date)
    .order("start_time");
  if (error) throw error;
  return (data ?? []) as unknown as Appointment[];
}
