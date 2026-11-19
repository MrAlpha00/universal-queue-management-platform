import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "violet",
  hint,
  trend,
  className,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "violet" | "cyan" | "teal" | "coral" | "amber";
  hint?: string;
  trend?: string;
  className?: string;
}) {
  const tones = {
    violet: { icon: "text-violet-300 bg-violet-500/12 border-violet-400/20", bar: "from-violet-500 to-indigo-400" },
    cyan: { icon: "text-cyan-300 bg-cyan-500/12 border-cyan-400/20", bar: "from-cyan-500 to-sky-400" },
    teal: { icon: "text-emerald-300 bg-emerald-500/12 border-emerald-400/20", bar: "from-emerald-500 to-teal-400" },
    coral: { icon: "text-rose-300 bg-rose-500/12 border-rose-400/20", bar: "from-rose-500 to-orange-400" },
    amber: { icon: "text-amber-300 bg-amber-500/12 border-amber-400/20", bar: "from-amber-500 to-orange-400" },
  } as const;
  const t = tones[tone];
  return (
    <Card className={cn("group relative overflow-hidden p-5", className)}>
      <div className={cn("absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r opacity-80", t.bar)} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium tracking-wide text-muted">{label}</p>
          <p className="mt-2 text-[28px] font-bold leading-none tracking-tight text-foreground tabular-nums">
            {value}
          </p>
        </div>
        <div className={cn("grid size-10 shrink-0 place-items-center rounded-xl border", t.icon)}>
          <Icon className="size-4.5" />
        </div>
      </div>
      {(hint || trend) && (
        <div className="mt-3 flex items-center gap-2 text-[11px] text-subtle">
          {trend && <span className="font-semibold text-teal-300">{trend}</span>}
          {hint && <span className="truncate">{hint}</span>}
        </div>
      )}
      <div className={cn("absolute -bottom-12 -right-12 size-28 rounded-full bg-gradient-to-br opacity-[0.07] blur-2xl transition-opacity group-hover:opacity-15", t.bar)} />
    </Card>
  );
}
