import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api";
import { getAvailableSlots } from "@/services/availability";

const schema = z.object({
  serviceId: z.string().uuid(),
  branchId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await params;
    const { searchParams } = new URL(request.url);
    const input = schema.parse({
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
