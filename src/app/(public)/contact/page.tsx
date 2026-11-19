import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Building2,
  Clock3,
  Mail,
  MessageSquare,
  ShieldQuestion,
  UsersRound,
} from "lucide-react";
import { InfoHero } from "@/components/marketing/info-hero";
import { Reveal } from "@/components/animations/reveal";
import { brand } from "@/config/brand";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Talk to the TokenFlow team about onboarding, platform administration, security or technical support.",
};

const channels = [
  {
    icon: Building2,
    title: "Organization onboarding",
    detail: "Approval, service configuration, staff roles and launch planning.",
    subject: "Organization onboarding",
  },
  {
    icon: ShieldQuestion,
    title: "Security & privacy",
    detail: "Data-processing questions, access requests and incident reports.",
    subject: "Security and privacy",
  },
  {
    icon: UsersRound,
    title: "Platform administration",
    detail: "Platform access, organization governance and operational questions.",
    subject: "Platform administration",
  },
];

const faqs = [
  {
    question: "Do I need any hardware?",
    answer:
      "No. Staff check customers in with a browser and any device camera. Printed QR codes are optional.",
  },
  {
    question: "How long does organization approval take?",
    answer:
      "New organizations enter a review queue. The platform team verifies the listing before it appears in customer discovery.",
  },
  {
    question: "Can I use TokenFlow for multiple branches?",
    answer:
      "Yes. Branches can share organization services or define their own schedules and availability.",
  },
  {
    question: "What happens to my data if I leave?",
    answer:
      "Organization owners can request an export or deletion. Retention and contractual details are confirmed in writing.",
  },
];

export default function ContactPage() {
  const mailto = `mailto:${brand.supportEmail}?subject=${encodeURIComponent("TokenFlow enquiry")}`;
  const demo = `mailto:${brand.supportEmail}?subject=${encodeURIComponent("TokenFlow walkthrough request")}`;

  return (
    <>
      <InfoHero
        eyebrow="Contact"
        title={<>Tell us what you are trying to run.</>}
        description="We answer questions about onboarding, security and platform operations directly. There is no ticket maze and no chatbot loop."
        actions={
          <>
            <Button asChild size="lg">
              <a href={mailto}>Email the team <ArrowRight /></a>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <a href={demo}>Request a walkthrough</a>
            </Button>
          </>
        }
        aside={
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-xl border border-cyan-400/25 bg-cyan-500/10 text-cyan-200">
                <Mail className="size-5" />
              </div>
              <div>
                <p className="text-xs text-subtle">Support email</p>
                <a href={mailto} className="text-sm font-semibold text-foreground hover:text-cyan-200">
                  {brand.supportEmail}
                </a>
              </div>
            </div>
            <div className="mt-5 space-y-3 border-t border-white/[0.07] pt-5 text-xs text-muted">
              <p className="flex items-center gap-2"><Clock3 className="size-3.5 text-violet-300" /> Replies within one business day</p>
              <p className="flex items-center gap-2"><ShieldQuestion className="size-3.5 text-violet-300" /> Security reports are prioritized</p>
              <p className="flex items-center gap-2"><MessageSquare className="size-3.5 text-violet-300" /> Include your organization slug when relevant</p>
            </div>
          </Card>
        }
      />

      <section className="relative pb-24 sm:pb-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <SectionHeading
              eyebrow="Where to start"
              title={<>Pick the path that matches your question.</>}
              description="A focused subject line helps us route your message to the right person."
            />
          </Reveal>
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {channels.map((channel, index) => (
              <Reveal key={channel.title} delay={index * 0.06}>
                <Card className="flex h-full flex-col p-6">
                  <div className="grid size-10 place-items-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-violet-200">
                    <channel.icon className="size-5" />
                  </div>
                  <h3 className="mt-4 text-base font-bold">{channel.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{channel.detail}</p>
                  <Button asChild variant="ghost" size="sm" className="mt-4 self-start px-0">
                    <a href={`mailto:${brand.supportEmail}?subject=${encodeURIComponent(channel.subject)}`}>
                      Start an email <ArrowRight className="size-3.5" />
                    </a>
                  </Button>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative border-y border-white/[0.06] bg-white/[0.015] py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <Reveal>
              <SectionHeading
                eyebrow="FAQ"
                title={<>Quick answers before you write.</>}
                description="Still unsure? Send the question anyway — we would rather over-explain than guess."
              />
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.06] p-4">
                <BookOpen className="mt-0.5 size-4 shrink-0 text-cyan-300" />
                <div className="text-xs leading-relaxed text-cyan-100/80">
                  <p className="font-semibold text-cyan-100">Looking for technical detail?</p>
                  <p className="mt-1">
                    The <Link href="/docs" className="underline hover:text-white">documentation</Link> covers
                    setup, data model, security and deployment.
                  </p>
                </div>
              </div>
            </Reveal>
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <Reveal key={faq.question} delay={index * 0.05}>
                  <details className="group rounded-2xl border border-white/[0.08] bg-surface/50 p-5 open:border-violet-400/25">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold">
                      {faq.question}
                      <span className="text-lg leading-none text-subtle transition group-open:rotate-45">+</span>
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{faq.answer}</p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-20">
        <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
          <Reveal>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-300">Prefer to explore first?</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Create a free account and see the workspace for yourself.
            </h2>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg"><Link href="/signup">Create your account</Link></Button>
              <Button asChild size="lg" variant="secondary"><Link href="/how-it-works">See the workflow</Link></Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
