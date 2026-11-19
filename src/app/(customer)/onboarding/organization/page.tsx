import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import { OrganizationOnboardingForm } from "@/components/onboarding/organization-onboarding-form";
import { StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { requireSession } from "@/services/auth";
import { getCurrentUserOrganizations, isOrganizationRegistrationOpen } from "@/services/organizations";

export const dynamic = "force-dynamic";

export default async function OrganizationOnboardingPage() {
  const session = await requireSession();
  const [existing, registrationOpen] = await Promise.all([
    getCurrentUserOrganizations(),
    isOrganizationRegistrationOpen(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Organization onboarding"
        title="Create your organization workspace"
        description="Set up the account, then configure services, schedules and your team. Approval is handled by the platform console."
      />

      {registrationOpen ? (
        <OrganizationOnboardingForm
          defaultEmail={session.email ?? ""}
          defaultTimezone={session.profile.timezone || "UTC"}
        />
      ) : (
        <Card className="p-6">
          <h2 className="text-sm font-bold">Organization registration is closed</h2>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted">
            A platform administrator has paused new organization registrations. Existing
            workspaces are unaffected. Contact platform support if you need a new organization
            created.
          </p>
        </Card>
      )}

      {existing.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Building2 className="size-4 text-cyan-300" /> Organizations you already belong to
          </div>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {existing.map(({ role, org }) => (
              <Link
                key={org.id}
                href={`/manage/${org.slug}/overview`}
                className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5 transition hover:border-cyan-400/25 hover:bg-white/[0.04]"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-cyan-400/20 bg-cyan-500/10 font-mono text-[10px] font-bold text-cyan-200">
                  {org.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground">{org.name}</p>
                  <p className="mt-0.5 text-[10px] text-subtle">
                    {role.replaceAll("_", " ").toLowerCase()} · {org.slug}
                  </p>
                </div>
                <StatusBadge status={org.status} showDot={false} />
                <ArrowRight className="size-3.5 shrink-0 text-subtle" />
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
