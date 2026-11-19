import { apiError, apiSuccess } from "@/lib/api";
import { availabilityQuerySchema } from "@/lib/validation";
import { getAvailableSlots } from "@/services/availability";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await params;
    const { searchParams } = new URL(request.url);
    const input = availabilityQuerySchema.parse({
      serviceId: searchParams.get("serviceId"),
      branchId: searchParams.get("branchId"),
      date: searchParams.get("date"),
    });
    const slots = await getAvailableSlots(input.serviceId, input.branchId, input.date);
    return apiSuccess({ slots });
  } catch (error) {
    return apiError(error);
  }
}
