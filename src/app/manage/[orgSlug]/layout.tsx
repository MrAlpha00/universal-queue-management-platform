import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowUpRight, Clock3 } from "lucide-react";
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
  const statusNotice =
    org.status === "PENDING"
      ? "This organization is awaiting platform review. You can configure services, schedules and staff now; customer booking opens after approval."
      : org.status === "SUSPENDED"
        ? "This organization is suspended. Customer booking and public discovery are disabled until a platform administrator restores access."
        : org.status === "REJECTED"
          ? "This organization registration was rejected. Contact platform support if you believe this is a mistake."
          : null;

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
      {statusNotice && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/[0.07] px-4 py-3 text-xs leading-relaxed text-amber-100">
          <Clock3 className="mt-0.5 size-4 shrink-0 text-amber-300" />
          <p>{statusNotice}</p>
        </div>
      )}
      {children}
    </DashboardShell>
  );
}
