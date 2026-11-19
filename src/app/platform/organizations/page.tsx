import { Building2, ShieldCheck, ShieldX, Clock3 } from "lucide-react";
import { PlatformOrganizationsTable } from "@/components/platform/organizations-table";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { listPlatformOrganizations } from "@/services/platform";

export const dynamic = "force-dynamic";

export default async function PlatformOrganizationsPage() {
  const organizations = await listPlatformOrganizations();

  const counts = {
    pending: organizations.filter((org) => org.status === "PENDING").length,
    approved: organizations.filter((org) => org.status === "APPROVED").length,
    suspended: organizations.filter((org) => org.status === "SUSPENDED").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Governance"
        title="Organizations"
        description="Review registrations, approve trusted teams and suspend accounts that break policy."
      />

      <Card className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
        {[
          { label: "Total", value: organizations.length, icon: Building2 },
          { label: "Awaiting review", value: counts.pending, icon: Clock3 },
          { label: "Approved", value: counts.approved, icon: ShieldCheck },
          { label: "Suspended", value: counts.suspended, icon: ShieldX },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-violet-300">
              <item.icon className="size-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle">{item.label}</p>
              <p className="text-lg font-bold tabular-nums">{item.value}</p>
            </div>
          </div>
        ))}
      </Card>

      <PlatformOrganizationsTable organizations={organizations} />
    </div>
  );
}
