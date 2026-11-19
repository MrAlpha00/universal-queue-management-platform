import * as React from "react";
import { STATUS_STYLES, type AppointmentStatus, type OrganizationStatus } from "@/config/constants";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "neutral",
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "violet" | "cyan" | "teal" | "coral" | "amber";
}) {
  const tones = {
    neutral: "border-white/12 bg-white/[0.06] text-muted",
    violet: "border-violet-400/25 bg-violet-500/12 text-violet-200",
    cyan: "border-cyan-400/25 bg-cyan-500/12 text-cyan-200",
    teal: "border-emerald-400/25 bg-emerald-500/12 text-emerald-200",
    coral: "border-rose-400/25 bg-rose-500/12 text-rose-200",
    amber: "border-amber-400/25 bg-amber-500/12 text-amber-200",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatusBadge({
  status,
  showDot = true,
}: {
  status: AppointmentStatus | OrganizationStatus;
  showDot?: boolean;
}) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.BOOKED;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        style.tone,
      )}
    >
      {showDot && <span className={cn("size-1.5 rounded-full", style.dot)} />}
      {style.label}
    </span>
  );
}
