import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, CalendarDays, Clock3, MapPin, QrCode, Ticket } from "lucide-react";
import { AppointmentActions } from "@/components/booking/appointment-actions";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader, Separator } from "@/components/ui/misc";
import { ACTIVE_APPOINTMENT_STATUSES } from "@/config/constants";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { getBookingDays } from "@/services/availability";
import { requireAppointmentForCustomer } from "@/services/bookings";

export const dynamic = "force-dynamic";

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let appointment;
  try {
    appointment = await requireAppointmentForCustomer(id);
  } catch {
    notFound();
  }

  const zonedStart = toZonedTime(new Date(appointment.start_at), appointment.timezone);
  const zonedEnd = toZonedTime(new Date(appointment.end_at), appointment.timezone);
  const days = getBookingDays(appointment.timezone, Number(appointment.organization?.settings?.booking_horizon_days ?? 3));
  const canManage = ACTIVE_APPOINTMENT_STATUSES.includes(appointment.status);

  return (
    <div className="space-y-7">
      <Link href="/appointments" className="inline-flex items-center gap-1.5 text-xs font-semibold text-subtle hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Back to appointments
      </Link>

      <PageHeader
        eyebrow="Appointment"
        title={appointment.service?.name ?? "Appointment details"}
        description={`${appointment.organization?.name ?? "Organization"} · Token ${appointment.token?.token_number ?? "—"}`}
        actions={
          <>
            <StatusBadge status={appointment.status} />
            {canManage && (
              <Button asChild variant="cyan" size="sm">
                <Link href={`/appointments/${appointment.id}/ticket`}><QrCode className="size-3.5" /> QR ticket</Link>
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Card className="p-6">
            <h2 className="text-sm font-bold">Visit details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                { icon: CalendarDays, label: "Date", value: appointment.appointment_date },
                { icon: Clock3, label: "Time", value: `${format(zonedStart, "HH:mm")} – ${format(zonedEnd, "HH:mm")} (${appointment.timezone})` },
                { icon: Ticket, label: "Token", value: appointment.token?.token_number ?? "—" },
                { icon: Building2, label: "Location", value: appointment.branch?.name ?? "—" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-subtle"><item.icon className="size-3.5" /> {item.label}</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
            {appointment.branch?.address && (
              <p className="mt-4 flex items-start gap-2 text-xs text-muted"><MapPin className="mt-0.5 size-3.5" /> {appointment.branch.address}</p>
            )}
          </Card>

          {Object.keys(appointment.responses ?? {}).length > 0 && (
            <Card className="p-6">
              <h2 className="text-sm font-bold">Your responses</h2>
              <Separator className="my-4" />
              <dl className="grid gap-4 sm:grid-cols-2">
                {Object.entries(appointment.responses).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-subtle">{key.replaceAll("_", " ")}</dt>
                    <dd className="mt-1 text-sm text-foreground">{String(value ?? "—")}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-sm font-bold">Manage</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              {canManage
                ? "Need to change your plans? You can reschedule or cancel below."
                : "This appointment is no longer active and cannot be changed."}
            </p>
            {canManage ? (
              <div className="mt-5"><AppointmentActions appointment={appointment} days={days} /></div>
            ) : (
              <Badge tone="neutral" className="mt-4">Final state</Badge>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-bold">Booked on</h2>
            <p className="mt-2 text-xs text-muted">{format(new Date(appointment.created_at), "d MMM yyyy · HH:mm")}</p>
            <p className="mt-1 text-xs text-subtle">Source: {appointment.source}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
