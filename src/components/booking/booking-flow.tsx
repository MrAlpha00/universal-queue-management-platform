"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  QrCode,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Label } from "@/components/ui/label";
import { Input, SelectNative, Textarea } from "@/components/ui/input";
import type { BookingDay } from "@/services/availability";
import type { Branch, BookingResult, Service } from "@/types/domain";
import { cn } from "@/lib/utils";

type Slot = {
  id: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_count: number;
};

type Step = 1 | 2 | 3 | 4;

const stepLabels: Record<Step, string> = {
  1: "Service & location",
  2: "Date & time",
  3: "Your details",
  4: "Confirmed",
};

export function BookingFlow({
  orgSlug,
  orgName,
  branches,
  services,
  days,
  initialServiceId,
}: {
  orgSlug: string;
  orgName: string;
  branches: Branch[];
  services: Service[];
  days: BookingDay[];
  initialServiceId?: string;
}) {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>(1);
  const [serviceId, setServiceId] = React.useState(initialServiceId ?? services[0]?.id ?? "");
  const [branchId, setBranchId] = React.useState(branches.find((b) => b.is_active)?.id ?? branches[0]?.id ?? "");
  const [date, setDate] = React.useState(days[0]?.date ?? "");
  const [slots, setSlots] = React.useState<Slot[]>([]);
  const [startTime, setStartTime] = React.useState("");
  const [loadingSlots, setLoadingSlots] = React.useState(false);
  const [responses, setResponses] = React.useState<Record<string, unknown>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [booking, setBooking] = React.useState<BookingResult | null>(null);
  const [submitError, setSubmitError] = React.useState("");

  const service = services.find((s) => s.id === serviceId) ?? null;
  const fields = React.useMemo(
    () => (service?.service_fields ?? []).filter((f) => f.is_active).sort((a, b) => a.display_order - b.display_order),
    [service],
  );

  React.useEffect(() => {
    if (step !== 2 || !serviceId || !branchId || !date) return;
    let cancelled = false;
    setLoadingSlots(true);
    setSlots([]);
    setStartTime("");
    fetch(`/api/organizations/${orgSlug}/availability?serviceId=${serviceId}&branchId=${branchId}&date=${date}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error?.message ?? "Unable to load availability");
        return json.data.slots as Slot[];
      })
      .then((data) => {
        if (!cancelled) setSlots(data);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [step, serviceId, branchId, date, orgSlug]);

  function validateDetails() {
    const next: Record<string, string> = {};
    for (const field of fields) {
      const value = responses[field.name];
      const empty = value === undefined || value === null || value === "" || value === false;
      if (field.is_required && empty) next[field.name] = `${field.label} is required`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit() {
    if (!validateDetails()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ serviceId, branchId, date, startTime, responses }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Unable to complete booking");
      setBooking(json.data.booking as BookingResult);
      setStep(4);
      router.refresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to complete booking");
    } finally {
      setSubmitting(false);
    }
  }

  const canContinue =
    step === 1
      ? Boolean(serviceId && branchId)
      : step === 2
        ? Boolean(date && startTime)
        : true;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-300">Booking · {orgName}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          {step === 4 ? "You're all set" : "Book an appointment"}
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          {step === 4
            ? "Your token has been issued. Show the QR ticket when you arrive."
            : "Choose a service, pick a time and confirm your details."}
        </p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {([1, 2, 3] as Step[]).map((value) => (
          <React.Fragment key={value}>
            <div
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
                step >= value
                  ? "border-violet-400/30 bg-violet-500/12 text-violet-100"
                  : "border-white/10 bg-white/[0.03] text-subtle",
              )}
            >
              <span
                className={cn(
                  "grid size-5 place-items-center rounded-full text-[10px]",
                  step > value ? "bg-violet-400 text-slate-950" : "bg-white/10",
                )}
              >
                {step > value ? <Check className="size-3" /> : value}
              </span>
              {stepLabels[value]}
            </div>
            {value < 3 && <div className="h-px w-6 shrink-0 bg-white/10" />}
          </React.Fragment>
        ))}
      </div>

      {step === 1 && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold"><Ticket className="size-4 text-violet-300" /> 1. Choose a service</h2>
            <div className="mt-4 space-y-2">
              {services.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setServiceId(item.id);
                    setResponses({});
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition",
                    serviceId === item.id
                      ? "border-violet-400/45 bg-violet-500/10"
                      : "border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.045]",
                  )}
                >
                  <div className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border", serviceId === item.id ? "border-violet-400 bg-violet-400 text-slate-950" : "border-white/20")}>
                    {serviceId === item.id && <Check className="size-3" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{item.name}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted">{item.description || "No description"}</p>
                    <p className="mt-1.5 flex items-center gap-1 text-[11px] text-subtle"><Clock3 className="size-3" /> {item.duration_minutes} min · Capacity {item.capacity}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold"><Building2 className="size-4 text-cyan-300" /> 2. Choose a location</h2>
            <div className="mt-4 space-y-2">
              {branches.map((branch) => (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => setBranchId(branch.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition",
                    branchId === branch.id
                      ? "border-cyan-400/45 bg-cyan-500/10"
                      : "border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.045]",
                  )}
                >
                  <div className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border", branchId === branch.id ? "border-cyan-400 bg-cyan-400 text-slate-950" : "border-white/20")}>
                    {branchId === branch.id && <Check className="size-3" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{branch.name}</p>
                    <p className="mt-0.5 text-xs text-muted">{branch.address || branch.city || "No address provided"}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {step === 2 && (
        <Card className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-sm font-bold"><CalendarDays className="size-4 text-violet-300" /> Pick a date & time</h2>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
            {days.map((day) => (
              <button
                key={day.date}
                type="button"
                onClick={() => setDate(day.date)}
                className={cn(
                  "flex min-w-[72px] shrink-0 flex-col items-center rounded-xl border px-3 py-2.5 transition",
                  date === day.date
                    ? "border-violet-400/45 bg-violet-500/12 text-violet-100"
                    : "border-white/[0.08] bg-white/[0.02] text-muted hover:border-white/20",
                )}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wide">{day.weekday}</span>
                <span className="mt-1 text-lg font-bold leading-none">{day.day}</span>
                <span className="mt-1 text-[10px]">{day.month}</span>
              </button>
            ))}
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold text-muted">Available times</p>
            {loadingSlots ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-subtle"><Loader2 className="size-4 animate-spin" /> Loading availability…</div>
            ) : slots.length ? (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
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
                        "rounded-xl border px-2 py-2.5 text-center transition",
                        disabled
                          ? "cursor-not-allowed border-white/[0.05] bg-white/[0.01] text-subtle/50 line-through"
                          : startTime === slot.start_time.slice(0, 5)
                            ? "border-cyan-400/50 bg-cyan-500/12 text-cyan-100"
                            : "border-white/[0.09] bg-white/[0.025] text-foreground hover:border-cyan-400/30 hover:bg-cyan-500/[0.07]",
                      )}
                    >
                      <span className="block text-xs font-semibold">{slot.start_time.slice(0, 5)}</span>
                      {!disabled && <span className="mt-0.5 block text-[10px] text-subtle">{remaining} left</span>}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 rounded-xl border border-dashed border-white/10 py-8 text-center text-sm text-subtle">
                No slots available on this date. Try another day.
              </p>
            )}
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-sm font-bold"><Ticket className="size-4 text-violet-300" /> Your details</h2>
          <p className="mt-1 text-xs text-muted">These fields are configured by {orgName} for this service.</p>

          {fields.length ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {fields.map((field) => {
                const value = responses[field.name];
                const options = Array.isArray(field.options)
                  ? field.options.map((option) =>
                      typeof option === "string"
                        ? { label: option, value: option }
                        : (option as { label: string; value: string }),
                    )
                  : [];
                return (
                  <Field
                    key={field.id}
                    label={field.label}
                    required={field.is_required}
                    hint={field.help_text ?? undefined}
                    error={errors[field.name]}
                    htmlFor={`field-${field.name}`}
                    className={field.field_type === "TEXTAREA" ? "sm:col-span-2" : undefined}
                  >
                    {(field.field_type === "SELECT" || field.field_type === "RADIO") && (
                      <SelectNative
                        id={`field-${field.name}`}
                        value={String(value ?? "")}
                        onChange={(e) => setResponses((prev) => ({ ...prev, [field.name]: e.target.value }))}
                        aria-invalid={Boolean(errors[field.name])}
                      >
                        <option value="">Select…</option>
                        {options.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </SelectNative>
                    )}
                    {field.field_type === "TEXTAREA" && (
                      <Textarea
                        id={`field-${field.name}`}
                        placeholder={field.placeholder ?? undefined}
                        value={String(value ?? "")}
                        onChange={(e) => setResponses((prev) => ({ ...prev, [field.name]: e.target.value }))}
                        aria-invalid={Boolean(errors[field.name])}
                      />
                    )}
                    {field.field_type === "CHECKBOX" && (
                      <Label className="flex h-11 cursor-pointer items-center gap-2.5 rounded-xl border border-white/[0.12] bg-white/[0.035] px-3.5">
                        <input
                          id={`field-${field.name}`}
                          type="checkbox"
                          checked={Boolean(value)}
                          onChange={(e) => setResponses((prev) => ({ ...prev, [field.name]: e.target.checked }))}
                          className="size-4 accent-violet-500"
                        />
                        <span className="text-sm text-muted">{field.placeholder || "Yes"}</span>
                      </Label>
                    )}
                    {["TEXT", "EMAIL", "PHONE", "NUMBER", "DATE"].includes(field.field_type) && (
                      <Input
                        id={`field-${field.name}`}
                        type={field.field_type === "EMAIL" ? "email" : field.field_type === "PHONE" ? "tel" : field.field_type === "NUMBER" ? "number" : field.field_type === "DATE" ? "date" : "text"}
                        placeholder={field.placeholder ?? undefined}
                        value={String(value ?? "")}
                        onChange={(e) => setResponses((prev) => ({ ...prev, [field.name]: e.target.value }))}
                        aria-invalid={Boolean(errors[field.name])}
                      />
                    )}
                  </Field>
                );
              })}
            </div>
          ) : (
            <p className="mt-5 rounded-xl border border-dashed border-white/10 py-8 text-center text-sm text-subtle">
              No additional information is required for this service.
            </p>
          )}

          <div className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Booking summary</p>
            <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
              <div><p className="text-[11px] text-subtle">Service</p><p className="font-semibold">{service?.name}</p></div>
              <div><p className="text-[11px] text-subtle">Location</p><p className="font-semibold">{branches.find((b) => b.id === branchId)?.name}</p></div>
              <div><p className="text-[11px] text-subtle">When</p><p className="font-semibold">{date} · {startTime}</p></div>
            </div>
          </div>

          {submitError && (
            <p className="mt-4 rounded-xl border border-rose-400/25 bg-rose-500/10 p-3 text-sm text-rose-200">{submitError}</p>
          )}
        </Card>
      )}

      {step === 4 && booking && (
        <Card className="relative overflow-hidden p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative">
            <div className="grid size-14 place-items-center rounded-2xl border border-emerald-400/30 bg-emerald-500/12 text-emerald-300">
              <CheckCircle2 className="size-7" />
            </div>
            <h2 className="mt-5 text-xl font-bold">Booking confirmed</h2>
            <p className="mt-2 text-sm text-muted">Your token <span className="font-mono font-bold text-violet-200">{booking.token_number}</span> is ready.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
                <p className="text-[11px] uppercase tracking-wider text-subtle">Date</p>
                <p className="mt-1 font-semibold">{booking.appointment_date}</p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
                <p className="text-[11px] uppercase tracking-wider text-subtle">Time</p>
                <p className="mt-1 font-semibold">{booking.start_time.slice(0, 5)} – {booking.end_time.slice(0, 5)}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild variant="cyan"><Link href={`/appointments/${booking.appointment_id}/ticket`}><QrCode className="size-4" /> Open QR ticket</Link></Button>
              <Button asChild variant="secondary"><Link href={`/appointments/${booking.appointment_id}`}>View appointment</Link></Button>
              <Button asChild variant="ghost"><Link href="/dashboard">Go to dashboard</Link></Button>
            </div>
          </div>
        </Card>
      )}

      {step < 4 && (
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => (s === 1 ? 1 : ((s - 1) as Step)))}
            disabled={step === 1 || submitting}
          >
            <ArrowLeft className="size-4" /> Back
          </Button>
          {step < 3 ? (
            <Button variant="cyan" disabled={!canContinue} onClick={() => setStep((s) => (s + 1) as Step)}>
              Continue <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button variant="cyan" loading={submitting} disabled={submitting} onClick={submit}>
              Confirm booking <Check className="size-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
