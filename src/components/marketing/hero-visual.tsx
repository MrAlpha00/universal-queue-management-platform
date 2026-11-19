"use client";

import { motion } from "motion/react";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  ScanLine,
  Ticket,
} from "lucide-react";
import { QrPattern } from "@/components/brand/qr-pattern";
import { cn } from "@/lib/utils";

const appointments = [
  { token: "TK-021", name: "Amelia R.", service: "Consultation", time: "14:30", status: "Done", tone: "teal" },
  { token: "TK-022", name: "Noah K.", service: "Renewal", time: "14:45", status: "Active", tone: "amber" },
  { token: "TK-023", name: "Sofia M.", service: "Consultation", time: "15:00", status: "Waiting", tone: "cyan" },
];

export function HeroVisual() {
  return (
    <div className="relative mx-auto h-[460px] w-full max-w-[600px] sm:h-[520px] lg:h-[560px]">
      {/* ambient glow */}
      <div className="absolute inset-8 rounded-full bg-violet-600/20 blur-[90px]" />
      <div className="absolute -right-4 top-20 size-52 rounded-full bg-cyan-500/10 blur-[70px]" />

      {/* main panel */}
      <motion.div
        initial={{ opacity: 0, y: 40, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.9, delay: 0.15, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="glass-strong absolute inset-x-2 top-10 overflow-hidden rounded-[26px] shadow-[0_50px_120px_-40px_rgba(0,0,0,0.95)] sm:inset-x-6"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/70 to-transparent" />
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex gap-1.5">
              <span className="size-2 rounded-full bg-coral/70" />
              <span className="size-2 rounded-full bg-amber/70" />
              <span className="size-2 rounded-full bg-teal/70" />
            </div>
            <span className="ml-2 font-mono text-[10px] tracking-wider text-subtle">
              tokenflow / operations
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-400/25 bg-teal-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-200">
            <span className="size-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
            LIVE
          </span>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300">
                Today · Central branch
              </p>
              <h3 className="mt-1.5 text-xl font-bold tracking-tight text-foreground">
                Appointment flow
              </h3>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-right">
              <p className="font-mono text-lg font-bold leading-none text-foreground">24</p>
              <p className="mt-1 text-[9px] uppercase tracking-wider text-subtle">tokens today</p>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {appointments.map((item, index) => (
              <motion.div
                key={item.token}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 + index * 0.12, duration: 0.5 }}
                className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3"
              >
                <div className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-lg border font-mono text-[11px] font-bold",
                  item.tone === "teal" && "border-teal-400/25 bg-teal-500/10 text-emerald-200",
                  item.tone === "amber" && "border-amber-400/25 bg-amber-500/10 text-amber-200",
                  item.tone === "cyan" && "border-cyan-400/25 bg-cyan-500/10 text-cyan-200",
                )}>
                  {item.token.replace("TK-", "")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-foreground">{item.name}</p>
                  <p className="truncate text-[11px] text-subtle">{item.service} · {item.time}</p>
                </div>
                <span className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                  item.tone === "teal" && "border-teal-400/20 bg-teal-500/10 text-emerald-200",
                  item.tone === "amber" && "border-amber-400/20 bg-amber-500/10 text-amber-200",
                  item.tone === "cyan" && "border-cyan-400/20 bg-cyan-500/10 text-cyan-200",
                )}>
                  {item.status}
                </span>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-violet-400/20 bg-violet-500/[0.07] px-4 py-3">
            <div className="flex items-center gap-2.5 text-xs text-violet-100">
              <ScanLine className="size-4 text-violet-300" />
              QR verification ready
            </div>
            <ArrowUpRight className="size-4 text-violet-300" />
          </div>
        </div>
      </motion.div>

      {/* floating QR ticket */}
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="glass-strong absolute -left-1 top-4 z-10 w-[178px] overflow-hidden rounded-2xl p-3.5 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.9)] sm:-left-8 sm:top-1 sm:w-[196px]"
      >
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-cyan-200">
            <Ticket className="size-3" /> Digital token
          </span>
          <Check className="size-3.5 text-teal-300" />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="relative overflow-hidden rounded-lg border border-white/15 bg-[#0d1426] p-1">
            <QrPattern size={62} />
            <motion.div
              animate={{ y: [-8, 8, -8] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute inset-x-1 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_10px_rgba(34,211,238,0.9)]"
            />
          </div>
          <div>
            <p className="font-mono text-lg font-bold leading-none text-foreground">TK-024</p>
            <p className="mt-1.5 text-[10px] text-subtle">15:15 · Today</p>
            <span className="mt-2 inline-block rounded-md bg-teal-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-200">
              Valid
            </span>
          </div>
        </div>
      </motion.div>

      {/* floating confirmation */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
        className="glass-strong absolute -right-1 bottom-6 z-10 w-[210px] rounded-2xl p-4 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.9)] sm:-right-7 sm:w-[232px]"
      >
        <div className="flex items-start gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-teal-400/25 bg-teal-500/15 text-teal-300">
            <Check className="size-4.5" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-foreground">Booking confirmed</p>
            <p className="mt-1 text-[11px] leading-snug text-muted">
              Your token and QR ticket are ready.
            </p>
          </div>
        </div>
        <div className="mt-3 space-y-2 border-t border-white/[0.08] pt-3 text-[10px] text-subtle">
          <p className="flex items-center gap-2"><CalendarDays className="size-3 text-violet-300" /> Tue, 12 October</p>
          <p className="flex items-center gap-2"><Clock3 className="size-3 text-cyan-300" /> 15:15 – 15:30</p>
          <p className="flex items-center gap-2"><MapPin className="size-3 text-teal-300" /> Central branch</p>
        </div>
      </motion.div>

      {/* status chip */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
        className="glass absolute bottom-24 left-2 z-20 flex items-center gap-2 rounded-full border-teal-400/25 px-3 py-2 shadow-xl sm:bottom-28 sm:left-8"
      >
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-teal-400 opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-teal-400" />
        </span>
        <span className="text-[10px] font-medium text-foreground">3 customers checked in</span>
      </motion.div>
    </div>
  );
}
