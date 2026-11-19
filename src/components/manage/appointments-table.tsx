"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, PlayCircle, Search, UserCheck, UserX } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { setAppointmentStatus } from "@/app/manage/[orgSlug]/actions";
import type { Appointment } from "@/types/domain";
import { cn } from "@/lib/utils";

const statusFilters = ["ALL", "BOOKED", "CHECKED_IN", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"];

export function ManageAppointmentsTable({
  appointments,
  orgSlug,
}: {
  appointments: Appointment[];
  orgSlug: string;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("ALL");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");

  const filtered = appointments.filter((appointment) => {
    if (status !== "ALL" && appointment.status !== status) return false;
    if (!query.trim()) return true;
    const term = query.toLowerCase();
    return (
      appointment.token?.token_number?.toLowerCase().includes(term) ||
      appointment.customer?.full_name?.toLowerCase().includes(term) ||
      appointment.customer?.email?.toLowerCase().includes(term) ||
      appointment.service?.name?.toLowerCase().includes(term)
    );
  });

  async function change(id: string, nextStatus: string) {
    setBusyId(id);
    setError("");
    try {
      await setAppointmentStatus(orgSlug, id, nextStatus);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update appointment");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search token, customer, service…" className="pl-10" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {statusFilters.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatus(value)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition",
                  status === value
                    ? "border-cyan-400/40 bg-cyan-500/12 text-cyan-100"
                    : "border-white/10 bg-white/[0.025] text-muted hover:text-foreground",
                )}
              >
                {value === "ALL" ? "All" : value.replaceAll("_", " ").toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {error && <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}

      <Card className="overflow-hidden">
        {filtered.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((appointment) => {
                const busy = busyId === appointment.id;
                return (
                  <TableRow key={appointment.id}>
                    <TableCell className="font-mono text-xs font-bold text-violet-200">{appointment.token?.token_number ?? "—"}</TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{appointment.customer?.full_name || "Customer"}</p>
                      <p className="text-[11px] text-subtle">{appointment.customer?.email ?? "—"}</p>
                    </TableCell>
                    <TableCell className="text-muted">{appointment.service?.name ?? "—"}</TableCell>
                    <TableCell className="text-xs">{appointment.appointment_date}</TableCell>
                    <TableCell className="text-xs">{appointment.start_time.slice(0, 5)} – {appointment.end_time.slice(0, 5)}</TableCell>
                    <TableCell><StatusBadge status={appointment.status} /></TableCell>
                    <TableCell className="text-right">
                      {busy ? (
                        <Loader2 className="ml-auto size-4 animate-spin text-subtle" />
                      ) : appointment.status === "BOOKED" ? (
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" title="Check in" onClick={() => change(appointment.id, "CHECKED_IN")}><UserCheck className="size-3.5" /></Button>
                          <Button variant="ghost" size="icon-sm" title="Mark no-show" onClick={() => change(appointment.id, "NO_SHOW")}><UserX className="size-3.5" /></Button>
                        </div>
                      ) : appointment.status === "CHECKED_IN" ? (
                        <Button variant="ghost" size="icon-sm" title="Start service" onClick={() => change(appointment.id, "IN_PROGRESS")}><PlayCircle className="size-3.5" /></Button>
                      ) : appointment.status === "IN_PROGRESS" ? (
                        <Button variant="ghost" size="icon-sm" title="Complete" onClick={() => change(appointment.id, "COMPLETED")}><CheckCircle2 className="size-3.5" /></Button>
                      ) : (
                        <span className="text-[11px] text-subtle">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <EmptyState icon={Search} title="No matching appointments" description="Try a different filter or search term." />
        )}
      </Card>
    </div>
  );
}
