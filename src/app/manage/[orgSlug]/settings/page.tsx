import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { OrgSettingsForm } from "@/components/manage/org-settings-form";
import { getOrgContext } from "@/services/auth";

export const dynamic = "force-dynamic";

export default async function ManageSettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const context = await getOrgContext(orgSlug, "MEMBER");
  const canManage = context.role === "OWNER" || context.role === "ADMIN" || context.role === "PLATFORM_ADMIN";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuration"
        title="Organization settings"
        description="Public profile, booking rules, reminders and maintenance."
        actions={<Badge tone={context.org.status === "APPROVED" ? "teal" : "amber"}>{context.org.status.toLowerCase()}</Badge>}
      />

      {context.org.status === "PENDING" && (
        <Card className="border-amber-400/25 bg-amber-500/[0.06] p-5">
          <p className="text-sm font-semibold text-amber-100">Your organization is awaiting approval</p>
          <p className="mt-1 text-xs text-amber-200/80">
            You can configure services and schedules now. Public discovery and booking unlock automatically once a platform administrator approves your organization.
          </p>
        </Card>
      )}

      <OrgSettingsForm orgSlug={orgSlug} org={context.org} canManage={canManage} />
    </div>
  );
}
