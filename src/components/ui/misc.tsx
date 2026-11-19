import * as React from "react";
import { cn } from "@/lib/utils";

export function Separator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div role="separator" className={cn("h-px w-full bg-white/[0.08]", className)} {...props} />;
}

export function Progress({
  value,
  className,
  tone = "violet",
}: {
  value: number;
  className?: string;
  tone?: "violet" | "cyan" | "teal" | "amber";
}) {
  const tones = {
    violet: "from-violet-500 to-indigo-400",
    cyan: "from-cyan-500 to-sky-400",
    teal: "from-emerald-500 to-teal-400",
    amber: "from-amber-500 to-orange-400",
  } as const;
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]", className)}>
      <div
        className={cn("h-full rounded-full bg-gradient-to-r transition-[width] duration-700", tones[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="space-y-1.5">
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-300">{eyebrow}</p>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">{title}</h1>
        {description && <p className="max-w-2xl text-sm leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("max-w-2xl space-y-3", align === "center" && "mx-auto text-center")}>
      {eyebrow && (
        <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-200">
          <span className="size-1.5 rounded-full bg-violet-400" />
          {eyebrow}
        </span>
      )}
      <h2 className="text-balance text-3xl font-bold leading-[1.15] tracking-tight text-foreground sm:text-4xl lg:text-[42px]">
        {title}
      </h2>
      {description && <p className="text-balance text-base leading-relaxed text-muted">{description}</p>}
    </div>
  );
}
