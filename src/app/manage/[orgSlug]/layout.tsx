import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { DashboardShell, SetupRequired } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { managementNav } from "@/config/navigation";
import { hasSupabaseConfig } from "@/lib/env";
import { getCurrentSession, getOrgContext } from "@/services/auth";

export const dynamic = "force-dynamic";

export default async function ManagementLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  if (!hasSupabaseConfig()) return <SetupRequired area="the management workspace" />;
  const session = await getCurrentSession();
  if (!session) redirect(`/login?next=/manage/${orgSlug}/overview`);

  let context;
  try {
    context = await getOrgContext(orgSlug, "MEMBER");
  } catch {
    notFound();
  }

  const { org, role, session: activeSession } = context;

  return (
    <DashboardShell
      nav={managementNav(orgSlug)}
      workspaceLabel={`${org.name} · Management`}
      workspaceHref={`/manage/${orgSlug}/overview`}
      accent="cyan"
      user={{
        name: activeSession.profile.full_name || activeSession.email?.split("@")[0] || "Staff",
        email: activeSession.email ?? "",
        avatarUrl: activeSession.profile.avatar_url,
      }}
      topbarActions={
        <div className="hidden items-center gap-2 sm:flex">
          <Badge tone={org.status === "APPROVED" ? "teal" : org.status === "PENDING" ? "amber" : "coral"}>
            {org.status.toLowerCase()}
          </Badge>
          <Badge tone="violet">{role.replaceAll("_", " ").toLowerCase()}</Badge>
          <Link
            href={`/organizations/${org.slug}`}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-semibold text-muted transition hover:text-foreground"
          >
            Public page <ArrowUpRight className="size-3" />
          </Link>
        </div>
      }
    >
      {children}
    </DashboardShell>
  );
}
