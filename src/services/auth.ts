import { cache } from "react";
import { hasSupabaseConfig } from "@/lib/env";
import { errors } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { MembershipRole } from "@/config/constants";
import type { Organization, OrganizationMember, Profile } from "@/types/domain";

export type Session = {
  userId: string;
  email: string | null;
  profile: Profile;
};

export const getCurrentSession = cache(async (): Promise<Session | null> => {
  if (!hasSupabaseConfig()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const profile: Profile = (data as Profile | null) ?? {
    id: user.id,
    full_name: (user.user_metadata?.full_name as string) ?? null,
    email: user.email ?? null,
    phone: null,
    avatar_url: null,
    timezone: "UTC",
    locale: "en",
    platform_role: "USER",
    created_at: user.created_at,
    updated_at: user.created_at,
  };

  return { userId: user.id, email: user.email ?? null, profile };
});

export async function requireSession(): Promise<Session> {
  const session = await getCurrentSession();
  if (!session) throw errors.unauthorized();
  return session;
}

export async function isPlatformAdmin() {
  const session = await getCurrentSession();
  return session?.profile.platform_role === "PLATFORM_ADMIN";
}

export async function requirePlatformAdmin(): Promise<Session> {
  const session = await requireSession();
  if (session.profile.platform_role !== "PLATFORM_ADMIN") {
    throw errors.forbidden("Platform administrator access is required");
  }
  return session;
}

export type OrgContext = {
  org: Organization;
  membership: OrganizationMember | null;
  role: MembershipRole | "PLATFORM_ADMIN";
  session: Session;
};

const ADMIN_ROLES: MembershipRole[] = ["OWNER", "ADMIN"];
const MANAGER_ROLES: MembershipRole[] = ["OWNER", "ADMIN", "MANAGER"];
const ALL_ROLES: MembershipRole[] = ["OWNER", "ADMIN", "MANAGER", "STAFF"];

export async function getOrgContext(
  orgSlug: string,
  minimum: "MEMBER" | "MANAGER" | "ADMIN" = "MEMBER",
): Promise<OrgContext> {
  const session = await requireSession();
  const supabase = await createClient();

  const { data: orgData, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (error || !orgData) throw errors.notFound("Organization not found");
  const org = orgData as Organization;

  const platformAdmin = session.profile.platform_role === "PLATFORM_ADMIN";
  const { data: memberData } = await supabase
    .from("organization_members")
    .select("*")
    .eq("org_id", org.id)
    .eq("user_id", session.userId)
    .maybeSingle();
  const membership = (memberData as OrganizationMember | null) ?? null;

  if (!platformAdmin) {
    if (!membership || membership.membership_status !== "ACTIVE") {
      throw errors.forbidden("You are not a member of this organization");
    }
    const allowed =
      minimum === "ADMIN"
        ? ADMIN_ROLES.includes(membership.role)
        : minimum === "MANAGER"
          ? MANAGER_ROLES.includes(membership.role)
          : ALL_ROLES.includes(membership.role);
    if (!allowed) throw errors.forbidden("Your role does not allow this action");
  }

  return {
    org,
    membership,
    role: platformAdmin ? "PLATFORM_ADMIN" : membership!.role,
    session,
  };
}

export async function listUserOrganizations() {
  const session = await getCurrentSession();
  if (!session) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("organization_members")
    .select("role, branch_id, organizations(*)")
    .eq("user_id", session.userId)
    .eq("membership_status", "ACTIVE");
  return (data ?? []) as unknown as Array<{
    role: MembershipRole;
    branch_id: string | null;
    organizations: Organization;
  }>;
}

export async function canManageOrg(orgId: string) {
  const session = await getCurrentSession();
  if (!session) return false;
  if (session.profile.platform_role === "PLATFORM_ADMIN") return true;
  const supabase = await createClient();
  const { data } = await supabase
    .from("organization_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", session.userId)
    .eq("membership_status", "ACTIVE")
    .maybeSingle();
  return Boolean(data && MANAGER_ROLES.includes((data as { role: MembershipRole }).role));
}
