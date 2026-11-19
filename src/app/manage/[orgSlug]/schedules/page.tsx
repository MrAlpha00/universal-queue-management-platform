import { SchedulesManager } from "@/components/manage/schedules-manager";
import { PageHeader } from "@/components/ui/misc";
import { getOrgContext } from "@/services/auth";
import {
  listOrgServices,
  listScheduleExceptions,
  listWorkingHours,
} from "@/services/management";

export const dynamic = "force-dynamic";

export default async function SchedulesPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { org } = await getOrgContext(orgSlug, "MEMBER");
  const [hours, exceptions, services] = await Promise.all([
    listWorkingHours(org.id),
    listScheduleExceptions(org.id),
    listOrgServices(org.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Availability"
        title="Schedules"
        description="Set opening hours, add exceptions and generate bookable slots."
      />
      <SchedulesManager orgSlug={orgSlug} hours={hours} exceptions={exceptions} services={services} />
    </div>
  );
}
