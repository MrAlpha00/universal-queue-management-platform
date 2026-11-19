import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Check,
  Database,
  Fingerprint,
  Globe2,
  Layers3,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UsersRound,
  Workflow,
  Zap,
} from "lucide-react";
import { FinalCta } from "@/components/marketing/final-cta";
import { InfoHero } from "@/components/marketing/info-hero";
import { Reveal } from "@/components/animations/reveal";
import { Button } from "@/components/ui/button";
import { Card, GlowCard } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Platform",
  description:
    "A multi-organization platform with role-based workspaces, row-level security, durable jobs and a hardware-free check-in flow.",
};

const roles = [
  {
    icon: UsersRound,
    title: "Customer workspace",
    tone: "violet" as const,
    points: [
      "Discover approved organizations",
      "Book and reschedule appointments",
      "Access secure QR tickets",
      "Manage profile and preferences",
    ],
  },
  {
    icon: Building2,
    title: "Organization console",
    tone: "cyan" as const,
    points: [
      "Services, fields and schedules",
      "Queue, scanner and status updates",
      "Staff roles and branch access",
      "Analytics, notifications and audit",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Platform governance",
    tone: "amber" as const,
    points: [
      "Approve or suspend organizations",
      "Grant platform administrator access",
      "Review platform-wide activity",
      "Control registration and booking flags",
    ],
  },
];

const pillars = [
  {
    icon: Layers3,
    title: "True multi-tenancy",
    detail:
      "Every row that belongs to an organization carries an org_id. Policies enforce membership before reads or writes, while platform admins use audited, narrowly scoped functions.",
  },
  {
    icon: Zap,
    title: "Transactional booking",
    detail:
      "Availability slots track capacity and booked counts. Booking and rescheduling run in database functions, so simultaneous requests cannot oversell a slot.",
  },
  {
    icon: Fingerprint,
    title: "Opaque token references",
    detail:
      "QR codes carry a random reference, never personal data. Only a SHA-256 hash is persisted. Reissue invalidates the previous credential immediately.",
  },
  {
    icon: Workflow,
    title: "Durable automation",
    detail:
      "Reminders and token expiration are scheduled as durable background jobs with idempotency keys, independent of any open session.",
  },
];

const integrations = [
  {
    icon: Database,
    name: "Supabase",
    detail: "Postgres, Auth and row-level security for every organization.",
  },
  {
    icon: Mail,
    name: "Resend",
    detail: "Transactional email with React templates and delivery logging.",
  },
  {
    icon: Workflow,
    name: "Trigger.dev",
    detail: "Durable reminder schedules and recurring expiration sweeps.",
  },
  {
    icon: Globe2,
    name: "Vercel",
    detail: "Edge-ready Next.js deployment with server-side rendering.",
  },
];

export default function PlatformCapabilitiesPage() {
  return (
    <>
      <InfoHero
        eyebrow="Platform"
        title={<>One multi-tenant foundation. Three focused workspaces.</>}
        description="TokenFlow is designed as a platform: organizations shape their own services and policies while the platform team governs access, quality and safety."
        actions={
          <>
            <Button asChild size="lg">
              <Link href="/signup">Create an organization <ArrowRight /></Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/docs">Read the documentation</Link>
            </Button>
          </>
        }
      />

      <section className="relative pb-24 sm:pb-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <SectionHeading
              eyebrow="Workspaces"
              title={<>The right tools for every role.</>}
              description="Each workspace has its own navigation, permissions and visual accent, backed by one shared data model."
            />
          </Reveal>
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {roles.map((role, index) => (
              <Reveal key={role.title} delay={index * 0.07}>
                <GlowCard glow={role.tone} className="h-full p-6">
                  <div
                    className={`grid size-11 place-items-center rounded-xl border ${
                      role.tone === "violet"
                        ? "border-violet-400/25 bg-violet-500/12 text-violet-200"
                        : role.tone === "cyan"
                          ? "border-cyan-400/25 bg-cyan-500/12 text-cyan-200"
                          : "border-amber-400/25 bg-amber-500/12 text-amber-200"
                    }`}
                  >
                    <role.icon className="size-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold">{role.title}</h3>
                  <ul className="mt-4 space-y-2.5">
                    {role.points.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-sm text-muted">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-teal-300" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </GlowCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-white/[0.06] bg-white/[0.015] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <SectionHeading
              eyebrow="Architecture"
              title={<>Built for correctness, not just convenience.</>}
              description="Security and consistency are enforced closest to the data, where they cannot be bypassed by a UI bug."
            />
          </Reveal>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {pillars.map((pillar, index) => (
              <Reveal key={pillar.title} delay={index * 0.06}>
                <Card className="flex h-full gap-4 p-6">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-violet-200">
                    <pillar.icon className="size-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">{pillar.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{pillar.detail}</p>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <Reveal>
              <SectionHeading
                eyebrow="Integrations"
                title={<>Focused stack. No unnecessary moving parts.</>}
                description="TokenFlow uses proven infrastructure so your team can reason about reliability, cost and security."
              />
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-teal-400/20 bg-teal-500/[0.06] p-4">
                <LockKeyhole className="mt-0.5 size-4 shrink-0 text-teal-300" />
                <p className="text-xs leading-relaxed text-teal-100/80">
                  Secrets stay server-side. Public clients only receive the Supabase publishable key;
                  service-role access is restricted to trusted server modules.
                </p>
              </div>
            </Reveal>
            <div className="grid gap-3 sm:grid-cols-2">
              {integrations.map((integration, index) => (
                <Reveal key={integration.name} delay={index * 0.05}>
                  <Card className="h-full p-5">
                    <integration.icon className="size-5 text-cyan-300" />
                    <h3 className="mt-4 text-sm font-bold">{integration.name}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted">{integration.detail}</p>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
