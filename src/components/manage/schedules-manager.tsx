"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarX2, Clock3, Plus, Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/label";
import { Input, SelectNative } from "@/components/ui/input";
import {
  addScheduleException,
  deleteScheduleException,
  generateSlots,
  saveWorkingHours,
} from "@/app/manage/[orgSlug]/actions";
import type { ScheduleException, Service, WorkingHour } from "@/types/domain";

const weekdays = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
];

type DayRow = { open: boolean; openTime: string; closeTime: string; breakStart: string; breakEnd: string };

function buildRows(hours: WorkingHour[]): Record<number, DayRow> {
  const rows: Record<number, DayRow> = {};
  for (const day of weekdays) {
    const match = hours.find((hour) => hour.weekday === day.value);
    rows[day.value] = match
      ? {
          open: match.is_active,
          openTime: match.open_time.slice(0, 5),
          closeTime: match.close_time.slice(0, 5),
          breakStart: match.break_start?.slice(0, 5) ?? "",
          breakEnd: match.break_end?.slice(0, 5) ?? "",
        }
      : { open: false, openTime: "09:00", closeTime: "17:00", breakStart: "", breakEnd: "" };
  }
  return rows;
}

export function SchedulesManager({
  orgSlug,
  hours,
  exceptions,
  services,
}: {
  orgSlug: string;
  hours: WorkingHour[];
  exceptions: ScheduleException[];
  services: Service[];
}) {
  const router = useRouter();
  const [rows, setRows] = React.useState<Record<number, DayRow>>(() => buildRows(hours));
  const [pending, startTransition] = React.useTransition();
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");

  const [exceptionOpen, setExceptionOpen] = React.useState(false);
  const [excDate, setExcDate] = React.useState("");
  const [excType, setExcType] = React.useState("CLOSED");
  const [excOpen, setExcOpen] = React.useState("09:00");
  const [excClose, setExcClose] = React.useState("12:00");
  const [excReason, setExcReason] = React.useState("");

  const [genService, setGenService] = React.useState(services[0]?.id ?? "");
  const [genFrom, setGenFrom] = React.useState("");
  const [genTo, setGenTo] = React.useState("");

  function update(day: number, patch: Partial<DayRow>) {
    setRows((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  }

  function save() {
    setMessage("");
    setError("");
    startTransition(async () => {
      try {
        await saveWorkingHours(
          orgSlug,
          weekdays
            .filter((day) => rows[day.value].open)
            .map((day) => ({
              weekday: day.value,
              openTime: rows[day.value].openTime,
              closeTime: rows[day.value].closeTime,
              breakStart: rows[day.value].breakStart,
              breakEnd: rows[day.value].breakEnd,
              serviceId: "",
              branchId: "",
            })),
        );
        setMessage("Working hours saved.");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to save working hours");
      }
    });
  }

  function addException() {
    setError("");
    startTransition(async () => {
      try {
        await addScheduleException(orgSlug, {
          date: excDate,
          type: excType as never,
          openTime: excOpen,
          closeTime: excClose,
          reason: excReason,
        });
        setExceptionOpen(false);
        setExcDate("");
        setExcReason("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to add exception");
      }
    });
  }

  function removeException(id: string) {
    startTransition(async () => {
      try {
        await deleteScheduleException(orgSlug, id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to delete exception");
      }
    });
  }

  function runGeneration() {
    setMessage("");
    setError("");
    if (!genService || !genFrom || !genTo) return;
    startTransition(async () => {
      try {
        const result = await generateSlots(orgSlug, genService, genFrom, genTo);
        setMessage(`Generated ${result.count} slots.`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to generate slots");
      }
    });
  }

  return (
    <div className="space-y-5">
      {(message || error) && (
        <p className={`rounded-xl border p-3 text-sm ${error ? "border-rose-400/25 bg-rose-500/10 text-rose-200" : "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"}`}>{error || message}</p>
      )}

      <Card className="p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold"><Clock3 className="size-4 text-violet-300" /> Weekly working hours</h2>
            <p className="mt-1 text-xs text-muted">Define when your organization is open for appointments.</p>
          </div>
          <Button variant="cyan" size="sm" loading={pending} disabled={pending} onClick={save}>Save hours</Button>
        </div>

        <div className="mt-5 space-y-2">
          {weekdays.map((day) => {
            const row = rows[day.value];
            return (
              <div key={day.value} className={`rounded-xl border p-3 transition ${row.open ? "border-white/[0.09] bg-white/[0.025]" : "border-white/[0.05] bg-white/[0.01]"}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex w-32 items-center gap-2 text-sm font-medium">
                    <input type="checkbox" checked={row.open} onChange={(e) => update(day.value, { open: e.target.checked })} className="size-4 accent-violet-500" />
                    {day.label}
                  </label>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Input type="time" value={row.openTime} onChange={(e) => update(day.value, { openTime: e.target.value })} disabled={!row.open} className="h-9 w-32" aria-label={`${day.label} open time`} />
                    <span className="text-subtle">to</span>
                    <Input type="time" value={row.closeTime} onChange={(e) => update(day.value, { closeTime: e.target.value })} disabled={!row.open} className="h-9 w-32" aria-label={`${day.label} close time`} />
                    <span className="ml-2 text-subtle">Break</span>
                    <Input type="time" value={row.breakStart} onChange={(e) => update(day.value, { breakStart: e.target.value })} disabled={!row.open} className="h-9 w-32" aria-label={`${day.label} break start`} />
                    <span className="text-subtle">–</span>
                    <Input type="time" value={row.breakEnd} onChange={(e) => update(day.value, { breakEnd: e.target.value })} disabled={!row.open} className="h-9 w-32" aria-label={`${day.label} break end`} />
                  </div>
                  {!row.open && <Badge tone="neutral" className="ml-auto">Closed</Badge>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-bold"><CalendarX2 className="size-4 text-rose-300" /> Exceptions & holidays</h2>
            <Button variant="secondary" size="sm" onClick={() => setExceptionOpen(true)}><Plus className="size-3.5" /> Add</Button>
          </div>
          <div className="mt-4 space-y-2">
            {exceptions.length ? exceptions.map((exception) => (
              <div key={exception.id} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{exception.exception_date}</p>
                  <p className="text-[11px] text-subtle">
                    {exception.exception_type.toLowerCase()}
                    {exception.reason ? ` · ${exception.reason}` : ""}
                  </p>
                </div>
                <Badge tone={exception.exception_type === "SPECIAL" ? "cyan" : "coral"}>{exception.exception_type}</Badge>
                <Button variant="ghost" size="icon-sm" onClick={() => removeException(exception.id)} aria-label="Delete exception"><Trash2 className="size-3.5 text-rose-300" /></Button>
              </div>
            )) : <p className="py-6 text-center text-xs text-subtle">No exceptions configured.</p>}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-sm font-bold"><Sparkles className="size-4 text-cyan-300" /> Generate availability</h2>
          <p className="mt-1 text-xs text-muted">Slots are generated on demand, but you can pre-generate them for a date range.</p>
          <div className="mt-4 space-y-3">
            <Field label="Service" htmlFor="gen-service">
              <SelectNative id="gen-service" value={genService} onChange={(e) => setGenService(e.target.value)}>
                {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
              </SelectNative>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="From" htmlFor="gen-from"><Input id="gen-from" type="date" value={genFrom} onChange={(e) => setGenFrom(e.target.value)} /></Field>
              <Field label="To" htmlFor="gen-to"><Input id="gen-to" type="date" value={genTo} onChange={(e) => setGenTo(e.target.value)} /></Field>
            </div>
            <Button variant="secondary" className="w-full" loading={pending} disabled={pending || !genService || !genFrom || !genTo} onClick={runGeneration}>Generate slots</Button>
          </div>
        </Card>
      </div>

      <Dialog open={exceptionOpen} onOpenChange={setExceptionOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add schedule exception</DialogTitle></DialogHeader>
          <DialogBody>
            <div className="grid gap-4">
              <Field label="Date" htmlFor="exc-date"><Input id="exc-date" type="date" value={excDate} onChange={(e) => setExcDate(e.target.value)} /></Field>
              <Field label="Type" htmlFor="exc-type">
                <SelectNative id="exc-type" value={excType} onChange={(e) => setExcType(e.target.value)}>
                  <option value="CLOSED">Closed</option>
                  <option value="HOLIDAY">Holiday</option>
                  <option value="SPECIAL">Special hours</option>
                </SelectNative>
              </Field>
              {excType === "SPECIAL" && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Open" htmlFor="exc-open"><Input id="exc-open" type="time" value={excOpen} onChange={(e) => setExcOpen(e.target.value)} /></Field>
                  <Field label="Close" htmlFor="exc-close"><Input id="exc-close" type="time" value={excClose} onChange={(e) => setExcClose(e.target.value)} /></Field>
                </div>
              )}
              <Field label="Reason (optional)" htmlFor="exc-reason"><Input id="exc-reason" value={excReason} onChange={(e) => setExcReason(e.target.value)} /></Field>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setExceptionOpen(false)}>Cancel</Button>
            <Button variant="cyan" loading={pending} disabled={pending || !excDate} onClick={addException}>Add exception</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
