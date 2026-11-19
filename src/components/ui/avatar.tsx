"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { initials } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function Avatar({
  name,
  email,
  src,
  className,
}: {
  name?: string | null;
  email?: string | null;
  src?: string | null;
  className?: string;
}) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border border-white/[0.12] bg-gradient-to-br from-violet-500/40 to-cyan-500/25 text-xs font-bold text-white",
        className,
      )}
    >
      <AvatarPrimitive.Image src={src ?? undefined} alt={name ?? "Avatar"} className="size-full object-cover" />
      <AvatarPrimitive.Fallback delayMs={300}>
        {initials(name, email)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
