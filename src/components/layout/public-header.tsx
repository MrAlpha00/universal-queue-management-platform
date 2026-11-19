"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { publicNav } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function PublicHeader() {
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-4 pt-4 sm:px-6 lg:pt-5">
      <div
        className={cn(
          "mx-auto flex h-15 max-w-7xl items-center justify-between rounded-2xl border px-4 transition-all duration-300 sm:px-5",
          scrolled
            ? "border-white/[0.14] bg-[#0d1426]/85 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
            : "border-white/[0.07] bg-white/[0.025] backdrop-blur-xl",
        )}
      >
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {publicNav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors",
                  active ? "text-foreground" : "text-muted hover:text-foreground",
                )}
              >
                {item.label}
                {active && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute inset-x-3 -bottom-0.5 h-px bg-gradient-to-r from-violet-400 to-cyan-400"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <Button asChild variant="ghost" size="sm" className="text-muted hover:text-foreground">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm" className="group">
            <Link href="/signup">
              Get started
              <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-foreground sm:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="mx-auto mt-2 max-w-7xl overflow-hidden rounded-2xl border border-white/[0.14] bg-[#0f1629]/95 p-3 shadow-2xl backdrop-blur-2xl sm:hidden"
          >
            <nav className="flex flex-col" aria-label="Mobile navigation">
              {publicNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-muted transition hover:bg-white/[0.05] hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
              <div className="my-2 h-px bg-white/[0.08]" />
              <div className="grid grid-cols-2 gap-2 p-2">
                <Button asChild variant="secondary">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Get started</Link>
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
