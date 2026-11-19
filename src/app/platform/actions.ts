"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/services/auth";
import { updatePlatformSetting } from "@/services/platform";
import type { OrganizationStatus } from "@/config/constants";

const statusSchema = z.enum(["PENDING", "APPROVED", "SUSPENDED", "REJECTED"]);

export async function setOrganizationStatus(orgId: string, status: OrganizationStatus, note?: string) {
  await requirePlatformAdmin();
  const parsed = statusSchema.parse(status);
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_organization_status", {
    p_org: orgId,
    p_status: parsed,
    p_note: note ?? null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/platform", "layout");
  return { ok: true };
}

export async function setUserPlatformRole(userId: string, role: "USER" | "PLATFORM_ADMIN") {
  await requirePlatformAdmin();
  if (!["USER", "PLATFORM_ADMIN"].includes(role)) throw new Error("Invalid role");
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_user_platform_role", {
    p_user: userId,
    p_role: role,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/platform", "layout");
  return { ok: true };
}

export async function savePlatformSetting(key: string, value: unknown) {
  await requirePlatformAdmin();
  await updatePlatformSetting(key, value);
  revalidatePath("/platform/settings");
  return { ok: true };
}
