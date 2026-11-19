import { BranchesManager } from "@/components/manage/branches-manager";
import { PageHeader } from "@/components/ui/misc";
import { getOrgContext } from "@/services/auth";
import { listOrgBranches } from "@/services/management";

export const dynamic = "force-dynamic";

export default async function BranchesPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { org } = await getOrgContext(orgSlug, "MEMBER");
  const branches = await listOrgBranches(org.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Locations"
        title="Branches"
        description="Manage the physical or virtual locations customers can book."
      />
      <BranchesManager orgSlug={orgSlug} branches={branches} />
    </div>
  );
}
