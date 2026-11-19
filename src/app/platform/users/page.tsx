import { ShieldCheck, UserRound, Users } from "lucide-react";
import { PlatformUsersTable } from "@/components/platform/users-table";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { getCurrentSession } from "@/services/auth";
import { getPlatformUserMemberships, listPlatformUsers } from "@/services/platform";

export const dynamic = "force-dynamic";

export default async function PlatformUsersPage() {
  const [session, users, memberships] = await Promise.all([
    getCurrentSession(),
    listPlatformUsers(),
    getPlatformUserMemberships(),
  ]);

  const admins = users.filter((user) => user.platform_role === "PLATFORM_ADMIN").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Access control"
        title="Users"
        description="Every person on the platform. Grant platform administrator access only to trusted operators."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total profiles", value: users.length, icon: Users, tone: "text-violet-300" },
          { label: "Platform admins", value: admins, icon: ShieldCheck, tone: "text-amber-300" },
          { label: "Standard users", value: users.length - admins, icon: UserRound, tone: "text-cyan-300" },
        ].map((item) => (
          <Card key={item.label} className="flex items-center gap-3 p-4">
            <div className={`grid size-10 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] ${item.tone}`}>
              <item.icon className="size-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">{item.label}</p>
              <p className="text-xl font-bold tabular-nums">{item.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <PlatformUsersTable
        users={users}
        memberships={memberships}
        currentUserId={session?.userId ?? ""}
      />
    </div>
  );
}
