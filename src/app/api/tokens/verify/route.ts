import { apiError, apiSuccess } from "@/lib/api";
import { tokenVerifySchema } from "@/lib/validation";
import { verifyToken } from "@/services/tokens";

export async function POST(request: Request) {
  try {
    const input = tokenVerifySchema.parse(await request.json());
    const result = await verifyToken(input);
    return apiSuccess(result, result.ok ? 200 : 422);
  } catch (error) {
    return apiError(error);
  }
}
