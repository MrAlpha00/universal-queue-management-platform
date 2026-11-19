import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Database, LockKeyhole, Rocket, ShieldCheck, Terminal } from "lucide-react";
import { FinalCta } from "@/components/marketing/final-cta";
import { InfoHero } from "@/components/marketing/info-hero";
import { Reveal } from "@/components/animations/reveal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Set up TokenFlow locally, understand the data model and booking lifecycle, and deploy to Vercel with Supabase, Resend and Trigger.dev.",
};

const sections = [
  { id: "quickstart", label: "Quickstart", icon: Terminal },
  { id: "environment", label: "Environment", icon: LockKeyhole },
  { id: "database", label: "Database & RLS", icon: Database },
  { id: "lifecycle", label: "Booking lifecycle", icon: BookOpen },
  { id: "security", label: "Security model", icon: ShieldCheck },
  { id: "deployment", label: "Deployment", icon: Rocket },
];

function Code({ children }: { children: string }) {
  return (
    <pre className="mt-4 overflow-x-auto rounded-xl border border-white/[0.08] bg-[#050711] p-4 text-[12px] leading-relaxed text-muted">
      <code>{children}</code>
    </pre>
  );
}

export default function DocsPage() {
  return (
    <>
      <InfoHero
        eyebrow="Documentation"
        title={<>Everything needed to run TokenFlow with confidence.</>}
        description="A practical guide to local setup, the data model, security boundaries and production deployment. The same material ships as Markdown in the repository."
        actions={
          <>
            <Button asChild size="lg">
              <Link href="/signup">Create an account <ArrowRight /></Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/contact">Ask a question</Link>
            </Button>
          </>
        }
      />

      <section className="relative pb-24 sm:pb-32">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[220px_1fr]">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-subtle">On this page</p>
            <nav className="mt-4 space-y-1">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-white/[0.04] hover:text-foreground"
                >
                  <section.icon className="size-4 text-violet-300" />
                  {section.label}
                </a>
              ))}
            </nav>
          </aside>

          <div className="min-w-0 space-y-5">
            <Reveal>
              <Card id="quickstart" className="scroll-mt-28 p-6 sm:p-8">
                <h2 className="text-xl font-bold">Quickstart</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  TokenFlow is a Next.js App Router application. Use Node.js 24 and pnpm 12. Install
                  dependencies, copy the environment template and start the dev server.
                </p>
                <Code>{`corepack enable
corepack pnpm install
cp .env.example .env.local
corepack pnpm dev`}</Code>
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  Without Supabase configuration, protected routes render a setup notice instead of
                  failing silently. The marketing site and documentation remain available.
                </p>
              </Card>
            </Reveal>

            <Reveal>
              <Card id="environment" className="scroll-mt-28 p-6 sm:p-8">
                <h2 className="text-xl font-bold">Environment</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Public values use the <code className="text-cyan-200">NEXT_PUBLIC_</code> prefix. The
                  service-role key, Resend key, Trigger.dev key and QR signing secret must never be
                  exposed to the browser.
                </p>
                <Code>{`NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
TRIGGER_SECRET_KEY=
QR_SIGNING_SECRET=
NEXT_PUBLIC_APP_URL=`}</Code>
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  Generate the signing secret with{" "}
                  <code className="text-cyan-200">openssl rand -base64 48</code>. Configure the
                  Supabase redirect URLs for <code className="text-cyan-200">/auth/callback</code> and
                  verify your sending domain in Resend before enabling reminders.
                </p>
              </Card>
            </Reveal>

            <Reveal>
              <Card id="database" className="scroll-mt-28 p-6 sm:p-8">
                <h2 className="text-xl font-bold">Database & row-level security</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Apply the migrations in order with the Supabase CLI. They create the schema,
                  indexes, functions, policies and privileges.
                </p>
                <Code>{`supabase link --project-ref <your-project-ref>
supabase db push`}</Code>
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
                  <p>
                    <strong className="text-foreground">0001_schema.sql</strong> — profiles,
                    organizations, branches, services, fields, schedules, slots, appointments,
                    tokens, QR credentials, check-ins, reminders, notifications, audit logs and
                    platform settings.
                  </p>
                  <p>
                    <strong className="text-foreground">0002_functions.sql</strong> — slot generation,
                    atomic booking, reschedule, cancellation, QR issuance and verification,
                    check-in and expiration.
                  </p>
                  <p>
                    <strong className="text-foreground">0003_rls.sql</strong> — enables RLS, grants
                    least-privilege access and scopes every organization-owned table.
                  </p>
                  <p>
                    <strong className="text-foreground">0004–0005</strong> — management and platform
                    console functions, including organization approval and platform settings.
                  </p>
                </div>
              </Card>
            </Reveal>

            <Reveal>
              <Card id="lifecycle" className="scroll-mt-28 p-6 sm:p-8">
                <h2 className="text-xl font-bold">Booking lifecycle</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Availability is generated lazily from working hours for the requested date range.
                  Booking reserves capacity inside a database transaction and issues a token in the
                  same operation.
                </p>
                <Code>{`BOOKED → CHECKED_IN → IN_PROGRESS → COMPLETED
   ↓          ↓              ↓
CANCELLED  NO_SHOW        EXPIRED`}</Code>
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
                  <p>
                    Rescheduling moves a booking to a new slot and marks the previous state as
                    RESCHEDULED. Cancellation releases capacity and cancels pending reminders. The
                    first valid QR scan moves a booking to CHECKED_IN; later scans are reported as
                    duplicates rather than changing state.
                  </p>
                  <p>
                    The default booking horizon is three calendar days in the organization timezone.
                    Organizations and services can override it. Reminder offsets are configurable and
                    are scheduled as durable jobs with idempotency keys.
                  </p>
                </div>
              </Card>
            </Reveal>

            <Reveal>
              <Card id="security" className="scroll-mt-28 p-6 sm:p-8">
                <h2 className="text-xl font-bold">Security model</h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
                  <p>
                    Every organization-owned row carries an <code className="text-cyan-200">org_id</code>.
                    Policies use membership helpers to authorize reads and writes. Booking and token
                    mutations are exposed only through SECURITY DEFINER functions that validate the
                    caller, the state transition and the organization boundary.
                  </p>
                  <p>
                    QR references are random, opaque and stored as SHA-256 hashes. Reissuing a ticket
                    revokes the previous credential. The QR never contains a name, email or
                    appointment ID.
                  </p>
                  <p>
                    Platform administrators access sensitive operations through audited RPCs rather
                    than broad table policies. Service-role credentials are used only in trusted
                    server modules for email delivery, background jobs and privileged lookups.
                  </p>
                </div>
              </Card>
            </Reveal>

            <Reveal>
              <Card id="deployment" className="scroll-mt-28 p-6 sm:p-8">
                <h2 className="text-xl font-bold">Deployment</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Import the repository into Vercel, set the environment variables for Production and
                  Preview, and deploy. Run migrations against the production Supabase project before
                  the first deploy.
                </p>
                <Code>{`corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
corepack pnpm build
corepack pnpm trigger:deploy`}</Code>
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  Trigger.dev hosts the reminder and expiration jobs. Configure the project, set the
                  secret key in Vercel and in Trigger.dev, then deploy the tasks. Set{" "}
                  <code className="text-cyan-200">NEXT_PUBLIC_APP_URL</code> to the production domain so
                  email links resolve correctly.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {["Supabase migrations", "Resend domain", "Trigger.dev tasks", "Vercel env vars"].map((item) => (
                    <span key={item} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-muted">
                      {item}
                    </span>
                  ))}
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
