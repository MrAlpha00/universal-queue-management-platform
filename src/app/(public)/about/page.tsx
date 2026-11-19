import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Compass,
  HeartHandshake,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { FinalCta } from "@/components/marketing/final-cta";
import { InfoHero } from "@/components/marketing/info-hero";
import { Reveal } from "@/components/animations/reveal";
import { brand } from "@/config/brand";
import { Button } from "@/components/ui/button";
import { Card, GlowCard } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why TokenFlow exists, the principles behind the platform, and how we handle privacy, terms and service status.",
};

const values = [
  {
    icon: Compass,
    title: "Clarity over cleverness",
    detail:
      "Scheduling is stressful enough. Every screen should answer one question and make the next action obvious.",
  },
  {
    icon: ShieldCheck,
    title: "Security is a feature",
    detail:
      "Organization isolation, opaque tokens and audited actions are part of the product — not an afterthought.",
  },
  {
    icon: HeartHandshake,
    title: "Respect for operators",
    detail:
      "Front-desk teams are not a database. Their tools should be fast, forgiving and honest about state.",
  },
  {
    icon: Sparkles,
    title: "No industry lock-in",
    detail:
      "A clinic, a salon and a municipal office should all be able to shape the same platform around their workflow.",
  },
];

export default function AboutPage() {
  return (
    <>
      <InfoHero
        eyebrow="About"
        title={<>Software for the people who keep appointments moving.</>}
        description={`${brand.name} started from a simple observation: most scheduling tools assume one industry, one branch and one way of working. We built a platform that adapts instead.`}
        actions={
          <>
            <Button asChild size="lg">
              <Link href="/signup">Get started <ArrowRight /></Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/contact">Contact us</Link>
            </Button>
          </>
        }
        aside={
          <Card className="relative overflow-hidden p-6">
            <div className="pointer-events-none absolute -left-12 -top-12 size-40 rounded-full bg-violet-500/20 blur-3xl" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-300">At a glance</p>
            <dl className="mt-5 space-y-4">
              {[
                { label: "Product", value: brand.name },
                { label: "Focus", value: "Appointments & digital tokens" },
                { label: "Model", value: "Multi-organization SaaS" },
                { label: "Hardware", value: "None required" },
                { label: "Version", value: brand.version },
              ].map((item) => (
                <div key={item.label} className="flex items-baseline justify-between gap-4 border-b border-white/[0.06] pb-3 last:border-0 last:pb-0">
                  <dt className="text-xs text-subtle">{item.label}</dt>
                  <dd className="text-right text-xs font-semibold">{item.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        }
      />

      <section className="relative pb-24 sm:pb-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <SectionHeading
              eyebrow="Principles"
              title={<>What we optimize for.</>}
              description="These principles guide product decisions, database design and the way we write documentation."
            />
          </Reveal>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {values.map((value, index) => (
              <Reveal key={value.title} delay={index * 0.06}>
                <GlowCard glow={index % 2 === 0 ? "violet" : "cyan"} className="h-full p-6">
                  <div className="grid size-10 place-items-center rounded-xl border border-white/[0.1] bg-white/[0.04] text-violet-200">
                    <value.icon className="size-5" />
                  </div>
                  <h3 className="mt-4 text-base font-bold">{value.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{value.detail}</p>
                </GlowCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative border-y border-white/[0.06] bg-white/[0.015] py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <Reveal>
            <SectionHeading
              eyebrow="Trust"
              title={<>Status, privacy and terms in plain language.</>}
              description="The details below describe how the platform is operated today. For contractual or data-processing questions, contact us directly."
            />
          </Reveal>

          <div className="mt-12 space-y-4">
            <Reveal>
              <Card id="status" className="scroll-mt-28 p-6 sm:p-8">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <ShieldCheck className="size-5 text-teal-300" /> Service status
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  TokenFlow runs on managed application and database infrastructure with health
                  checks, structured logs and error tracking. Booking, authentication and email
                  delivery are monitored independently. During a dependency incident, the
                  management console remains available wherever possible so teams can still view
                  appointments and queue state.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  For a current status update or a suspected outage, email{" "}
                  <a className="text-cyan-300 hover:text-cyan-200" href={`mailto:${brand.supportEmail}`}>
                    {brand.supportEmail}
                  </a>
                  .
                </p>
              </Card>
            </Reveal>

            <Reveal>
              <Card id="privacy" className="scroll-mt-28 p-6 sm:p-8">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <LockKeyhole className="size-5 text-violet-300" /> Privacy
                </h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
                  <p>
                    We collect the account information you provide, the appointments you create and
                    the operational records needed to run the service. Organization data is isolated
                    with row-level security and only accessible to authorized members of that
                    organization and, where necessary, platform administrators performing support or
                    governance tasks.
                  </p>
                  <p>
                    QR codes contain an opaque reference rather than personal data. References are
                    stored as hashes and can be revoked or reissued at any time. Email delivery is
                    handled by a transactional email provider, and background jobs process only the
                    data required to send reminders or expire stale tokens.
                  </p>
                  <p>
                    You can request access, correction or deletion of your personal data by emailing{" "}
                    <a className="text-cyan-300 hover:text-cyan-200" href={`mailto:${brand.supportEmail}`}>
                      {brand.supportEmail}
                    </a>
                    . Organization owners are responsible for the lawful basis of the data they
                    collect from their customers.
                  </p>
                </div>
              </Card>
            </Reveal>

            <Reveal>
              <Card id="terms" className="scroll-mt-28 p-6 sm:p-8">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <Mail className="size-5 text-cyan-300" /> Terms
                </h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
                  <p>
                    Use TokenFlow only for lawful appointment and queue management. Organizations are
                    responsible for the accuracy of their services, availability and customer
                    communications, and for maintaining the security of their team accounts.
                  </p>
                  <p>
                    The platform may suspend an organization that abuses the service, misrepresents
                    availability or creates risk for customers. Availability targets, data retention
                    and commercial terms are defined in the agreement signed with each organization.
                  </p>
                  <p>
                    Questions about these terms can be sent to{" "}
                    <a className="text-cyan-300 hover:text-cyan-200" href={`mailto:${brand.supportEmail}`}>
                      {brand.supportEmail}
                    </a>
                    .
                  </p>
                </div>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
