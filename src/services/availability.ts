import { format, addDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { DEFAULT_BOOKING_HORIZON_DAYS } from "@/config/constants";
import { errors } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationBySlug, getOrganizationBranches, getOrganizationServices } from "@/services/organizations";
import type { AvailabilitySlot, Branch, Service } from "@/types/domain";

export type BookingDay = {
  date: string;
  weekday: string;
  day: string;
  month: string;
  label: string;
};

export function getBookingDays(timezone: string, horizon = DEFAULT_BOOKING_HORIZON_DAYS): BookingDay[] {
  const zonedNow = toZonedTime(new Date(), timezone);
  return Array.from({ length: horizon }, (_, index) => {
    const day = addDays(zonedNow, index);
    return {
      date: format(day, "yyyy-MM-dd"),
      weekday: format(day, "EEE"),
      day: format(day, "dd"),
      month: format(day, "MMM"),
      label: index === 0 ? "Today" : index === 1 ? "Tomorrow" : format(day, "EEEE"),
    };
  });
}

export async function getBookingContext(slug: string) {
  const org = await getOrganizationBySlug(slug);
  if (!org || org.status !== "APPROVED") throw errors.notFound("Organization not found");
  const [branches, services] = await Promise.all([
    getOrganizationBranches(org.id),
    getOrganizationServices(org.id),
  ]);
  if (!branches.length || !services.length) {
    throw errors.notFound("This organization has not published any bookable services yet");
  }
  return {
    org,
    branches,
    services,
    days: getBookingDays(
      org.timezone,
      Number(org.settings?.booking_horizon_days ?? DEFAULT_BOOKING_HORIZON_DAYS),
    ),
  };
}

export async function getAvailableSlots(
  serviceId: string,
  branchId: string,
  date: string,
): Promise<Pick<AvailabilitySlot, "id" | "start_time" | "end_time" | "capacity" | "booked_count">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_available_slots", {
    p_service: serviceId,
    p_branch: branchId,
    p_date: date,
  });
  if (error) throw error;
  return (data ?? []) as Pick<AvailabilitySlot, "id" | "start_time" | "end_time" | "capacity" | "booked_count">[];
}

export async function getScheduleData(orgId: string) {
  const supabase = await createClient();
  const [hours, exceptions, slots] = await Promise.all([
    supabase.from("working_hours").select("*").eq("org_id", orgId).order("weekday"),
    supabase.from("schedule_exceptions").select("*").eq("org_id", orgId).order("exception_date"),
    supabase.from("availability_slots").select("*").eq("org_id", orgId).order("slot_date").limit(500),
  ]);
  if (hours.error) throw hours.error;
  if (exceptions.error) throw exceptions.error;
  if (slots.error) throw slots.error;
  return {
    hours: hours.data ?? [],
    exceptions: exceptions.data ?? [],
    slots: slots.data ?? [],
  };
}

export async function generateScheduleSlots(
  orgId: string,
  serviceId: string,
  from: string,
  to: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_generate_slots", {
    p_service: serviceId,
    p_start_date: from,
    p_end_date: to,
  });
  if (error) throw error;
  return Number(data ?? 0);
}

export function findBranch(branches: Branch[], id: string | null) {
  return branches.find((branch) => branch.id === id) ?? branches[0] ?? null;
}

export function findService(services: Service[], id: string | null) {
  return services.find((service) => service.id === id) ?? services[0] ?? null;
}
