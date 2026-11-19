import { createClient } from "@/lib/supabase/server";
import { errors } from "@/lib/errors";
import { requireSession } from "@/services/auth";
import type {
  Appointment,
  BookingResult,
  CheckInEvent,
  Organization,
} from "@/types/domain";

export async function createBooking(input: {
  serviceId: string;
  branchId: string;
  date: string;
  startTime: string;
  responses: Record<string, unknown>;
}): Promise<BookingResult> {
  const session = await requireSession();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_booking", {
    p_service: input.serviceId,
    p_branch: input.branchId,
    p_slot_date: input.date,
    p_start_time: input.startTime,
    p_responses: input.responses,
  });
  if (error) {
    if (error.message.includes("no longer available")) throw errors.slotUnavailable(error.message);
    if (error.message.includes("Missing required field")) throw errors.validation(error.message);
    if (error.message.includes("already have a booking")) throw errors.conflict(error.message);
    throw errors.validation(error.message);
  }
  void session;
  return data as BookingResult;
}

export async function cancelBooking(appointmentId: string, reason?: string) {
  await requireSession();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cancel_booking", {
    p_appointment: appointmentId,
    p_reason: reason ?? null,
  });
  if (error) throw error;
  return data as {
    appointment_id: string;
    org_id: string;
    customer_id: string;
    start_at: string;
    status: string;
  };
}

export async function rescheduleBooking(input: {
  appointmentId: string;
  serviceId: string;
  branchId: string;
  date: string;
  startTime: string;
  responses: Record<string, unknown>;
}): Promise<BookingResult> {
  await requireSession();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reschedule_booking", {
    p_appointment: input.appointmentId,
    p_service: input.serviceId,
    p_branch: input.branchId,
    p_slot_date: input.date,
    p_start_time: input.startTime,
    p_responses: input.responses,
  });
  if (error) {
    if (error.message.includes("no longer available")) throw errors.slotUnavailable(error.message);
    throw errors.validation(error.message);
  }
  return data as BookingResult;
}

export async function updateAppointmentStatus(appointmentId: string, status: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("update_appointment_status", {
    p_appointment: appointmentId,
    p_status: status,
  });
  if (error) throw errors.validation(error.message);
  return data;
}

const APPOINTMENT_SELECT = `
  id, org_id, branch_id, service_id, customer_id, slot_id,
  appointment_date, start_time, end_time, start_at, end_at, timezone,
  status, responses, notes, source, created_at, updated_at,
  token:tokens(id, token_number, status, issued_at),
  service:services(id, name, slug, duration_minutes, color),
  branch:branches(id, name, slug),
  organization:organizations(id, name, slug, logo_url, timezone, settings),
  customer:profiles(id, full_name, email, avatar_url, phone)
`;

export async function listCustomerAppointments(status?: string): Promise<Appointment[]> {
  const session = await requireSession();
  const supabase = await createClient();
  let query = supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .eq("customer_id", session.userId)
    .order("start_at", { ascending: false });
  if (status && status !== "ALL") query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Appointment[];
}

export async function getNextCustomerAppointment(): Promise<Appointment | null> {
  const session = await requireSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .eq("customer_id", session.userId)
    .in("status", ["BOOKED", "CHECKED_IN", "IN_PROGRESS"])
    .gte("start_at", new Date().toISOString())
    .order("start_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as Appointment | null) ?? null;
}

export async function getAppointmentById(id: string): Promise<Appointment | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Appointment | null) ?? null;
}

export async function requireAppointmentForCustomer(id: string) {
  const session = await requireSession();
  const appointment = await getAppointmentById(id);
  if (!appointment) throw errors.notFound("Appointment not found");
  if (appointment.customer_id !== session.userId && session.profile.platform_role !== "PLATFORM_ADMIN") {
    throw errors.forbidden();
  }
  return appointment;
}

export async function listOrgAppointments(
  orgId: string,
  filters: { status?: string; date?: string; serviceId?: string; limit?: number } = {},
): Promise<Appointment[]> {
  const supabase = await createClient();
  let query = supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .eq("org_id", orgId)
    .order("appointment_date", { ascending: false })
    .order("start_time", { ascending: false })
    .limit(filters.limit ?? 200);
  if (filters.status && filters.status !== "ALL") query = query.eq("status", filters.status);
  if (filters.date) query = query.eq("appointment_date", filters.date);
  if (filters.serviceId && filters.serviceId !== "ALL") query = query.eq("service_id", filters.serviceId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Appointment[];
}

export async function listTodayAppointments(orgId: string, timezone: string): Promise<Appointment[]> {
  const { format } = await import("date-fns");
  const { toZonedTime } = await import("date-fns-tz");
  const today = format(toZonedTime(new Date(), timezone), "yyyy-MM-dd");
  return listOrgAppointments(orgId, { date: today, limit: 500 });
}

export async function listCustomerHistory(orgId: string, limit = 200): Promise<Appointment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as Appointment[];
}

export async function listCheckInEvents(orgId: string, limit = 200): Promise<CheckInEvent[]> {
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

export async function getOrgByAppointment(appointmentId: string): Promise<Organization | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .select("organization:organizations(*)")
    .eq("id", appointmentId)
    .maybeSingle();
  return ((data as unknown as { organization: Organization | null } | null)?.organization) ?? null;
}
