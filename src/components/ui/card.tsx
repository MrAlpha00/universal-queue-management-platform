import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  interactive,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.09] bg-surface/70 shadow-[0_20px_60px_-35px_rgba(0,0,0,0.9)] backdrop-blur-sm",
        interactive &&
          "transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/30 hover:shadow-[0_26px_70px_-30px_rgba(139,92,246,0.4)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 p-5 pb-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-base font-semibold tracking-tight text-foreground", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm leading-relaxed text-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center gap-3 p-5 pt-0", className)} {...props} />;
}

/** A card with a bright gradient hairline along the top edge. */
export function GlowCard({
  className,
  glow = "violet",
  interactive,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  glow?: "violet" | "cyan" | "teal" | "coral" | "amber";
  interactive?: boolean;
}) {
  const glows = {
    violet: "from-violet-500/80 via-indigo-400/30 to-transparent",
    cyan: "from-cyan-400/80 via-sky-400/30 to-transparent",
    teal: "from-emerald-400/80 via-teal-400/30 to-transparent",
    coral: "from-rose-400/80 via-orange-400/30 to-transparent",
    amber: "from-amber-400/80 via-yellow-400/30 to-transparent",
  } as const;
  return (
    <Card className={cn("relative overflow-hidden", className)} interactive={interactive} {...props}>
      <div className={cn("absolute inset-x-0 top-0 h-px bg-gradient-to-r", glows[glow])} />
      {children}
    </Card>
  );
}
