"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow-[0_8px_30px_-10px_rgba(139,92,246,0.8)] hover:shadow-[0_12px_36px_-8px_rgba(139,92,246,0.95)] hover:-translate-y-0.5 active:translate-y-0",
        primary:
          "bg-violet-500 text-white hover:bg-violet-400 shadow-[0_8px_24px_-12px_rgba(139,92,246,0.9)]",
        cyan: "bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-[0_8px_30px_-12px_rgba(34,211,238,0.8)] hover:-translate-y-0.5",
        secondary:
          "border border-white/10 bg-white/[0.06] text-foreground backdrop-blur hover:border-white/20 hover:bg-white/[0.1]",
        outline:
          "border border-violet-400/35 bg-violet-500/[0.06] text-violet-100 hover:bg-violet-500/[0.14] hover:border-violet-300/50",
        ghost: "text-muted hover:bg-white/[0.06] hover:text-foreground",
        destructive:
          "bg-rose-500/15 text-rose-200 border border-rose-400/25 hover:bg-rose-500/25",
        link: "text-cyan-300 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-2xl px-7 text-[15px]",
        xl: "h-14 rounded-2xl px-9 text-base",
        icon: "size-10",
        "icon-sm": "size-8 rounded-lg",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" aria-hidden />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
