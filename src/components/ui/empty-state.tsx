import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/[0.14] bg-white/[0.015] px-6 py-14 text-center",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-30" />
      <div className="relative mb-5 grid size-14 place-items-center rounded-2xl border border-violet-400/25 bg-violet-500/10 text-violet-300 shadow-[0_0_40px_-12px_rgba(139,92,246,0.8)]">
        <Icon className="size-6" />
      </div>
      <h3 className="relative text-base font-semibold text-foreground">{title}</h3>
      <p className="relative mt-2 max-w-sm text-sm leading-relaxed text-muted">{description}</p>
      {action && <div className="relative mt-6">{action}</div>}
    </div>
  );
}
