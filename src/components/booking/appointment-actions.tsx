"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/label";
import { Input, SelectNative } from "@/components/ui/input";
import type { BookingDay } from "@/services/availability";
import type { Appointment } from "@/types/domain";
import { cn } from "@/lib/utils";

type Slot = { id: string; start_time: string; end_time: string; capacity: number; booked_count: number };

export function AppointmentActions({
  appointment,
  days,
}: {
  appointment: Appointment;
  days: BookingDay[];
}) {
  const router = useRouter();
  const [rescheduleOpen, setRescheduleOpen] = React.useState(false);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [date, setDate] = React.useState(appointment.appointment_date);
  const [slots, setSlots] = React.useState<Slot[]>([]);
  const [startTime, setStartTime] = React.useState("");
  const [loadingSlots, setLoadingSlots] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState<"reschedule" | "cancel" | null>(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!rescheduleOpen) return;
    let cancelled = false;
    setLoadingSlots(true);
    setSlots([]);
    setStartTime("");
    const slug = appointment.organization?.slug;
    if (!slug) return;
    fetch(`/api/organizations/${slug}/availability?serviceId=${appointment.service_id}&branchId=${appointment.branch_id}&date=${date}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error?.message ?? "Unable to load slots");
        return json.data.slots as Slot[];
      })
      .then((data) => { if (!cancelled) setSlots(data); })
      .catch(() => { if (!cancelled) setSlots([]); })
      .finally(() => { if (!cancelled) setLoadingSlots(false); });
    return () => { cancelled = true; };
  }, [rescheduleOpen, date, appointment.service_id, appointment.branch_id, appointment.organization?.slug]);

  async function reschedule() {
    if (!startTime) return;
    setBusy("reschedule");
    setError("");
    try {
      const res = await fetch(`/api/bookings/${appointment.id}/reschedule`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          serviceId: appointment.service_id,
          branchId: appointment.branch_id,
          date,
          startTime,
          responses: appointment.responses ?? {},
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Unable to reschedule");
      setRescheduleOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reschedule");
    } finally {
      setBusy(null);
    }
  }

  async function cancel() {
    setBusy("cancel");
    setError("");
    try {
      const res = await fetch(`/api/bookings/${appointment.id}/cancel`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: reason || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Unable to cancel");
      setCancelOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to cancel");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogTrigger asChild>
          <Button variant="secondary" size="sm"><CalendarClock className="size-3.5" /> Reschedule</Button>
        </DialogTrigger>
        <DialogContent size="wide">
          <DialogHeader>
            <DialogTitle>Reschedule appointment</DialogTitle>
            <DialogDescription>Choose a new date and time for your visit.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label="Date">
              <SelectNative value={date} onChange={(e) => setDate(e.target.value)}>
                {days.map((day) => (
                  <option key={day.date} value={day.date}>{day.label} · {day.day} {day.month}</option>
                ))}
              </SelectNative>
            </Field>
            <div className="mt-5">
              <p className="text-xs font-semibold text-muted">Available times</p>
              {loadingSlots ? (
                <p className="mt-3 flex items-center gap-2 text-sm text-subtle"><Loader2 className="size-4 animate-spin" /> Loading…</p>
              ) : slots.length ? (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {slots.map((slot) => {
                    const remaining = slot.capacity - slot.booked_count;
                    const disabled = remaining <= 0;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => setStartTime(slot.start_time.slice(0, 5))}
                        className={cn(
                          "rounded-xl border px-2 py-2.5 text-xs font-semibold transition",
                          disabled
                            ? "cursor-not-allowed border-white/[0.05] text-subtle/50 line-through"
                            : startTime === slot.start_time.slice(0, 5)
                              ? "border-violet-400/50 bg-violet-500/12 text-violet-100"
                              : "border-white/[0.09] bg-white/[0.025] hover:border-violet-400/30",
                        )}
                      >
                        {slot.start_time.slice(0, 5)}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 rounded-xl border border-dashed border-white/10 py-6 text-center text-sm text-subtle">No slots available on this date.</p>
              )}
            </div>
            {error && <p className="mt-4 rounded-xl border border-rose-400/25 bg-rose-500/10 p-3 text-xs text-rose-200">{error}</p>}
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRescheduleOpen(false)}>Cancel</Button>
            <Button variant="cyan" loading={busy === "reschedule"} disabled={!startTime || Boolean(busy)} onClick={reschedule}>Confirm new time</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" size="sm"><XCircle className="size-3.5" /> Cancel booking</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this appointment?</DialogTitle>
            <DialogDescription>This releases your slot and cancels your token. You can book a new appointment anytime.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label="Reason (optional)" hint="Helping us understand helps us improve.">
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Plans changed" />
            </Field>
            {error && <p className="mt-4 rounded-xl border border-rose-400/25 bg-rose-500/10 p-3 text-xs text-rose-200">{error}</p>}
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCancelOpen(false)}>Keep appointment</Button>
            <Button variant="destructive" loading={busy === "cancel"} disabled={Boolean(busy)} onClick={cancel}>Yes, cancel booking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
