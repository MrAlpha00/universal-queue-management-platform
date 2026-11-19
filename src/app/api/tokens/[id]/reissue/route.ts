import { apiError, apiSuccess } from "@/lib/api";
import { reissueQr } from "@/services/tokens";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await reissueQr(id);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}
