import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api";
import { getOrgContext } from "@/services/auth";
import { generateScheduleSlots } from "@/services/availability";

const schema = z.object({
  orgSlug: z.string().min(1),
  serviceId: z.string().uuid(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const context = await getOrgContext(body.orgSlug, "MANAGER");
    const count = await generateScheduleSlots(context.org.id, body.serviceId, body.from, body.to);
    return apiSuccess({ generated: count });
  } catch (error) {
    return apiError(error);
  }
}
