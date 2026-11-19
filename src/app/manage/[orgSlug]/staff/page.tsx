import { StaffManager } from "@/components/manage/staff-manager";
import { PageHeader } from "@/components/ui/misc";
import { getOrgContext } from "@/services/auth";
import { listOrgMembers } from "@/services/management";

export const dynamic = "force-dynamic";

export default async function StaffPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const context = await getOrgContext(orgSlug, "MEMBER");
  const members = await listOrgMembers(context.org.id);
  const canManage = context.role === "OWNER" || context.role === "ADMIN" || context.role === "PLATFORM_ADMIN";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Team"
        title="Staff & permissions"
        description="Control who can manage bookings, services and organization settings."
      />
      <StaffManager
        orgSlug={orgSlug}
        members={members}
        currentUserId={context.session.userId}
        canManage={canManage}
      />
    </div>
  );
}
