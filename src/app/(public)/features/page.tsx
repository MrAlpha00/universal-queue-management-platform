import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Building2,
  CalendarClock,
  ChartNoAxesCombined,
  ClipboardList,
  LockKeyhole,
  QrCode,
  ScanLine,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";
import { FinalCta } from "@/components/marketing/final-cta";
import { InfoHero } from "@/components/marketing/info-hero";
import { StaggerGroup, StaggerItem } from "@/components/animations/reveal";
import { Button } from "@/components/ui/button";
import { GlowCard } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Availability, atomic booking, secure QR tokens, reminders, queue operations and analytics — configured for any industry.",
};

const features = [
  {
    icon: CalendarClock,
    title: "Availability that tells the truth",
    detail:
      "Define working hours, breaks, buffers, capacity and date exceptions. Slots are generated from your real configuration and reserved transactionally.",
    tone: "violet" as const,
  },
  {
    icon: ClipboardList,
    title: "Service-specific booking fields",
    detail:
      "Collect exactly what each service needs — text, numbers, choices, dates or free-form notes. No rigid industry template.",
    tone: "cyan" as const,
  },
  {
    icon: QrCode,
    title: "Opaque, secure QR tokens",
    detail:
      "The QR contains only an unguessable reference. Personal data never leaves the server, and each scan is verified against status, time and organization.",
    tone: "teal" as const,
  },
  {
    icon: ScanLine,
    title: "Hardware-free check-in",
    detail:
      "Staff scan with any device camera. Duplicate check-ins are rejected and every attempt is recorded for accountability.",
    tone: "amber" as const,
  },
  {
    icon: BellRing,
    title: "Configurable email reminders",
    detail:
      "Choose reminder offsets per organization. Cancellations and reschedules automatically invalidate pending messages.",
    tone: "coral" as const,
  },
  {
    icon: UsersRound,
    title: "Roles that match real teams",
    detail:
      "Owners, admins, managers and staff each see the tools they need. Branch assignments and audit logs keep operations clear.",
    tone: "violet" as const,
  },
  {
    icon: Building2,
    title: "Multi-branch organizations",
    detail:
      "Run several locations under one brand with shared services or branch-specific schedules and availability.",
    tone: "cyan" as const,
  },
  {
    icon: SlidersHorizontal,
    title: "Policies you control",
    detail:
      "Set booking horizons, cancellation windows, check-in grace periods and token prefixes per organization or service.",
    tone: "teal" as const,
  },
  {
    icon: ChartNoAxesCombined,
    title: "Operational clarity",
    detail:
      "Live queues, utilization, completion rates and exportable audit trails based on actual database activity — not estimates.",
    tone: "amber" as const,
  },
  {
    icon: LockKeyhole,
    title: "Isolation by design",
    detail:
      "Postgres row-level security plus server-side role checks keep every organization's data separate, even on shared infrastructure.",
    tone: "coral" as const,
  },
];

export default function FeaturesPage() {
  return (
    <>
      <InfoHero
        eyebrow="Features"
        title={<>Everything you need to run a calm, modern front desk.</>}
        description="TokenFlow combines scheduling, digital tokens, notifications and operations in one platform — flexible enough for clinics, studios, salons, government offices and any service team."
        actions={
          <>
            <Button asChild size="lg">
              <Link href="/signup">Start free <ArrowRight /></Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/how-it-works">See how it works</Link>
            </Button>
          </>
        }
      />

      <section className="relative pb-24 sm:pb-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <StaggerGroup className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <StaggerItem key={feature.title}>
                <GlowCard glow={feature.tone} interactive className="h-full p-6 sm:p-7">
                  <div
                    className={`grid size-11 place-items-center rounded-xl border ${
                      feature.tone === "violet"
                        ? "border-violet-400/25 bg-violet-500/12 text-violet-200"
                        : feature.tone === "cyan"
                          ? "border-cyan-400/25 bg-cyan-500/12 text-cyan-200"
                          : feature.tone === "teal"
                            ? "border-teal-400/25 bg-teal-500/12 text-emerald-200"
                            : feature.tone === "amber"
                              ? "border-amber-400/25 bg-amber-500/12 text-amber-200"
                              : "border-rose-400/25 bg-rose-500/12 text-rose-200"
                    }`}
                  >
                    <feature.icon className="size-5" />
                  </div>
                  <h2 className="mt-5 text-lg font-bold tracking-tight">{feature.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{feature.detail}</p>
                </GlowCard>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
