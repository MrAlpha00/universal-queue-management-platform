import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  QrCode,
  ScanLine,
  Ticket,
  UsersRound,
} from "lucide-react";
import { FinalCta } from "@/components/marketing/final-cta";
import { InfoHero } from "@/components/marketing/info-hero";
import { Reveal } from "@/components/animations/reveal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Follow a booking from discovery to check-in, and see how organizations configure availability, tokens and reminders.",
};

const customerSteps = [
  {
    icon: UsersRound,
    title: "Find an organization",
    detail: "Browse approved organizations, compare services and choose the branch that suits you.",
  },
  {
    icon: CalendarCheck2,
    title: "Pick a real slot",
    detail: "Availability reflects working hours, capacity and exceptions — no back-and-forth.",
  },
  {
    icon: Ticket,
    title: "Receive a token",
    detail: "Answer any service-specific questions and get a token number immediately.",
  },
  {
    icon: QrCode,
    title: "Keep your QR ready",
    detail: "Your ticket holds an opaque QR reference that can be refreshed if needed.",
  },
  {
    icon: BellRing,
    title: "Get reminded",
    detail: "Email reminders arrive at the intervals the organization configured.",
  },
  {
    icon: ScanLine,
    title: "Check in on arrival",
    detail: "Staff scan your QR. Duplicate check-ins are rejected automatically.",
  },
];

const organizationSteps = [
  {
    title: "Create your workspace",
    detail: "Register your organization, choose a timezone and wait for platform approval.",
  },
  {
    title: "Model your services",
    detail: "Add services, durations, capacity, custom booking fields and cancellation policies.",
  },
  {
    title: "Publish availability",
    detail: "Set weekly working hours, breaks and exceptions, then generate slots for the booking horizon.",
  },
  {
    title: "Invite your team",
    detail: "Assign owners, admins, managers and staff with permissions that match their responsibilities.",
  },
  {
    title: "Run the day",
    detail: "Use the queue board, scanner and appointment table to move customers through their visit.",
  },
  {
    title: "Review and improve",
    detail: "Analyze utilization, completion and no-show trends, then tune rules and reminder timing.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <InfoHero
        eyebrow="How it works"
        title={<>From first click to check-in, every step is intentional.</>}
        description="TokenFlow separates the customer journey from the operational console while keeping both in sync through one reliable booking engine."
        actions={
          <>
            <Button asChild size="lg">
              <Link href="/signup">Create your workspace <ArrowRight /></Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/features">Explore features</Link>
            </Button>
          </>
        }
        aside={
          <Card className="relative overflow-hidden p-6">
            <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-cyan-500/15 blur-3xl" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">Booking lifecycle</p>
            <div className="mt-5 space-y-3">
              {[
                { label: "Booked", detail: "Slot reserved atomically", tone: "bg-violet-400" },
                { label: "Checked in", detail: "QR verified once", tone: "bg-cyan-400" },
                { label: "In progress", detail: "Customer with staff", tone: "bg-amber-400" },
                { label: "Completed", detail: "Visit closed cleanly", tone: "bg-teal-400" },
              ].map((state, index) => (
                <div key={state.label} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
                  <span className={`size-2 rounded-full ${state.tone}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">{state.label}</p>
                    <p className="text-[11px] text-subtle">{state.detail}</p>
                  </div>
                  <span className="font-mono text-[10px] text-subtle">0{index + 1}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 flex items-center gap-2 text-[11px] text-muted">
              <LockIcon /> Invalid transitions are rejected by the database.
            </p>
          </Card>
        }
      />

      <section className="relative pb-24 sm:pb-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <SectionHeading
              eyebrow="For customers"
              title={<>A booking experience that respects your time.</>}
              description="No account maze, no ambiguous availability and no paper tickets. Just a clear path to the right slot."
            />
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {customerSteps.map((step, index) => (
              <Reveal key={step.title} delay={index * 0.05}>
                <Card className="h-full p-6">
                  <div className="flex items-center justify-between">
                    <div className="grid size-10 place-items-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-violet-200">
                      <step.icon className="size-4.5" />
                    </div>
                    <span className="font-mono text-[11px] text-subtle">0{index + 1}</span>
                  </div>
                  <h3 className="mt-4 text-base font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.detail}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-white/[0.06] bg-white/[0.015] py-24 sm:py-32">
        <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[700px] -translate-x-1/2 rounded-full bg-teal-500/[0.06] blur-[100px]" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <Reveal>
              <SectionHeading
                eyebrow="For organizations"
                title={<>Configure once. Operate every day with confidence.</>}
                description="Set policy at the organization level and let the booking engine enforce it consistently."
              />
              <div className="mt-8 space-y-3 text-sm text-muted">
                {[
                  "Approval keeps low-quality listings out of discovery.",
                  "Organization data is isolated by row-level security.",
                  "Every sensitive action is written to an audit trail.",
                ].map((item) => (
                  <p key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-teal-300" />
                    {item}
                  </p>
                ))}
              </div>
            </Reveal>
            <div className="space-y-3">
              {organizationSteps.map((step, index) => (
                <Reveal key={step.title} delay={index * 0.04}>
                  <div className="flex gap-4 rounded-2xl border border-white/[0.08] bg-surface/50 p-5">
                    <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 font-mono text-xs font-bold text-cyan-200">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">{step.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{step.detail}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <Reveal>
            <SectionHeading
              eyebrow="Behind the scenes"
              title={<>Designed around durable, verifiable state.</>}
              description="Tokens have their own lifecycle. Capacity is reserved in a transaction. Reminders can be cancelled. Nothing depends on a browser staying open."
              align="center"
            />
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Clock3, label: "Atomic capacity", detail: "Concurrent bookings cannot exceed a slot." },
              { icon: ScanLine, label: "Single check-in", detail: "The first valid scan wins; repeats are flagged." },
              { icon: BellRing, label: "Durable reminders", detail: "Background jobs survive deploys and restarts." },
            ].map((item, index) => (
              <Reveal key={item.label} delay={index * 0.06}>
                <Card className="h-full p-6 text-center">
                  <div className="mx-auto grid size-11 place-items-center rounded-xl border border-amber-400/20 bg-amber-500/10 text-amber-200">
                    <item.icon className="size-5" />
                  </div>
                  <h3 className="mt-4 text-sm font-bold">{item.label}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted">{item.detail}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <FinalCta />
    </>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="size-3.5" aria-hidden>
      <rect x="3" y="7" width="10" height="7" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export const revalidate = 3600;
