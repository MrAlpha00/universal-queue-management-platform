import type { ReactNode } from "react";
import { Reveal } from "@/components/animations/reveal";
import { cn } from "@/lib/utils";

export function InfoHero({
  eyebrow,
  title,
  description,
  actions,
  aside,
  align = "left",
}: {
  eyebrow: string;
  title: ReactNode;
  description: string;
  actions?: ReactNode;
  aside?: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <section className="relative overflow-hidden pb-16 pt-10 sm:pb-24 sm:pt-16">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-24 size-72 rounded-full bg-cyan-500/[0.07] blur-[100px]" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div
          className={cn(
            "grid gap-12",
            aside ? "lg:grid-cols-[1.15fr_0.85fr] lg:items-center" : "",
            align === "center" && "text-center",
          )}
        >
          <Reveal className={cn("max-w-3xl", align === "center" && "mx-auto")}>
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-200">
              <span className="size-1.5 rounded-full bg-violet-400" />
              {eyebrow}
            </span>
            <h1 className="mt-6 text-balance text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[56px]">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              {description}
            </p>
            {actions && <div className="mt-8 flex flex-wrap gap-3">{actions}</div>}
          </Reveal>
          {aside && <Reveal delay={0.12}>{aside}</Reveal>}
        </div>
      </div>
    </section>
  );
}
