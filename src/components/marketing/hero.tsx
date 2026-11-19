"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Play, ShieldCheck, Sparkles, Star } from "lucide-react";
import { HeroVisual } from "@/components/marketing/hero-visual";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-32 sm:pb-24 sm:pt-40 lg:pb-28 lg:pt-44">
      {/* ambient lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="surface-grid absolute inset-0 opacity-70" />
        <div className="absolute -left-40 top-0 size-[540px] animate-aurora rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute -right-32 top-32 size-[460px] animate-aurora rounded-full bg-cyan-500/12 blur-[120px] [animation-delay:-6s]" />
        <div className="absolute bottom-0 left-1/3 size-[380px] animate-aurora rounded-full bg-teal-500/10 blur-[110px] [animation-delay:-11s]" />
        <div className="absolute left-1/2 top-[-200px] h-[420px] w-[820px] -translate-x-1/2 rounded-[50%] bg-violet-500/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[1.02fr_1fr] lg:gap-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="relative z-10 max-w-2xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/[0.08] px-3.5 py-1.5 text-xs font-medium text-violet-100 backdrop-blur"
            >
              <Sparkles className="size-3.5 text-violet-300" />
              The universal appointment platform
              <ArrowRight className="size-3 text-violet-300" />
            </motion.div>

            <h1 className="text-balance mt-7 text-[clamp(2.75rem,6.2vw,5rem)] font-extrabold leading-[1.03] tracking-[-0.045em] text-foreground">
              Every appointment.
              <br />
              <span className="gradient-text">One elegant flow.</span>
            </h1>

            <p className="text-balance mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              TokenFlow gives any organization a beautiful way to publish services,
              book appointments, issue secure QR tokens and keep operations moving —
              all without a single piece of hardware.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="xl" className="group">
                <Link href="/signup">
                  Start for free
                  <ArrowRight className="transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="secondary" className="group">
                <Link href="/how-it-works">
                  <Play className="fill-current" />
                  See how it works
                </Link>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex -space-x-2.5">
                {["from-violet-500 to-indigo-400", "from-cyan-500 to-teal-400", "from-amber-500 to-orange-400", "from-rose-500 to-pink-400"].map(
                  (gradient, i) => (
                    <span
                      key={i}
                      className={`grid size-8 place-items-center rounded-full border-2 border-[#080b18] bg-gradient-to-br ${gradient} text-[10px] font-bold text-white`}
                    >
                      {["AT", "MK", "JL", "SR"][i]}
                    </span>
                  ),
                )}
              </div>
              <div className="text-xs text-muted">
                <div className="flex items-center gap-1 text-amber">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3 fill-current" />
                  ))}
                  <span className="ml-1 font-semibold text-foreground">4.9/5</span>
                </div>
                <p className="mt-1">Trusted by modern service teams</p>
              </div>
              <div className="hidden h-8 w-px bg-white/10 sm:block" />
              <p className="flex items-center gap-1.5 text-xs text-subtle">
                <ShieldCheck className="size-3.5 text-teal-300" />
                Secure by design
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="relative z-0"
          >
            <HeroVisual />
          </motion.div>
        </div>
      </div>

      <div className="relative mx-auto mt-16 flex max-w-7xl items-center gap-4 px-5 sm:px-8">
        <div className="hairline flex-1" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-subtle">
          Built for every service industry
        </p>
        <div className="hairline flex-1" />
      </div>

      <div className="relative mx-auto mt-8 flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-5 px-5 text-sm font-semibold tracking-wide text-subtle/70 sm:px-8">
        {["Professional services", "Clinics & care", "Education", "Finance", "Government", "Retail & hospitality"].map(
          (item) => (
            <span key={item} className="transition-colors hover:text-muted">{item}</span>
          ),
        )}
      </div>
    </section>
  );
}
