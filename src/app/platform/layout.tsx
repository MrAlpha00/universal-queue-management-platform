import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { DashboardShell, SetupRequired } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { platformNav } from "@/config/navigation";
import { hasSupabaseConfig } from "@/lib/env";
import { getCurrentSession } from "@/services/auth";

export const dynamic = "force-dynamic";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  if (!hasSupabaseConfig()) return <SetupRequired area="the platform console" />;
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/platform/overview");
  if (session.profile.platform_role !== "PLATFORM_ADMIN") redirect("/dashboard");

  return (
    <DashboardShell
      nav={platformNav}
      workspaceLabel="Platform console"
      workspaceHref="/platform/overview"
      accent="amber"
      user={{
        name: session.profile.full_name || session.email?.split("@")[0] || "Admin",
        email: session.email ?? "",
        avatarUrl: session.profile.avatar_url,
      }}
      topbarActions={
        <Badge tone="amber" className="hidden sm:inline-flex">
          <ShieldCheck className="size-3" /> Platform admin
        </Badge>
      }
    >
      {children}
    </DashboardShell>
  );
}
