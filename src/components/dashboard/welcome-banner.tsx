import Link from "next/link";
import { ArrowRight, CalendarPlus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WelcomeBanner({ name, hasAppointment }: { name: string; hasAppointment: boolean }) {
  const firstName = name.split(" ")[0] || "there";
  return (
    <div className="relative overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-[#1b1740] via-[#151c36] to-[#0e1829] p-7 sm:p-9">
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-30" />
      <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-violet-500/25 blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-cyan-500/12 blur-[80px]" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200">
            <Sparkles className="size-3" /> Your workspace
          </span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
            Good to see you, <span className="gradient-text">{firstName}</span>.
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
            {hasAppointment
              ? "You have an appointment coming up. Everything you need is right here."
              : "Discover organizations, find a service and book your next appointment in a few clicks."}
          </p>
        </div>
        <Button asChild size="lg" className="group shrink-0">
          <Link href="/organizations">
            <CalendarPlus className="size-4" /> Book an appointment
            <ArrowRight className="transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
