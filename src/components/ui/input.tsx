"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "flex w-full rounded-xl border border-white/[0.12] bg-white/[0.035] px-3.5 py-2.5 text-sm text-foreground shadow-inner shadow-black/10 outline-none transition-all placeholder:text-subtle hover:border-white/20 focus:border-violet-400/60 focus:bg-violet-500/[0.06] focus:ring-2 focus:ring-violet-500/15 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-rose-400/60 aria-[invalid=true]:ring-rose-500/15";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => (
    <input ref={ref} type={type} className={cn(fieldBase, "h-11", className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(fieldBase, "min-h-28 resize-y", className)} {...props} />
));
Textarea.displayName = "Textarea";

export const SelectNative = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn(fieldBase, "h-11 appearance-none pr-9", className)} {...props}>
    {children}
  </select>
));
SelectNative.displayName = "SelectNative";
