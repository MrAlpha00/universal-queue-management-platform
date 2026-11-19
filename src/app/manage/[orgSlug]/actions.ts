"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/services/auth";
import { generateScheduleSlots } from "@/services/availability";
import { updateAppointmentStatus } from "@/services/bookings";
import { logAudit } from "@/services/audit";
import { slugify } from "@/lib/utils";
import type { MembershipRole } from "@/config/constants";

async function revalidateOrg(orgSlug: string) {
  revalidatePath(`/manage/${orgSlug}`, "layout");
}

const orgProfileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional().default(""),
  website: z.string().trim().url().optional().or(z.literal("")).default(""),
  email: z.string().trim().email().optional().or(z.literal("")).default(""),
  phone: z.string().trim().max(40).optional().default(""),
  address: z.string().trim().max(300).optional().default(""),
  timezone: z.string().trim().min(1).max(100),
  logoUrl: z.string().trim().url().optional().or(z.literal("")).default(""),
});

export async function updateOrgProfile(orgSlug: string, input: z.input<typeof orgProfileSchema>) {
  const { org } = await getOrgContext(orgSlug, "ADMIN");
  const values = orgProfileSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      name: values.name,
      description: values.description || null,
      website: values.website || null,
      email: values.email || null,
      phone: values.phone || null,
      address: values.address || null,
      timezone: values.timezone,
      logo_url: values.logoUrl || null,
    })
    .eq("id", org.id);
  if (error) throw new Error(error.message);
  await logAudit(org.id, "ORGANIZATION_UPDATED", "organization", org.id, { fields: Object.keys(values) });
  await revalidateOrg(orgSlug);
  return { ok: true };
}

const settingsSchema = z.object({
  bookingHorizonDays: z.coerce.number().int().min(1).max(365),
  tokenPrefix: z.string().trim().min(1).max(6),
  checkinEarlyMinutes: z.coerce.number().int().min(0).max(240),
  checkinGraceMinutes: z.coerce.number().int().min(0).max(240),
  reminderOffsets: z.string().trim(),
});

export async function updateOrgSettings(orgSlug: string, input: z.input<typeof settingsSchema>) {
  const { org } = await getOrgContext(orgSlug, "ADMIN");
  const values = settingsSchema.parse(input);
  const offsets = values.reminderOffsets
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0)
    .slice(0, 6);
  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      settings: {
        ...(org.settings ?? {}),
        booking_horizon_days: values.bookingHorizonDays,
        token_prefix: values.tokenPrefix.toUpperCase(),
        checkin_early_minutes: values.checkinEarlyMinutes,
        checkin_grace_minutes: values.checkinGraceMinutes,
        reminder_offsets_minutes: offsets.length ? offsets : [60],
        timezone: org.timezone,
      },
    })
    .eq("id", org.id);
  if (error) throw new Error(error.message);
  await logAudit(org.id, "ORGANIZATION_SETTINGS_UPDATED", "organization", org.id, { fields: Object.keys(values) });
  await revalidateOrg(orgSlug);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Branches
// ---------------------------------------------------------------------------
const branchSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().max(120).optional().default(""),
  address: z.string().trim().max(300).optional().default(""),
  city: z.string().trim().max(120).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  email: z.string().trim().email().optional().or(z.literal("")).default(""),
  timezone: z.string().trim().max(100).optional().default(""),
});

export async function saveBranch(orgSlug: string, branchId: string | null, input: z.input<typeof branchSchema>) {
  const { org } = await getOrgContext(orgSlug, "MANAGER");
  const values = branchSchema.parse(input);
  const supabase = await createClient();
  const payload = {
    org_id: org.id,
    name: values.name,
    slug: slugify(values.slug || values.name),
    address: values.address || null,
    city: values.city || null,
    phone: values.phone || null,
    email: values.email || null,
    timezone: values.timezone || null,
  };
  const result = branchId
    ? await supabase.from("branches").update(payload).eq("id", branchId).eq("org_id", org.id)
    : await supabase.from("branches").insert(payload);
  if (result.error) {
    if (result.error.code === "23505") throw new Error("That branch slug is already in use");
    throw new Error(result.error.message);
  }
  await logAudit(org.id, branchId ? "BRANCH_UPDATED" : "BRANCH_CREATED", "branch", branchId ?? values.name);
  await revalidateOrg(orgSlug);
  return { ok: true };
}

export async function toggleBranch(orgSlug: string, branchId: string, isActive: boolean) {
  const { org } = await getOrgContext(orgSlug, "MANAGER");
  const supabase = await createClient();
  const { error } = await supabase
    .from("branches")
    .update({ is_active: isActive })
    .eq("id", branchId)
    .eq("org_id", org.id);
  if (error) throw new Error(error.message);
  await revalidateOrg(orgSlug);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Services & fields
// ---------------------------------------------------------------------------
const serviceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().max(120).optional().default(""),
  description: z.string().trim().max(2000).optional().default(""),
  branchId: z.string().uuid().optional().or(z.literal("")).default(""),
  durationMinutes: z.coerce.number().int().min(1).max(480),
  bufferMinutes: z.coerce.number().int().min(0).max(240),
  capacity: z.coerce.number().int().min(1).max(1000),
  bookingHorizonDays: z.coerce.number().int().min(1).max(365).optional(),
  allowCancellation: z.boolean().default(true),
  cancellationHours: z.coerce.number().int().min(0).max(720),
  color: z.string().trim().min(1).max(40),
  isActive: z.boolean().default(true),
});

export async function saveService(orgSlug: string, serviceId: string | null, input: z.input<typeof serviceSchema>) {
  const { org } = await getOrgContext(orgSlug, "MANAGER");
  const values = serviceSchema.parse(input);
  const supabase = await createClient();
  const payload = {
    org_id: org.id,
    name: values.name,
    slug: slugify(values.slug || values.name),
    description: values.description || null,
    branch_id: values.branchId || null,
    duration_minutes: values.durationMinutes,
    buffer_minutes: values.bufferMinutes,
    capacity: values.capacity,
    booking_horizon_days: values.bookingHorizonDays ?? null,
    allow_cancellation: values.allowCancellation,
    cancellation_hours: values.cancellationHours,
    color: values.color,
    is_active: values.isActive,
  };
  const result = serviceId
    ? await supabase.from("services").update(payload).eq("id", serviceId).eq("org_id", org.id)
    : await supabase.from("services").insert(payload);
  if (result.error) {
    if (result.error.code === "23505") throw new Error("That service slug is already in use");
    throw new Error(result.error.message);
  }
  await logAudit(org.id, serviceId ? "SERVICE_UPDATED" : "SERVICE_CREATED", "service", serviceId ?? values.name);
  await revalidateOrg(orgSlug);
  return { ok: true };
}

export async function toggleService(orgSlug: string, serviceId: string, isActive: boolean) {
  const { org } = await getOrgContext(orgSlug, "MANAGER");
  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({ is_active: isActive })
    .eq("id", serviceId)
    .eq("org_id", org.id);
  if (error) throw new Error(error.message);
  await revalidateOrg(orgSlug);
  return { ok: true };
}

const fieldSchema = z.object({
  serviceId: z.string().uuid(),
  name: z.string().trim().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Use letters, numbers and underscores"),
  label: z.string().trim().min(1).max(120),
  fieldType: z.enum(["TEXT", "EMAIL", "PHONE", "NUMBER", "TEXTAREA", "SELECT", "RADIO", "CHECKBOX", "DATE"]),
  placeholder: z.string().trim().max(160).optional().default(""),
  helpText: z.string().trim().max(300).optional().default(""),
  isRequired: z.boolean().default(false),
  options: z.string().trim().optional().default(""),
  displayOrder: z.coerce.number().int().min(0).max(100).default(0),
});

export async function addServiceField(orgSlug: string, input: z.input<typeof fieldSchema>) {
  const { org } = await getOrgContext(orgSlug, "MANAGER");
  const values = fieldSchema.parse(input);
  const supabase = await createClient();
  const options = values.options
    ? values.options.split("\n").map((line) => line.trim()).filter(Boolean)
    : [];
  const { error } = await supabase.from("service_fields").insert({
    org_id: org.id,
    service_id: values.serviceId,
    name: values.name,
    label: values.label,
    field_type: values.fieldType,
    placeholder: values.placeholder || null,
    help_text: values.helpText || null,
    is_required: values.isRequired,
    options,
    display_order: values.displayOrder,
  });
  if (error) {
    if (error.code === "23505") throw new Error("A field with that name already exists for this service");
    throw new Error(error.message);
  }
  await logAudit(org.id, "SERVICE_FIELD_CREATED", "service", values.serviceId);
  await revalidateOrg(orgSlug);
  return { ok: true };
}

export async function deleteServiceField(orgSlug: string, fieldId: string) {
  const { org } = await getOrgContext(orgSlug, "MANAGER");
  const supabase = await createClient();
  const { error } = await supabase
    .from("service_fields")
    .delete()
    .eq("id", fieldId)
    .eq("org_id", org.id);
  if (error) throw new Error(error.message);
  await revalidateOrg(orgSlug);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Schedules
// ---------------------------------------------------------------------------
const workingHourSchema = z.object({
  weekday: z.coerce.number().int().min(1).max(7),
  openTime: z.string().regex(/^\d{2}:\d{2}$/),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/),
  breakStart: z.string().trim().optional().default(""),
  breakEnd: z.string().trim().optional().default(""),
  serviceId: z.string().uuid().optional().or(z.literal("")).default(""),
  branchId: z.string().uuid().optional().or(z.literal("")).default(""),
});

export async function saveWorkingHours(orgSlug: string, rows: z.input<typeof workingHourSchema>[]) {
  const { org } = await getOrgContext(orgSlug, "MANAGER");
  const supabase = await createClient();
  const parsed = rows.map((row) => workingHourSchema.parse(row));

  await supabase.from("working_hours").delete().eq("org_id", org.id);

  if (parsed.length) {
    const { error } = await supabase.from("working_hours").insert(
      parsed.map((row) => ({
        org_id: org.id,
        weekday: row.weekday,
        open_time: row.openTime,
        close_time: row.closeTime,
        break_start: row.breakStart || null,
        break_end: row.breakEnd || null,
        service_id: row.serviceId || null,
        branch_id: row.branchId || null,
      })),
    );
    if (error) throw new Error(error.message);
  }
  await logAudit(org.id, "WORKING_HOURS_UPDATED", "organization", org.id, { days: parsed.length });
  await revalidateOrg(orgSlug);
  return { ok: true };
}

const exceptionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(["CLOSED", "HOLIDAY", "SPECIAL"]),
  openTime: z.string().trim().optional().default(""),
  closeTime: z.string().trim().optional().default(""),
  reason: z.string().trim().max(200).optional().default(""),
});

export async function addScheduleException(orgSlug: string, input: z.input<typeof exceptionSchema>) {
  const { org } = await getOrgContext(orgSlug, "MANAGER");
  const values = exceptionSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from("schedule_exceptions").insert({
    org_id: org.id,
    exception_date: values.date,
    exception_type: values.type,
    open_time: values.type === "SPECIAL" ? values.openTime || null : null,
    close_time: values.type === "SPECIAL" ? values.closeTime || null : null,
    reason: values.reason || null,
  });
  if (error) throw new Error(error.message);
  await revalidateOrg(orgSlug);
  return { ok: true };
}

export async function deleteScheduleException(orgSlug: string, exceptionId: string) {
  const { org } = await getOrgContext(orgSlug, "MANAGER");
  const supabase = await createClient();
  const { error } = await supabase
    .from("schedule_exceptions")
    .delete()
    .eq("id", exceptionId)
    .eq("org_id", org.id);
  if (error) throw new Error(error.message);
  await revalidateOrg(orgSlug);
  return { ok: true };
}

export async function generateSlots(
  orgSlug: string,
  serviceId: string,
  from: string,
  to: string,
) {
  const { org } = await getOrgContext(orgSlug, "MANAGER");
  const count = await generateScheduleSlots(org.id, serviceId, from, to);
  await revalidateOrg(orgSlug);
  return { count };
}

// ---------------------------------------------------------------------------
// Appointments
// ---------------------------------------------------------------------------
export async function setAppointmentStatus(orgSlug: string, appointmentId: string, status: string) {
  const { org } = await getOrgContext(orgSlug, "MEMBER");
  const supabase = await createClient();
  const { data: appointment } = await supabase
    .from("appointments")
    .select("org_id")
    .eq("id", appointmentId)
    .maybeSingle();
  if (!appointment || (appointment as { org_id: string }).org_id !== org.id) {
    throw new Error("Appointment not found");
  }
  await updateAppointmentStatus(appointmentId, status);
  await logAudit(org.id, "APPOINTMENT_STATUS_CHANGED", "appointment", appointmentId, { status });
  await revalidateOrg(orgSlug);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------
export async function addMember(orgSlug: string, input: { email: string; role: MembershipRole }) {
  const { org } = await getOrgContext(orgSlug, "ADMIN");
  const email = input.email.trim().toLowerCase();
  if (!email) throw new Error("Email is required");
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("email", email)
    .maybeSingle();
  if (profileError) throw new Error(profileError.message);
  if (!profile) {
    throw new Error("No TokenFlow account matches that email. Ask them to sign up first.");
  }

  const { error } = await supabase.from("organization_members").insert({
    org_id: org.id,
    user_id: (profile as { id: string }).id,
    role: input.role,
    membership_status: "ACTIVE",
  });
  if (error) {
    if (error.code === "23505") throw new Error("That person is already a member");
    throw new Error(error.message);
  }
  await logAudit(org.id, "MEMBER_ADDED", "member", (profile as { id: string }).id, { role: input.role });
  await revalidateOrg(orgSlug);
  return { ok: true };
}

export async function updateMemberRole(orgSlug: string, memberId: string, role: MembershipRole) {
  const { org } = await getOrgContext(orgSlug, "ADMIN");
  const supabase = await createClient();
  const { error } = await supabase
    .from("organization_members")
    .update({ role })
    .eq("id", memberId)
    .eq("org_id", org.id);
  if (error) throw new Error(error.message);
  await logAudit(org.id, "MEMBER_ROLE_CHANGED", "member", memberId, { role });
  await revalidateOrg(orgSlug);
  return { ok: true };
}

export async function removeMember(orgSlug: string, memberId: string) {
  const { org } = await getOrgContext(orgSlug, "ADMIN");
  const supabase = await createClient();
  const { data: member } = await supabase
    .from("organization_members")
    .select("user_id, role")
    .eq("id", memberId)
    .eq("org_id", org.id)
    .maybeSingle();
  if (!member) throw new Error("Member not found");
  if ((member as { role: MembershipRole }).role === "OWNER") {
    throw new Error("The organization owner cannot be removed");
  }
  const { error } = await supabase.from("organization_members").delete().eq("id", memberId).eq("org_id", org.id);
  if (error) throw new Error(error.message);
  await logAudit(org.id, "MEMBER_REMOVED", "member", memberId);
  await revalidateOrg(orgSlug);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Maintenance
// ---------------------------------------------------------------------------
export async function expireStaleTokens(orgSlug: string) {
  const { org } = await getOrgContext(orgSlug, "MANAGER");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_expire_tokens", { p_org: org.id });
  if (error) throw new Error(error.message);
  await revalidateOrg(orgSlug);
  return { count: Number(data ?? 0) };
}
