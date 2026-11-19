import { BarChart3, CalendarCheck2, TrendingUp, Users } from "lucide-react";
import { AnalyticsCharts } from "@/components/manage/analytics-charts";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { StatCard } from "@/components/ui/stat-card";
import { getOrgContext } from "@/services/auth";
import { getOrgAnalytics } from "@/services/management";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { org } = await getOrgContext(orgSlug, "MEMBER");
  const analytics = await getOrgAnalytics(org.id, 14);

  const completed = analytics.statuses.find((s) => s.status === "COMPLETED")?.count ?? 0;
  const active = analytics.statuses
    .filter((s) => ["BOOKED", "CHECKED_IN", "IN_PROGRESS"].includes(s.status))
    .reduce((sum, s) => sum + s.count, 0);
  const completionRate = analytics.total ? Math.round((completed / analytics.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Insights"
        title="Analytics"
        description="A 14-day view of demand, service mix and completion performance."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Appointments" value={analytics.total} icon={CalendarCheck2} tone="violet" hint="Last 14 days" />
        <StatCard label="Active" value={active} icon={BarChart3} tone="cyan" hint="Booked or in service" />
        <StatCard label="Completed" value={completed} icon={TrendingUp} tone="teal" hint="Finished visits" />
        <StatCard label="Completion rate" value={`${completionRate}%`} icon={Users} tone="amber" hint="Of all bookings" />
      </div>

      <AnalyticsCharts series={analytics.series} services={analytics.services} statuses={analytics.statuses} />

      <Card className="p-5">
        <h2 className="text-sm font-bold">Service performance</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {analytics.services.length ? analytics.services.map((service) => (
            <div key={service.name} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
              <span className="truncate text-xs font-semibold">{service.name}</span>
              <span className="text-xs tabular-nums text-muted">{service.count}</span>
            </div>
          )) : <p className="text-xs text-subtle">No service data yet.</p>}
        </div>
      </Card>
    </div>
  );
}
