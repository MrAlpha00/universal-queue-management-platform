import Link from "next/link";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { QrPattern } from "@/components/brand/qr-pattern";
import { brand } from "@/config/brand";

const highlights = [
  "Create services and publish availability in minutes",
  "Issue secure, independently expiring QR tokens",
  "Automate confirmations and reminders by email",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="surface-grid absolute inset-0 opacity-50" />
        <div className="absolute -left-40 top-0 size-[520px] rounded-full bg-violet-600/15 blur-[110px]" />
        <div className="absolute -right-32 bottom-0 size-[480px] rounded-full bg-cyan-500/10 blur-[110px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Back to home
          </Link>
        </div>

        <div className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div className="mx-auto w-full max-w-[440px]">{children}</div>

          <div className="relative hidden lg:block">
            <div className="glass-strong relative overflow-hidden rounded-[32px] p-10 shadow-[0_50px_120px_-40px_rgba(0,0,0,0.9)]">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/70 to-transparent" />
              <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200">
                <Sparkles className="size-3" /> {brand.name} workspace
              </span>
              <h2 className="text-balance mt-7 text-4xl font-bold leading-tight tracking-tight">
                The calm way to manage{" "}
                <span className="gradient-text">every appointment.</span>
              </h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">
                One platform for customers, organizations and platform teams — with a token engine
                built for accuracy and designed for people.
              </p>

              <div className="mt-9 space-y-3">
                {highlights.map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-foreground/85">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full border border-teal-400/25 bg-teal-500/12 text-teal-300">
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-10 flex items-center gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <div className="rounded-xl border border-white/10 bg-[#0d1426] p-2">
                  <QrPattern size={72} />
                </div>
                <div>
                  <p className="font-mono text-xl font-bold text-foreground">TK-024</p>
                  <p className="mt-1 text-xs text-muted">Secure QR · verified on arrival</p>
                  <span className="mt-2 inline-block rounded-full bg-teal-500/12 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                    Independent lifecycle
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
