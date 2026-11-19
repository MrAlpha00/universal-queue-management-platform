import Link from "next/link";
import { ArrowRight, Check, CircleCheck, Layers3, LockKeyhole, Radio, Zap } from "lucide-react";
import { Reveal } from "@/components/animations/reveal";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/misc";

const capabilities = [
  {
    icon: Layers3,
    title: "Industry independent",
    detail: "Services, fields and policies are configuration — not code. Any organization can shape TokenFlow to fit its workflow.",
  },
  {
    icon: LockKeyhole,
    title: "Isolated by design",
    detail: "Row-level security and server-side checks keep every organization's bookings, staff and settings private.",
  },
  {
    icon: Zap,
    title: "Atomic booking engine",
    detail: "Database transactions reserve capacity safely, even under simultaneous requests. Overbooking is impossible.",
  },
  {
    icon: Radio,
    title: "Durable automation",
    detail: "Reminders and expiration processing run in reliable background jobs — independent of an open browser tab.",
  },
];

export function Capabilities() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="pointer-events-none absolute right-0 top-1/4 size-[500px] rounded-full bg-cyan-500/[0.05] blur-[120px]" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <Reveal>
            <SectionHeading
              eyebrow="Platform capabilities"
              title={<>One foundation.<br /><span className="text-muted">Infinite configurations.</span></>}
              description="TokenFlow is built as a platform, not a template. It adapts to the way your organization already works."
            />
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/signup">Create your workspace <ArrowRight /></Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/platform-capabilities">Explore the platform</Link>
              </Button>
            </div>
          </Reveal>

          <div className="space-y-3">
            {capabilities.map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.title} delay={index * 0.08}>
                  <div className="group flex gap-4 rounded-2xl border border-white/[0.08] bg-surface/40 p-5 transition-all hover:border-cyan-400/25 hover:bg-surface/70">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-200">
                      <Icon className="size-4.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.detail}</p>
                    </div>
                    <CircleCheck className="ml-auto size-4 shrink-0 text-teal-400/70 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        <Reveal className="mt-20">
          <div className="glass relative overflow-hidden rounded-3xl p-8 sm:p-12">
            <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-violet-500/15 blur-[80px]" />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-teal-300">Ready when you are</p>
                <h3 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                  Your first appointment could be today.
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
                  Set up your organization, publish a service and start accepting bookings — no hardware,
                  no complexity, no industry lock-in.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted">
                {["No hardware", "No credit card", "Cancel anytime"].map((item) => (
                  <span key={item} className="flex items-center gap-1.5">
                    <Check className="size-3.5 text-teal-300" /> {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
