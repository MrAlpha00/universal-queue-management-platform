import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api";
import { verifyToken } from "@/services/tokens";

const schema = z.object({
  reference: z.string().min(4).max(300),
  orgSlug: z.string().min(1),
  branchId: z.string().uuid().optional().nullable(),
  source: z.enum(["CAMERA", "MANUAL"]).default("CAMERA"),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const result = await verifyToken(input);
    return apiSuccess(result, result.ok ? 200 : 422);
  } catch (error) {
    return apiError(error);
  }
}
