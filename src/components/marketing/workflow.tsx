"use client";

import * as React from "react";
import { motion, useInView } from "motion/react";
import { ArrowRight } from "lucide-react";
import { workflowSteps } from "@/config/navigation";
import { SectionHeading } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

export function Workflow() {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="how-it-works" className="relative overflow-hidden py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="How it works"
          title={<>From discovery to check-in<br /><span className="text-muted">in six effortless steps.</span></>}
          description="A clear journey for your customers and a calm, predictable workflow for your team."
          align="center"
        />

        <div ref={ref} className="relative mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 26 }}
                animate={inView ? { opacity: 1, y: 0 } : undefined}
                transition={{ duration: 0.5, delay: index * 0.09 }}
                className="group relative rounded-2xl border border-white/[0.08] bg-surface/50 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/30 hover:bg-surface/80"
              >
                <div className="flex items-start justify-between">
                  <div className="relative grid size-12 place-items-center rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/15 to-cyan-500/10 text-violet-200 transition-transform group-hover:scale-105">
                    <Icon className="size-5" />
                  </div>
                  <span className="font-mono text-xs text-subtle">{step.number}</span>
                </div>
                <h3 className="mt-6 text-lg font-bold tracking-tight">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.detail}</p>
                {index < workflowSteps.length - 1 && (
                  <ArrowRight className="absolute -right-2.5 top-1/2 hidden size-4 -translate-y-1/2 text-violet-400/40 lg:block" />
                )}
                <div className={cn(
                  "absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100",
                )} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
