import Link from "next/link";
import { CalendarCheck2, CalendarClock, CircleSlash, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
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
import { APPOINTMENT_STATUSES, type AppointmentStatus } from "@/config/constants";
import { listPlatformBookings } from "@/services/platform";

export const dynamic = "force-dynamic";

export default async function PlatformBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus = APPOINTMENT_STATUSES.includes(status as AppointmentStatus)
    ? (status as AppointmentStatus)
    : undefined;
  const bookings = await listPlatformBookings(300, activeStatus);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Bookings"
        description="Read-only view of every appointment created across the platform."
        actions={
          <form method="get" className="flex items-end gap-2">
            <div>
              <label htmlFor="status" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-subtle">
                Filter by status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={activeStatus ?? ""}
                className="h-9 rounded-xl border border-white/[0.12] bg-white/[0.035] px-3 text-xs text-foreground outline-none focus:border-violet-400/60"
              >
                <option value="">All statuses</option>
                {APPOINTMENT_STATUSES.map((value) => (
                  <option key={value} value={value}>{value.replaceAll("_", " ").toLowerCase()}</option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="secondary" size="sm">Apply</Button>
            {activeStatus && (
              <Button asChild variant="ghost" size="sm">
                <Link href="/platform/bookings">Clear</Link>
              </Button>
            )}
          </form>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Shown", value: bookings.length, icon: CalendarCheck2, tone: "text-violet-300" },
          { label: "Active", value: bookings.filter((b) => ["BOOKED", "CHECKED_IN", "IN_PROGRESS"].includes(b.status)).length, icon: CalendarClock, tone: "text-cyan-300" },
          { label: "Completed", value: bookings.filter((b) => b.status === "COMPLETED").length, icon: CheckCircle2, tone: "text-emerald-300" },
          { label: "Cancelled / expired", value: bookings.filter((b) => ["CANCELLED", "EXPIRED", "NO_SHOW"].includes(b.status)).length, icon: CircleSlash, tone: "text-rose-300" },
        ].map((item) => (
          <Card key={item.label} className="flex items-center gap-3 p-4">
            <div className={`grid size-10 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] ${item.tone}`}>
              <item.icon className="size-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">{item.label}</p>
              <p className="text-xl font-bold tabular-nums">{item.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        {bookings.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Booked</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <p className="text-xs font-semibold">{booking.organization?.name ?? "—"}</p>
                    <p className="text-[11px] text-subtle">{booking.organization ? `/${booking.organization.slug}` : "—"}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs">{booking.customer?.full_name || "—"}</p>
                    <p className="text-[11px] text-subtle">{booking.customer?.email ?? "—"}</p>
                  </TableCell>
                  <TableCell className="text-xs text-muted">{booking.service?.name ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted">{booking.appointment_date}</TableCell>
                  <TableCell className="text-xs tabular-nums text-muted">{booking.start_time.slice(0, 5)}–{booking.end_time.slice(0, 5)}</TableCell>
                  <TableCell><StatusBadge status={booking.status as AppointmentStatus} /></TableCell>
                  <TableCell className="text-[11px] text-subtle">
                    {new Date(booking.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            icon={CalendarCheck2}
            title="No bookings found"
            description="Bookings will appear here as soon as customers start reserving slots."
          />
        )}
      </Card>
    </div>
  );
}
