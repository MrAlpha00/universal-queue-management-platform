"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, PlayCircle, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { setAppointmentStatus } from "@/app/manage/[orgSlug]/actions";
import type { Appointment } from "@/types/domain";
import { cn } from "@/lib/utils";

const columns = [
  { status: "BOOKED", label: "Waiting", tone: "violet" as const },
  { status: "CHECKED_IN", label: "Checked in", tone: "cyan" as const },
  { status: "IN_PROGRESS", label: "Serving", tone: "amber" as const },
  { status: "COMPLETED", label: "Completed", tone: "teal" as const },
];

export function QueueBoard({ appointments, orgSlug }: { appointments: Appointment[]; orgSlug: string }) {
  const router = useRouter();
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");

  async function change(id: string, status: string) {
    setBusyId(id);
    setError("");
    try {
      await setAppointmentStatus(orgSlug, id, status);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update");
    } finally {
      setBusyId(null);
    }
  }

  const grouped = new Map<string, Appointment[]>();
  for (const column of columns) grouped.set(column.status, []);
  for (const appointment of appointments) {
    const list = grouped.get(appointment.status);
    if (list) list.push(appointment);
  }
  for (const list of grouped.values()) {
    list.sort((a, b) => a.start_time.localeCompare(b.start_time));
  }

  return (
    <div className="space-y-4">
      {error && <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {columns.map((column) => {
          const items = grouped.get(column.status) ?? [];
          return (
            <div key={column.status} className="flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.015]">
              <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-full", column.tone === "violet" ? "bg-violet-400" : column.tone === "cyan" ? "bg-cyan-400" : column.tone === "amber" ? "bg-amber-400" : "bg-emerald-400")} />
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">{column.label}</p>
                </div>
                <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold tabular-nums">{items.length}</span>
              </div>
              <div className="flex-1 space-y-2 p-2.5">
                {items.length ? items.map((appointment) => {
                  const busy = busyId === appointment.id;
                  return (
                    <Card key={appointment.id} className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-mono text-[11px] font-bold text-violet-200">{appointment.token?.token_number ?? "—"}</p>
                          <p className="mt-1 truncate text-sm font-semibold">{appointment.customer?.full_name || "Customer"}</p>
                          <p className="truncate text-[11px] text-subtle">{appointment.service?.name} · {appointment.start_time.slice(0, 5)}</p>
                        </div>
                        {busy && <Loader2 className="size-4 shrink-0 animate-spin text-subtle" />}
                      </div>
                      {!busy && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {appointment.status === "BOOKED" && (
                            <>
                              <Button size="sm" variant="secondary" className="h-7 px-2 text-[10px]" onClick={() => change(appointment.id, "CHECKED_IN")}><UserCheck className="size-3" /> Check in</Button>
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px]" onClick={() => change(appointment.id, "NO_SHOW")}><UserX className="size-3" /></Button>
                            </>
                          )}
                          {appointment.status === "CHECKED_IN" && (
                            <Button size="sm" variant="secondary" className="h-7 px-2 text-[10px]" onClick={() => change(appointment.id, "IN_PROGRESS")}><PlayCircle className="size-3" /> Start</Button>
                          )}
                          {appointment.status === "IN_PROGRESS" && (
                            <Button size="sm" variant="secondary" className="h-7 px-2 text-[10px]" onClick={() => change(appointment.id, "COMPLETED")}><CheckCircle2 className="size-3" /> Complete</Button>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                }) : (
                  <p className="px-2 py-8 text-center text-[11px] text-subtle">No appointments</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!appointments.length && (
        <EmptyState icon={UserCheck} title="Queue is empty" description="Today's appointments will appear here as customers book and arrive." />
      )}
    </div>
  );
}
