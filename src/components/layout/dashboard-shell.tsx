"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Bell, ChevronDown, LogOut, Menu, Search, Settings2, X } from "lucide-react";
import { BrandMark, Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

export type ShellUser = {
  name: string;
  email: string;
  avatarUrl?: string | null;
};

export function DashboardShell({
  nav,
  user,
  children,
  workspaceLabel,
  workspaceHref = "/dashboard",
  accent = "violet",
  topbarActions,
}: {
  nav: NavItem[];
  user: ShellUser;
  children: React.ReactNode;
  workspaceLabel: string;
  workspaceHref?: string;
  accent?: "violet" | "cyan" | "amber";
  topbarActions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => setMobileOpen(false), [pathname]);

  const filtered = nav.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase().trim()),
  );
  const activeItem =
    [...nav]
      .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0] ?? nav[0];

  const accents = {
    violet: "from-violet-500 to-indigo-400",
    cyan: "from-cyan-500 to-sky-400",
    amber: "from-amber-500 to-orange-400",
  } as const;

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-[72px] shrink-0 items-center gap-3 border-b border-white/[0.07] px-5">
        <Link href={workspaceHref} className="flex min-w-0 items-center gap-2.5">
          <BrandMark className="size-8" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-foreground">TokenFlow</span>
            <span className="block truncate text-[10px] text-subtle">{workspaceLabel}</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="ml-auto grid size-8 place-items-center rounded-lg text-subtle hover:bg-white/5 lg:hidden"
          aria-label="Close navigation"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="px-4 pt-5">
        <div className="flex h-9 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3">
          <Search className="size-3.5 shrink-0 text-subtle" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a page…"
            className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-subtle"
            aria-label="Filter navigation"
          />
        </div>
      </div>

      <nav className="mt-5 flex-1 space-y-1 overflow-y-auto px-3 pb-6" aria-label="Workspace navigation">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-subtle">
          Workspace
        </p>
        {filtered.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all",
                active
                  ? "bg-white/[0.07] text-foreground"
                  : "text-muted hover:bg-white/[0.035] hover:text-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className={cn(
                    "absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-gradient-to-b",
                    accents[accent],
                  )}
                />
              )}
              <Icon className={cn("size-4 shrink-0", active ? "text-violet-300" : "text-subtle group-hover:text-muted")} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-subtle">No matching pages</p>
        )}
      </nav>

      <div className="border-t border-white/[0.07] p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/[0.05]"
            >
              <Avatar name={user.name} email={user.email} src={user.avatarUrl} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-foreground">{user.name}</span>
                <span className="block truncate text-[10px] text-subtle">{user.email}</span>
              </span>
              <ChevronDown className="size-3.5 text-subtle" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-60">
            <DropdownMenuLabel>Signed in as</DropdownMenuLabel>
            <div className="px-3 py-1.5 text-xs text-muted">{user.email}</div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile"><Settings2 className="size-4" /> My profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings"><Settings2 className="size-4" /> Preferences</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action="/auth/sign-out" method="post">
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full text-rose-200">
                  <LogOut className="size-4" /> Log out
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] border-r border-white/[0.07] bg-[#0b1120]/90 backdrop-blur-xl lg:block">
        {sidebar}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-[#050711]/75 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-white/10 bg-[#0b1120] lg:hidden"
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center gap-3 border-b border-white/[0.07] bg-[#080b18]/85 px-4 backdrop-blur-xl sm:px-7">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-muted lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="size-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-subtle">
              {workspaceLabel}
            </p>
            <h1 className="truncate text-sm font-semibold text-foreground sm:text-base">
              {activeItem?.label ?? "Overview"}
            </h1>
          </div>
          {topbarActions}
          <Link
            href="/settings"
            className="relative grid size-9 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-muted transition hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
            <span className="absolute right-2 top-2 size-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
          </Link>
          <Avatar name={user.name} email={user.email} src={user.avatarUrl} className="hidden sm:grid" />
        </header>

        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32 }}
          className="mx-auto w-full max-w-[1500px] px-4 py-7 sm:px-7 sm:py-9"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}

export function SetupRequired({ area }: { area: string }) {
  return (
    <div className="mx-auto max-w-xl py-20 text-center">
      <Logo className="justify-center" />
      <h2 className="mt-8 text-2xl font-bold">Connect Supabase to open {area}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        This workspace uses real data and secure authentication. Copy <code>.env.example</code> to
        {" "}<code>.env.local</code>, add your Supabase credentials, run the migrations in{" "}
        <code>supabase/migrations</code>, then restart the app.
      </p>
      <Button asChild className="mt-7">
        <Link href="/docs">Read setup instructions</Link>
      </Button>
    </div>
  );
}
