import { createClient } from "@/lib/supabase/server";
import { errors } from "@/lib/errors";
import { slugify } from "@/lib/utils";
import { getCurrentSession, requirePlatformAdmin, requireSession } from "@/services/auth";
import { logAudit } from "@/services/audit";
import type { Organization, OrganizationStatus, Service, Branch } from "@/types/domain";

export async function listPublicOrganizations(search?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("organizations")
    .select("id, name, slug, description, logo_url, address, timezone, created_at")
    .eq("status", "APPROVED")
    .order("name", { ascending: true });
  // `city` may not exist on every deployment; the select still works with PostgREST.
  if (search?.trim()) {
    const term = search.trim();
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  }
  const { data, error } = await query.limit(60);
  if (error) throw error;
  return (data ?? []) as unknown as Organization[];
}

export async function getOrganizationBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as Organization | null) ?? null;
}

export async function requirePublicOrganization(slug: string) {
  const org = await getOrganizationBySlug(slug);
  if (!org || org.status !== "APPROVED") throw errors.notFound("Organization not found");
  return org;
}

export async function getOrganizationBranches(orgId: string, includeInactive = false) {
  const supabase = await createClient();
  let query = supabase.from("branches").select("*").eq("org_id", orgId);
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query.order("name");
  if (error) throw error;
  return (data ?? []) as Branch[];
}

export async function getOrganizationServices(orgId: string, includeInactive = false) {
  const supabase = await createClient();
  let query = supabase.from("services").select("*").eq("org_id", orgId);
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query.order("name");
  if (error) throw error;
  return (data ?? []) as Service[];
}

export async function getServiceDetail(serviceId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("*, service_fields(*), branches(*)")
    .eq("id", serviceId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw errors.notFound("Service not found");
  return data as unknown as Service & {
    service_fields: Service["service_fields"];
    branches: Branch | null;
  };
}

export async function createOrganization(input: {
  name: string;
  slug: string;
  description?: string;
  timezone: string;
  email?: string;
  phone?: string;
  address?: string;
}) {
  const session = await requireSession();
  const supabase = await createClient();
  const slug = slugify(input.slug || input.name);
  if (!slug) throw errors.validation("A valid organization slug is required");

  const { data, error } = await supabase
    .from("organizations")
    .insert({
      name: input.name.trim(),
      slug,
      description: input.description?.trim() || null,
      timezone: input.timezone || "UTC",
      email: input.email || session.email,
      phone: input.phone || null,
      address: input.address || null,
      owner_id: session.userId,
      status: "PENDING",
    })
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") throw errors.conflict("That URL slug is already taken");
    throw error;
  }
  return data as Organization;
}

export async function updateOrganization(orgId: string, patch: Partial<Organization>) {
  const session = await requireSession();
  const supabase = await createClient();
  const allowed: Record<string, unknown> = {};
  for (const key of [
    "name", "description", "logo_url", "website", "email", "phone",
    "address", "timezone", "settings", "slug",
  ] as const) {
    if (patch[key] !== undefined) allowed[key] = patch[key];
  }
  const { data, error } = await supabase
    .from("organizations")
    .update(allowed)
    .eq("id", orgId)
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") throw errors.conflict("That URL slug is already taken");
    throw error;
  }
  await logAudit(orgId, "ORGANIZATION_UPDATED", "organization", orgId, {
    fields: Object.keys(allowed),
    actor: session.userId,
  });
  return data as Organization;
}

export async function setOrganizationStatus(
  orgId: string,
  status: OrganizationStatus,
  note?: string,
) {
  await requirePlatformAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_organization_status", {
    p_org: orgId,
    p_status: status,
    p_note: note ?? null,
  });
  if (error) throw error;
  return data as { organization_id: string; status: OrganizationStatus };
}

export async function getDashboardOrganization(orgSlug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("organizations").select("*").eq("slug", orgSlug).maybeSingle();
  return (data as Organization | null) ?? null;
}

export async function getPublicOrganizationStats() {
  const supabase = await createClient();
  const [orgs, services, branches] = await Promise.all([
    supabase.from("organizations").select("id", { count: "exact", head: true }).eq("status", "APPROVED"),
    supabase.from("services").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("branches").select("id", { count: "exact", head: true }).eq("is_active", true),
  ]);
  return {
    organizations: orgs.count ?? 0,
    services: services.count ?? 0,
    branches: branches.count ?? 0,
  };
}

export async function getCurrentUserOrganizations() {
  const session = await getCurrentSession();
  if (!session) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("organization_members")
    .select("role, organizations(*)")
    .eq("user_id", session.userId)
    .eq("membership_status", "ACTIVE");
  return ((data ?? []) as unknown as Array<{ role: string; organizations: Organization }>)
    .map((row) => ({ role: row.role, org: row.organizations }))
    .filter((row) => row.org);
}
