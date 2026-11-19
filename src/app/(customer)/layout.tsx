import { DashboardShell, SetupRequired } from "@/components/layout/dashboard-shell";
import { customerNav } from "@/config/navigation";
import { hasSupabaseConfig } from "@/lib/env";
import { getCurrentSession } from "@/services/auth";

export const dynamic = "force-dynamic";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  if (!hasSupabaseConfig()) return <SetupRequired area="the customer dashboard" />;
  const session = await getCurrentSession();
  if (!session) return <SetupRequired area="the customer dashboard" />;

  return (
    <DashboardShell
      nav={customerNav}
      workspaceLabel="Customer workspace"
      user={{
        name: session.profile.full_name || session.email?.split("@")[0] || "Customer",
        email: session.email ?? "",
        avatarUrl: session.profile.avatar_url,
      }}
    >
      {children}
    </DashboardShell>
  );
}
