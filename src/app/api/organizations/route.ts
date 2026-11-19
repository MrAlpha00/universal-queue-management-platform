import { apiError, apiSuccess } from "@/lib/api";
import { organizationCreateSchema } from "@/lib/validation";
import { createOrganization } from "@/services/organizations";

export async function POST(request: Request) {
  try {
    const body = organizationCreateSchema.parse(await request.json());
    const org = await createOrganization(body);
    return apiSuccess({ organization: org }, 201);
  } catch (error) {
    return apiError(error);
  }
}
