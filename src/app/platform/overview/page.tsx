import Link from "next/link";
import { Activity, Building2, CalendarCheck2, MailCheck, ShieldAlert, Users } from "lucide-react";
import { CountUp } from "@/components/animations/count-up";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { StatCard } from "@/components/ui/stat-card";
import { getPlatformStats, listPlatformActivity, listPlatformOrganizations } from "@/services/platform";

export const dynamic = "force-dynamic";

export default async function PlatformOverviewPage() {
  const [stats, organizations, activity] = await Promise.all([
    getPlatformStats(),
    listPlatformOrganizations(),
    listPlatformActivity(8),
  ]);

  const pending = organizations.filter((org) => org.status === "PENDING");

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Platform console"
        title="System overview"
        description="Cross-organization health, approvals and recent platform activity."
        actions={<Button asChild variant="cyan" size="sm"><Link href="/platform/organizations"><Building2 className="size-3.5" /> Review organizations</Link></Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Organizations" value={<CountUp value={stats.organizations} />} icon={Building2} tone="violet" hint="All registered" />
        <StatCard label="Users" value={<CountUp value={stats.users} />} icon={Users} tone="cyan" hint="Registered profiles" />
        <StatCard label="Appointments" value={<CountUp value={stats.appointments} />} icon={CalendarCheck2} tone="teal" hint="Across the platform" />
        <StatCard label="Pending approvals" value={<CountUp value={stats.pending} />} icon={ShieldAlert} tone="amber" hint="Awaiting review" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold">Awaiting approval</h2>
              <p className="mt-1 text-xs text-muted">New organizations need review before going public.</p>
            </div>
            <Button asChild variant="ghost" size="sm"><Link href="/platform/organizations">All organizations</Link></Button>
          </div>
          <div className="mt-5 space-y-2">
            {pending.length ? pending.slice(0, 6).map((org) => (
              <Link key={org.id} href="/platform/organizations" className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 transition hover:border-amber-400/25">
                <div className="grid size-9 place-items-center rounded-lg border border-amber-400/20 bg-amber-500/10 text-amber-200"><Building2 className="size-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{org.name}</p>
                  <p className="truncate text-[11px] text-subtle">{org.owner?.email ?? org.email ?? "No contact"}</p>
                </div>
                <StatusBadge status={org.status} />
              </Link>
            )) : <p className="py-8 text-center text-xs text-subtle">Nothing waiting for review.</p>}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold">Recent activity</h2>
              <p className="mt-1 text-xs text-muted">Audit events across every organization.</p>
            </div>
            <Button asChild variant="ghost" size="sm"><Link href="/platform/activity">View all</Link></Button>
          </div>
          <div className="mt-5 space-y-2">
            {activity.length ? activity.map((event) => (
              <div key={event.id} className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                <Activity className="mt-0.5 size-4 shrink-0 text-violet-300" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{event.action.replaceAll("_", " ").toLowerCase()}</p>
                  <p className="truncate text-[11px] text-subtle">{event.actor?.full_name || event.actor?.email || "System"} · {event.entity_type}</p>
                </div>
              </div>
            )) : <p className="py-8 text-center text-xs text-subtle">No activity yet.</p>}
          </div>
        </Card>
      </div>

      <Card className="grid gap-4 p-5 sm:grid-cols-3">
        {[
          { label: "Emails sent", value: stats.notifications, icon: MailCheck },
          { label: "Scheduled reminders", value: stats.reminders, icon: Activity },
          { label: "Approved organizations", value: organizations.filter((o) => o.status === "APPROVED").length, icon: ShieldAlert },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-violet-300"><item.icon className="size-5" /></div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle">{item.label}</p>
              <p className="text-lg font-bold tabular-nums">{item.value}</p>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
