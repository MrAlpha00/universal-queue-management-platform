"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { toAppError } from "@/lib/errors";
import { organizationCreateSchema } from "@/lib/validation";
import { createClient } from "@/lib/supabase/server";
import { createOrganization } from "@/services/organizations";
import { requireSession } from "@/services/auth";

const profileSchema = z.object({
  fullName: z.string().trim().max(120).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  avatarUrl: z.string().trim().url().optional().or(z.literal("")).default(""),
  timezone: z.string().trim().min(1).max(100),
  locale: z.string().trim().min(2).max(10),
});

export async function updateProfile(input: z.input<typeof profileSchema>) {
  const session = await requireSession();
  const values = profileSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: values.fullName || null,
      phone: values.phone || null,
      avatar_url: values.avatarUrl || null,
      timezone: values.timezone,
      locale: values.locale,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.userId);
  if (error) throw new Error(error.message);
  revalidatePath("/profile");
  revalidatePath("/settings");
  return { ok: true };
}

export async function createOrganizationAction(input: z.input<typeof organizationCreateSchema>) {
  try {
    const values = organizationCreateSchema.parse(input);
    const org = await createOrganization(values);
    revalidatePath("/organizations");
    revalidatePath("/dashboard");
    return { ok: true as const, slug: org.slug, status: org.status };
  } catch (error) {
    const appError = toAppError(error);
    return { ok: false as const, error: appError.message };
  }
}

export async function changePassword(input: { currentPassword: string; newPassword: string }) {
  const session = await requireSession();
  if (input.newPassword.length < 8) throw new Error("New password must be at least 8 characters");
  const supabase = await createClient();

  // Re-authenticate to make sure the current password is correct.
  if (session.email) {
    const { error } = await supabase.auth.signInWithPassword({
      email: session.email,
      password: input.currentPassword,
    });
    if (error) throw new Error("Your current password is incorrect");
  }

  const { error } = await supabase.auth.updateUser({ password: input.newPassword });
  if (error) throw new Error(error.message);
  return { ok: true };
}
