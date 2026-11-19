import { createAdminClient } from "@/lib/supabase/server";
import type { AuditLog } from "@/types/domain";

/**
 * Writes audit events with the service-role client so logging never depends on
 * the caller's RLS permissions. Callers must authorize the action first.
 */
export async function logAudit(
  orgId: string | null,
  action: string,
  entityType: string,
  entityId?: string | null,
  details: Record<string, unknown> = {},
  actorId?: string | null,
) {
  try {
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      org_id: orgId,
      actor_id: actorId ?? null,
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
      details,
    });
  } catch (error) {
    console.error("[TokenFlow] Failed to write audit log", error);
  }
}

export async function listAuditLogs(orgId: string, limit = 100) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("audit_logs")
    .select("*, actor:profiles(id, full_name, email, avatar_url)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as AuditLog[];
}

export async function listPlatformActivity(limit = 100) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("audit_logs")
    .select("*, actor:profiles(id, full_name, email, avatar_url), organizations(id, name, slug)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as AuditLog[];
}
