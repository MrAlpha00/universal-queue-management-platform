import Link from "next/link";
import { CalendarCheck2, QrCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/misc";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ACTIVE_APPOINTMENT_STATUSES } from "@/config/constants";
import { listCustomerAppointments } from "@/services/bookings";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const filters = [
  { value: "ALL", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "BOOKED", label: "Booked" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "ALL" } = await searchParams;
  const appointments = await listCustomerAppointments();
  const filtered =
    status === "ACTIVE"
      ? appointments.filter((a) => ACTIVE_APPOINTMENT_STATUSES.includes(a.status))
      : status === "ALL"
        ? appointments
        : appointments.filter((a) => a.status === status);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="My bookings"
        title="Appointments"
        description="Review upcoming visits, open QR tickets and manage your history."
        actions={<Button asChild variant="cyan"><Link href="/organizations"><CalendarCheck2 className="size-4" /> New booking</Link></Button>}
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((filter) => (
          <Link
            key={filter.value}
            href={`/appointments?status=${filter.value}`}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
              status === filter.value
                ? "border-violet-400/40 bg-violet-500/12 text-violet-100"
                : "border-white/10 bg-white/[0.025] text-muted hover:text-foreground",
            )}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      <Card className="overflow-hidden">
        {filtered.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Date & time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell className="font-mono text-xs font-bold text-violet-200">
                    {appointment.token?.token_number ?? "—"}
                  </TableCell>
                  <TableCell className="font-medium">{appointment.service?.name ?? "Service"}</TableCell>
                  <TableCell className="text-muted">{appointment.organization?.name ?? "—"}</TableCell>
                  <TableCell>
                    <p className="text-xs text-foreground">{appointment.appointment_date}</p>
                    <p className="text-[11px] text-subtle">{appointment.start_time.slice(0, 5)} – {appointment.end_time.slice(0, 5)}</p>
                  </TableCell>
                  <TableCell><Badge tone={appointment.status === "BOOKED" ? "violet" : appointment.status === "COMPLETED" ? "teal" : appointment.status === "CANCELLED" ? "coral" : "cyan"}>{appointment.status.replaceAll("_", " ")}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="icon-sm"><Link href={`/appointments/${appointment.id}`} aria-label="View details">View</Link></Button>
                      {ACTIVE_APPOINTMENT_STATUSES.includes(appointment.status) && (
                        <Button asChild variant="outline" size="icon-sm"><Link href={`/appointments/${appointment.id}/ticket`} aria-label="Open QR ticket"><QrCode className="size-3.5" /></Link></Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            icon={CalendarCheck2}
            title="No appointments here"
            description="Book an appointment with an organization to see it here."
            action={<Button asChild><Link href="/organizations">Explore organizations</Link></Button>}
          />
        )}
      </Card>
    </div>
  );
}
