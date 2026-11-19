import Link from "next/link";
import {
  ArrowUpRight,
  BellRing,
  Building2,
  CalendarClock,
  ChartNoAxesCombined,
  Fingerprint,
  QrCode,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";
import { GlowCard } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/misc";
import { QrPattern } from "@/components/brand/qr-pattern";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/animations/reveal";

function MiniSchedule() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const slots = [
    [1, 1, 1, 1, 1, 0, 0],
    [1, 1, 0, 1, 1, 0, 0],
    [1, 0, 1, 1, 1, 1, 0],
  ];
  return (
    <div className="mt-6 rounded-xl border border-white/[0.08] bg-[#0d1528]/70 p-4">
      <div className="grid grid-cols-7 gap-2 text-center">
        {days.map((d, i) => (
          <span key={i} className="text-[10px] font-semibold text-subtle">{d}</span>
        ))}
        {slots.flatMap((row, r) =>
          row.map((active, c) => (
            <span
              key={`${r}-${c}`}
              className={`h-5 rounded-[5px] ${active ? "bg-gradient-to-br from-violet-500/70 to-indigo-400/40" : "bg-white/[0.04]"}`}
            />
          )),
        )}
      </div>
    </div>
  );
}

function MiniReminder() {
  return (
    <div className="mt-6 space-y-2.5">
      {[
        { time: "2h before", label: "Heading soon", active: true },
        { time: "60m before", label: "Time to leave", active: true },
        { time: "10m before", label: "Almost there", active: false },
      ].map((item) => (
        <div key={item.time} className="flex items-center gap-3 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2">
          <span className={`size-1.5 rounded-full ${item.active ? "bg-teal-400" : "bg-white/20"}`} />
          <span className="text-xs text-foreground/85">{item.label}</span>
          <span className="ml-auto font-mono text-[10px] text-subtle">{item.time}</span>
        </div>
      ))}
    </div>
  );
}

export function FeatureBento() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-600/[0.06] blur-[120px]" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Everything in one place"
            title={<>Powerful enough for operations.<br /><span className="text-muted">Simple enough for everyone.</span></>}
            description="From the first booking to the final check-in, TokenFlow gives your team and your customers a clear, delightful experience."
          />
        </Reveal>

        <StaggerGroup className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StaggerItem className="md:col-span-2">
            <GlowCard glow="violet" interactive className="h-full p-7 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="grid size-11 place-items-center rounded-xl border border-violet-400/25 bg-violet-500/12 text-violet-200">
                  <CalendarClock className="size-5" />
                </div>
                <ArrowUpRight className="size-4 text-subtle" />
              </div>
              <h3 className="mt-6 text-xl font-bold tracking-tight">Intelligent availability</h3>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
                Configure hours, buffers, capacity, holidays and exceptions. TokenFlow computes
                real available slots and reserves them atomically — no double bookings, ever.
              </p>
              <MiniSchedule />
            </GlowCard>
          </StaggerItem>

          <StaggerItem>
            <GlowCard glow="cyan" interactive className="h-full p-7 sm:p-8">
              <div className="grid size-11 place-items-center rounded-xl border border-cyan-400/25 bg-cyan-500/12 text-cyan-200">
                <QrCode className="size-5" />
              </div>
              <h3 className="mt-6 text-xl font-bold tracking-tight">Secure QR tokens</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Opaque, unguessable references. Nothing personal in the QR. Verified on the server
                against appointment time, status and organization.
              </p>
              <div className="mt-6 flex justify-center rounded-xl border border-white/[0.07] bg-[#0d1528]/70 py-5">
                <QrPattern size={90} />
              </div>
            </GlowCard>
          </StaggerItem>

          <StaggerItem>
            <GlowCard glow="amber" interactive className="h-full p-7 sm:p-8">
              <div className="grid size-11 place-items-center rounded-xl border border-amber-400/25 bg-amber-500/12 text-amber-200">
                <BellRing className="size-5" />
              </div>
              <h3 className="mt-6 text-xl font-bold tracking-tight">Reminders that land</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Beautiful email reminders on your schedule. Cancellations automatically stop
                every pending message.
              </p>
              <MiniReminder />
            </GlowCard>
          </StaggerItem>

          <StaggerItem className="md:col-span-2">
            <GlowCard glow="teal" interactive className="h-full p-7 sm:p-8">
              <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <div className="grid size-11 place-items-center rounded-xl border border-teal-400/25 bg-teal-500/12 text-emerald-200">
                    <Building2 className="size-5" />
                  </div>
                  <h3 className="mt-6 text-xl font-bold tracking-tight">Built for many organizations</h3>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
                    Branches, services and staff are isolated per organization with row-level
                    security and server-side authorization. One platform, zero data leakage.
                  </p>
                  <Link href="/platform-capabilities" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-300 hover:text-teal-200">
                    Explore the platform <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
                <div className="w-full max-w-xs space-y-2">
                  {["Northside Studio", "Cedar & Co.", "Meridian Group"].map((name, i) => (
                    <div key={name} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-3">
                      <span className={`grid size-8 place-items-center rounded-lg text-xs font-bold ${
                        ["bg-violet-500/20 text-violet-200", "bg-cyan-500/20 text-cyan-200", "bg-amber-500/20 text-amber-200"][i]
                      }`}>{name[0]}</span>
                      <span className="text-xs font-medium text-foreground/85">{name}</span>
                      <span className="ml-auto size-1.5 rounded-full bg-teal-400" />
                    </div>
                  ))}
                </div>
              </div>
            </GlowCard>
          </StaggerItem>

          <StaggerItem>
            <GlowCard glow="coral" interactive className="h-full p-7 sm:p-8">
              <div className="grid size-11 place-items-center rounded-xl border border-rose-400/25 bg-rose-500/12 text-rose-200">
                <SlidersHorizontal className="size-5" />
              </div>
              <h3 className="mt-6 text-xl font-bold tracking-tight">Your rules, your workflow</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Dynamic booking fields, per-service policies, configurable check-in windows and
                reminder offsets. No industry assumptions.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Custom fields", " Grace period", "Buffers", "Policies"].map((tag) => (
                  <span key={tag} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-muted">{tag.trim()}</span>
                ))}
              </div>
            </GlowCard>
          </StaggerItem>

          <StaggerItem>
            <GlowCard glow="violet" interactive className="h-full p-7 sm:p-8">
              <div className="grid size-11 place-items-center rounded-xl border border-violet-400/25 bg-violet-500/12 text-violet-200">
                <ChartNoAxesCombined className="size-5" />
              </div>
              <h3 className="mt-6 text-xl font-bold tracking-tight">Clarity at a glance</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Live queues, utilization, completion rates and audit trails — all drawn from real
                database activity.
              </p>
              <div className="mt-6 flex h-14 items-end gap-1.5">
                {[32, 48, 38, 65, 54, 78, 62, 88, 70, 96, 74, 84].map((h, i) => (
                  <span key={i} className="flex-1 rounded-t-sm bg-gradient-to-t from-violet-500/20 to-cyan-400/80" style={{ height: `${h}%` }} />
                ))}
              </div>
            </GlowCard>
          </StaggerItem>

          <StaggerItem className="md:col-span-2">
            <GlowCard glow="cyan" interactive className="h-full p-7 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-cyan-400/25 bg-cyan-500/12 text-cyan-200">
                  <UsersRound className="size-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Three distinct experiences</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                    Customers book and track. Organization teams operate and analyze. Platform
                    admins govern the whole network. Each with its own polished workspace.
                  </p>
                  <div className="mt-6 grid gap-2 sm:grid-cols-3">
                    {[
                      { label: "Customer", detail: "Book · Track · Scan-ready", tone: "violet" },
                      { label: "Organization", detail: "Operate · Manage · Analyze", tone: "cyan" },
                      { label: "Platform", detail: "Govern · Approve · Monitor", tone: "teal" },
                    ].map((role) => (
                      <div key={role.label} className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3">
                        <p className="text-xs font-bold text-foreground">{role.label}</p>
                        <p className="mt-1 text-[10px] text-subtle">{role.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </GlowCard>
          </StaggerItem>
        </StaggerGroup>
      </div>
    </section>
  );
}
