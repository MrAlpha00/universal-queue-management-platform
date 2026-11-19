import Link from "next/link";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Activity, ArrowRight, CalendarCheck2, Clock3, QrCode, Users } from "lucide-react";
import { CountUp } from "@/components/animations/count-up";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, Progress } from "@/components/ui/misc";
import { StatCard } from "@/components/ui/stat-card";
import { getOrgContext } from "@/services/auth";
import { getQueueAppointments } from "@/services/management";

export const dynamic = "force-dynamic";

export default async function ManageOverviewPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { org } = await getOrgContext(orgSlug, "MEMBER");
  const today = format(toZonedTime(new Date(), org.timezone), "yyyy-MM-dd");
  const appointments = await getQueueAppointments(org.id, today);

  const booked = appointments.filter((a) => a.status === "BOOKED").length;
  const checkedIn = appointments.filter((a) => a.status === "CHECKED_IN").length;
  const inProgress = appointments.filter((a) => a.status === "IN_PROGRESS").length;
  const completed = appointments.filter((a) => a.status === "COMPLETED").length;
  const active = booked + checkedIn + inProgress;
  const upcoming = appointments.filter((a) => ["BOOKED", "CHECKED_IN"].includes(a.status)).slice(0, 6);
  const completionRate = appointments.length ? Math.round((completed / appointments.length) * 100) : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Overview"
        title={`Good ${greeting(org.timezone)}, ${org.name}`}
        description={`Today in ${org.timezone} · ${format(toZonedTime(new Date(), org.timezone), "EEEE, d MMMM yyyy")}`}
        actions={
          <>
            <Button asChild variant="secondary" size="sm"><Link href={`/manage/${orgSlug}/queue`}><Activity className="size-3.5" /> Open queue</Link></Button>
            <Button asChild variant="cyan" size="sm"><Link href={`/manage/${orgSlug}/scanner`}><QrCode className="size-3.5" /> Scan tokens</Link></Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's appointments" value={<CountUp value={appointments.length} />} icon={CalendarCheck2} tone="violet" hint="All statuses" />
        <StatCard label="In queue" value={<CountUp value={active} />} icon={Activity} tone="cyan" hint="Booked, checked in or serving" />
        <StatCard label="Completed" value={<CountUp value={completed} />} icon={Clock3} tone="teal" hint="Finished today" />
        <StatCard label="Completion rate" value={<CountUp value={completionRate} suffix="%" />} icon={Users} tone="amber" hint="Of today's visits" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold">Up next</h2>
              <p className="mt-1 text-xs text-muted">Customers waiting to be served today.</p>
            </div>
            <Button asChild variant="ghost" size="sm"><Link href={`/manage/${orgSlug}/queue`}>View queue <ArrowRight className="size-3.5" /></Link></Button>
          </div>

          <div className="mt-5 space-y-2.5">
            {upcoming.length ? upcoming.map((appointment) => (
              <Link
                key={appointment.id}
                href={`/manage/${orgSlug}/appointments?q=${appointment.token?.token_number ?? ""}`}
                className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5 transition hover:border-cyan-400/25 hover:bg-white/[0.04]"
              >
                <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-violet-400/20 bg-violet-500/10 font-mono text-[10px] font-bold text-violet-200">
                  {appointment.token?.token_number?.replace(/^[A-Z]+-/, "") ?? "—"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{appointment.customer?.full_name || appointment.customer?.email || "Customer"}</p>
                  <p className="truncate text-[11px] text-subtle">{appointment.service?.name} · {appointment.start_time.slice(0, 5)}</p>
                </div>
                <StatusBadge status={appointment.status} />
              </Link>
            )) : (
              <EmptyState
                className="py-10"
                icon={CalendarCheck2}
                title="No appointments today"
                description="When customers book for today, they will appear here in real time."
              />
            )}
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-6">
            <h2 className="text-base font-bold">Today's flow</h2>
            <div className="mt-5 space-y-4">
              {[
                { label: "Booked", value: booked, tone: "violet" as const },
                { label: "Checked in", value: checkedIn, tone: "cyan" as const },
                { label: "In progress", value: inProgress, tone: "amber" as const },
                { label: "Completed", value: completed, tone: "teal" as const },
              ].map((row) => {
                const pct = appointments.length ? Math.round((row.value / appointments.length) * 100) : 0;
                return (
                  <div key={row.label}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-muted">{row.label}</span>
                      <span className="font-semibold tabular-nums text-foreground">{row.value} <span className="font-normal text-subtle">· {pct}%</span></span>
                    </div>
                    <Progress value={pct} tone={row.tone} />
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-base font-bold">Quick actions</h2>
            <div className="mt-4 grid gap-2">
              {[
                { label: "Manage services", href: `services`, icon: CalendarCheck2 },
                { label: "Configure schedules", href: `schedules`, icon: Clock3 },
                { label: "Invite staff", href: `staff`, icon: Users },
                { label: "Review analytics", href: `analytics`, icon: Activity },
              ].map((action) => (
                <Link key={action.href} href={`/manage/${orgSlug}/${action.href}`} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5 text-xs font-semibold text-muted transition hover:border-violet-400/25 hover:text-foreground">
                  <action.icon className="size-3.5 text-violet-300" /> {action.label}
                  <ArrowRight className="ml-auto size-3.5" />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function greeting(timezone: string) {
  const hour = Number(format(toZonedTime(new Date(), timezone), "H"));
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}
