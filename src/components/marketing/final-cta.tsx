import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/animations/reveal";

export function FinalCta() {
  return (
    <section className="relative px-5 pb-24 sm:px-8 sm:pb-32">
      <Reveal>
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] border border-violet-400/20 bg-gradient-to-br from-[#1a1740] via-[#141b35] to-[#0c1826] px-6 py-16 text-center sm:px-14 sm:py-20">
          <div className="pointer-events-none absolute inset-0 surface-grid opacity-60" />
          <div className="pointer-events-none absolute -left-24 top-0 size-72 rounded-full bg-violet-500/25 blur-[90px]" />
          <div className="pointer-events-none absolute -right-24 bottom-0 size-72 rounded-full bg-cyan-500/20 blur-[90px]" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-400/10 blur-[70px]" />

          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-xs font-medium text-violet-100">
              <Sparkles className="size-3.5" /> Make every visit effortless
            </span>
            <h2 className="text-balance mx-auto mt-7 max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Ready to rethink how your
              <span className="gradient-text"> appointments flow?</span>
            </h2>
            <p className="text-balance mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted">
              Join organizations using TokenFlow to turn scheduling chaos into a calm,
              beautifully orchestrated experience.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="xl" className="group">
                <Link href="/signup">
                  Create your free account
                  <ArrowRight className="transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="secondary">
                <Link href="/contact">Talk to our team</Link>
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
