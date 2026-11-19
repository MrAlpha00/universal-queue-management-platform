import { ServicesManager } from "@/components/manage/services-manager";
import { PageHeader } from "@/components/ui/misc";
import { getOrgContext } from "@/services/auth";
import { listOrgBranches, listOrgServices, listServiceFields } from "@/services/management";

export const dynamic = "force-dynamic";

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { org } = await getOrgContext(orgSlug, "MEMBER");
  const [services, fields, branches] = await Promise.all([
    listOrgServices(org.id),
    listServiceFields(org.id),
    listOrgBranches(org.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog"
        title="Services"
        description="Define what customers can book, how long it takes and what information you collect."
      />
      <ServicesManager orgSlug={orgSlug} services={services} fields={fields} branches={branches} />
    </div>
  );
}
