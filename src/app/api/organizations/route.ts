import { apiError, apiSuccess } from "@/lib/api";
import { z } from "zod";
import { createOrganization } from "@/services/organizations";

const schema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(60),
  description: z.string().optional(),
  timezone: z.string().min(1).default("UTC"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const org = await createOrganization(body);
    return apiSuccess({ organization: org }, 201);
  } catch (error) {
    return apiError(error);
  }
}
