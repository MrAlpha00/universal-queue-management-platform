import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, CalendarDays, Clock3, Ticket as TicketIcon } from "lucide-react";
import { QrTicket } from "@/components/booking/qr-ticket";
import { StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ACTIVE_APPOINTMENT_STATUSES } from "@/config/constants";
import { format } from "date-fns";
import { requireAppointmentForCustomer } from "@/services/bookings";
import { generateQrDataUrl, reissueQr } from "@/services/tokens";

export const dynamic = "force-dynamic";

export default async function TicketPage({
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

  if (!ACTIVE_APPOINTMENT_STATUSES.includes(appointment.status)) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <TicketIcon className="mx-auto size-10 text-subtle" />
        <h1 className="mt-5 text-xl font-bold">This ticket is no longer active</h1>
        <p className="mt-2 text-sm text-muted">The appointment has reached a final state, so its QR credential is no longer valid.</p>
        <Link href={`/appointments/${id}`} className="mt-6 inline-block text-sm font-semibold text-cyan-300 hover:underline">
          Back to appointment details
        </Link>
      </div>
    );
  }

  let qr;
  try {
    qr = await reissueQr(id);
  } catch {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="text-xl font-bold">Unable to issue QR code</h1>
        <p className="mt-2 text-sm text-muted">Please try again from your appointment details.</p>
      </div>
    );
  }
  const dataUrl = await generateQrDataUrl(qr.qr_reference);

  return (
    <div className="space-y-6">
      <Link href={`/appointments/${id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-subtle hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Back to appointment
      </Link>

      <div className="mx-auto max-w-xl">
        <Card className="overflow-hidden">
          <div className="relative border-b border-white/[0.07] bg-gradient-to-br from-violet-500/15 via-transparent to-cyan-500/10 p-6 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-300">Digital QR ticket</p>
            <h1 className="mt-2 text-xl font-bold">{appointment.service?.name ?? "Appointment"}</h1>
            <p className="mt-1 text-sm text-muted">{appointment.organization?.name}</p>
            <div className="mt-3 flex justify-center"><StatusBadge status={appointment.status} /></div>
          </div>

          <div className="p-6 sm:p-8">
            <QrTicket appointment={appointment} reference={qr.qr_reference} initialDataUrl={dataUrl} />

            <div className="mt-8 grid gap-3 border-t border-white/[0.07] pt-6 sm:grid-cols-3">
              {[
                { icon: TicketIcon, label: "Token", value: appointment.token?.token_number ?? "—" },
                { icon: CalendarDays, label: "Date", value: appointment.appointment_date },
                { icon: Clock3, label: "Time", value: `${appointment.start_time.slice(0, 5)} – ${appointment.end_time.slice(0, 5)}` },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <item.icon className="mx-auto size-4 text-subtle" />
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-subtle">{item.label}</p>
                  <p className="mt-1 text-xs font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-xs text-muted">
              <Building2 className="size-3.5" />
              Show this code at {appointment.branch?.name ?? "the front desk"} — no hardware required.
            </div>
            <p className="mt-3 text-center text-[11px] text-subtle">
              Issued {format(new Date(appointment.created_at), "d MMM yyyy")} · Expires shortly after your appointment.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
