import { ManageAppointmentsTable } from "@/components/manage/appointments-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { getOrgContext } from "@/services/auth";
import { listOrgAppointments } from "@/services/bookings";

export const dynamic = "force-dynamic";

export default async function ManageAppointmentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { orgSlug } = await params;
  const { date } = await searchParams;
  const { org } = await getOrgContext(orgSlug, "MEMBER");
  const appointments = await listOrgAppointments(org.id, { date });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Appointments"
        description={`Every booking across ${org.name}. Update statuses as customers move through their visit.`}
        actions={
          <form method="get" className="flex items-end gap-2">
            <div>
              <label htmlFor="date" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-subtle">Filter by date</label>
              <input
                id="date"
                name="date"
                type="date"
                defaultValue={date ?? ""}
                className="h-9 rounded-xl border border-white/[0.12] bg-white/[0.035] px-3 text-xs text-foreground outline-none focus:border-violet-400/60"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">Apply</Button>
            {date && (
              <Button asChild variant="ghost" size="sm">
                <a href={`/manage/${orgSlug}/appointments`}>Clear</a>
              </Button>
            )}
          </form>
        }
      />

      <Card className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
        {[
          { label: "Shown", value: appointments.length },
          { label: "Active", value: appointments.filter((a) => ["BOOKED", "CHECKED_IN", "IN_PROGRESS"].includes(a.status)).length },
          { label: "Completed", value: appointments.filter((a) => a.status === "COMPLETED").length },
          { label: "Cancelled", value: appointments.filter((a) => ["CANCELLED", "EXPIRED", "NO_SHOW"].includes(a.status)).length },
        ].map((item) => (
          <div key={item.label}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle">{item.label}</p>
            <p className="mt-1 text-xl font-bold tabular-nums">{item.value}</p>
          </div>
        ))}
      </Card>

      <ManageAppointmentsTable appointments={appointments} orgSlug={orgSlug} />
    </div>
  );
}
