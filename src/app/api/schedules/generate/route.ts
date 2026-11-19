import { apiError, apiSuccess } from "@/lib/api";
import { scheduleGenerateSchema } from "@/lib/validation";
import { getOrgContext } from "@/services/auth";
import { generateScheduleSlots } from "@/services/availability";

export async function POST(request: Request) {
  try {
    const body = scheduleGenerateSchema.parse(await request.json());
    const context = await getOrgContext(body.orgSlug, "MANAGER");
    const count = await generateScheduleSlots(context.org.id, body.serviceId, body.from, body.to);
    return apiSuccess({ generated: count });
  } catch (error) {
    return apiError(error);
  }
}
