import { createClient } from "@/lib/supabase/server";
import { errors } from "@/lib/errors";
import { getCurrentSession } from "@/services/auth";
import type { BookingResult, Token, VerificationResult } from "@/types/domain";

export async function verifyToken(input: {
  reference: string;
  orgSlug: string;
  branchId?: string | null;
  source?: "CAMERA" | "MANUAL";
}): Promise<VerificationResult> {
  const session = await getCurrentSession();
  if (!session) throw errors.unauthorized("Staff authentication is required to verify tokens");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("verify_qr", {
    p_reference: input.reference.trim(),
    p_org_slug: input.orgSlug,
    p_branch_id: input.branchId ?? null,
    p_source: input.source ?? "CAMERA",
  });
  if (error) {
    if (error.message.includes("Not authorized")) throw errors.forbidden(error.message);
    throw errors.validation(error.message);
  }
  return data as VerificationResult;
}

export async function getTokenForAppointment(appointmentId: string): Promise<Token | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tokens")
    .select("*")
    .eq("appointment_id", appointmentId)
    .maybeSingle();
  if (error) throw error;
  return (data as Token | null) ?? null;
}

export async function reissueQr(appointmentId: string) {
  const session = await getCurrentSession();
  if (!session) throw errors.unauthorized();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reissue_qr", { p_appointment: appointmentId });
  if (!error && data) return data as { qr_reference: string; appointment_id: string };

  const staffResult = await supabase.rpc("reissue_qr_for_staff", { p_appointment: appointmentId });
  if (staffResult.error) {
    throw errors.validation(staffResult.error.message || error?.message || "Unable to reissue QR code");
  }
  return staffResult.data as { qr_reference: string; appointment_id: string };
}

export async function generateQrDataUrl(reference: string) {
  const QRCode = await import("qrcode");
  return QRCode.toDataURL(reference, {
    width: 420,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#0B1022", light: "#FFFFFF" },
  });
}

export function qrReferenceFromBooking(booking: BookingResult) {
  return booking.qr_reference;
}
