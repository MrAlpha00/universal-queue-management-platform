import Link from "next/link";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-[11px] bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-400 shadow-[0_6px_20px_-6px_rgba(139,92,246,0.9)]",
        className,
      )}
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.45),transparent_55%)]" />
      <svg viewBox="0 0 24 24" className="relative size-5" fill="none" aria-hidden>
        <path d="M5 7.5 12 3.5l7 4v9L12 20.5l-7-4v-9Z" stroke="white" strokeWidth="1.4" strokeLinejoin="round" opacity=".85" />
        <path d="m8.5 12 2.2 2.2 4.8-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function Logo({
  className,
  href = "/",
  showTagline = false,
}: {
  className?: string;
  href?: string;
  showTagline?: boolean;
}) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)} aria-label={`${brand.name} home`}>
      <BrandMark className="transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-105" />
      <span className="flex flex-col leading-none">
        <span className="text-[17px] font-extrabold tracking-tight text-foreground">
          {brand.name}
        </span>
        {showTagline && <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.16em] text-subtle">Token management</span>}
      </span>
    </Link>
  );
}
