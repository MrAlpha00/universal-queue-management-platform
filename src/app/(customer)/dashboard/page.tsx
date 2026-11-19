import Link from "next/link";
import { ArrowRight, CalendarCheck2, Clock3, QrCode, Ticket } from "lucide-react";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { CountUp } from "@/components/animations/count-up";
import { StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/misc";
import { StatCard } from "@/components/ui/stat-card";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { requireSession } from "@/services/auth";
import { getNextCustomerAppointment, listCustomerAppointments } from "@/services/bookings";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CustomerDashboardPage() {
  const session = await requireSession();
  const [next, appointments] = await Promise.all([
    getNextCustomerAppointment(),
    listCustomerAppointments(),
  ]);

  const active = appointments.filter((item) => ["BOOKED", "CHECKED_IN", "IN_PROGRESS"].includes(item.status)).length;
  const completed = appointments.filter((item) => item.status === "COMPLETED").length;
  const recent = appointments.slice(0, 5);
  const orgName = next?.organization?.name || "—";
  const tokenNumber = next?.token?.token_number || "—";

  let countdown = "—";
  if (next) {
    const zoned = toZonedTime(new Date(next.start_at), next.timezone);
    countdown = format(zoned, "EEE, d MMM · HH:mm");
  }

  let tokenStatus = 0;
  if (next) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("tokens")
      .select("id", { count: "exact", head: true })
      .eq("appointment_id", next.id)
      .eq("status", "BOOKED");
    tokenStatus = count ?? 0;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Dashboard"
        title="Your appointments at a glance"
        description="Track upcoming visits, access QR tickets and manage your bookings."
      />

      <WelcomeBanner name={session.profile.full_name || session.email || "there"} hasAppointment={Boolean(next)} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Upcoming appointments" value={<CountUp value={active} /> as unknown as string} icon={CalendarCheck2} tone="violet" hint="Active bookings" />
        <StatCard label="Completed visits" value={<CountUp value={completed} /> as unknown as string} icon={Ticket} tone="teal" hint="All time" />
        <StatCard label="Active tokens" value={tokenStatus} icon={QrCode} tone="cyan" hint="Ready for check-in" />
        <StatCard label="Total bookings" value={<CountUp value={appointments.length} /> as unknown as string} icon={Clock3} tone="amber" hint="Your history" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-300">Next appointment</p>
              <h3 className="mt-1.5 text-lg font-bold">{next ? orgName : "Nothing scheduled"}</h3>
            </div>
            {next && <StatusBadge status={next.status} />}
          </div>

          {next ? (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Service", value: next.service?.name ?? "—" },
                  { label: "When", value: countdown },
                  { label: "Token", value: tokenNumber },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle">{item.label}</p>
                    <p className="mt-1.5 truncate text-sm font-semibold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link href={`/appointments/${next.id}`}>
                  <Button variant="secondary" size="sm">View details <ArrowRight className="size-3.5" /></Button>
                </Link>
                <Link href={`/appointments/${next.id}/ticket`}>
                  <Button variant="cyan" size="sm"><QrCode className="size-3.5" /> Open QR ticket</Button>
                </Link>
              </div>
            </>
          ) : (
            <EmptyState
              className="mt-6"
              icon={CalendarCheck2}
              title="No upcoming appointments"
              description="Browse approved organizations and book a time that works for you."
              action={<Button asChild><Link href="/organizations">Explore organizations</Link></Button>}
            />
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold">Recent activity</h3>
            <Link href="/appointments" className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">
              View all
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {recent.length ? recent.map((item) => (
              <Link
                key={item.id}
                href={`/appointments/${item.id}`}
                className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5 transition hover:border-violet-400/25 hover:bg-white/[0.045]"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-violet-400/20 bg-violet-500/10 font-mono text-[10px] font-bold text-violet-200">
                  {item.token?.token_number?.replace(/^[A-Z]+-/, "") ?? "—"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground">{item.service?.name ?? "Appointment"}</p>
                  <p className="truncate text-[11px] text-subtle">{item.organization?.name} · {item.appointment_date}</p>
                </div>
                <StatusBadge status={item.status} />
              </Link>
            )) : (
              <p className="py-8 text-center text-sm text-subtle">Your booking activity will appear here.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
