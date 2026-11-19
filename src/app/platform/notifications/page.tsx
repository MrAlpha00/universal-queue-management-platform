import { format } from "date-fns";
import { BellRing, MailCheck, MailX, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { listPlatformNotifications } from "@/services/platform";

export const dynamic = "force-dynamic";

export default async function PlatformNotificationsPage() {
  const notifications = await listPlatformNotifications(200);
  const sent = notifications.filter((event) => event.status === "SENT").length;
  const failed = notifications.filter((event) => event.status === "FAILED").length;
  const queued = notifications.filter((event) => event.status === "QUEUED" || event.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Deliverability"
        title="Notifications"
        description="Email delivery history across every organization on the platform."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Events", value: notifications.length, icon: BellRing, tone: "text-violet-300" },
          { label: "Delivered", value: sent, icon: MailCheck, tone: "text-emerald-300" },
          { label: "Failed", value: failed, icon: MailX, tone: "text-rose-300" },
          { label: "Queued", value: queued, icon: Timer, tone: "text-amber-300" },
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
        {notifications.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="text-xs font-semibold">
                    {event.organization?.name ?? "Platform"}
                  </TableCell>
                  <TableCell className="text-xs font-semibold">
                    {event.event_type.replaceAll("_", " ").toLowerCase()}
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-xs text-muted">{event.recipient}</TableCell>
                  <TableCell className="max-w-[260px] truncate text-xs text-muted">{event.subject ?? "—"}</TableCell>
                  <TableCell>
                    <Badge
                      tone={
                        event.status === "SENT"
                          ? "teal"
                          : event.status === "FAILED"
                            ? "coral"
                            : "amber"
                      }
                    >
                      {event.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[11px] text-subtle">
                    {format(new Date(event.created_at), "d MMM yyyy · HH:mm")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            icon={BellRing}
            title="No notification history"
            description="Booking confirmations, reminders and status emails will be logged here once they are sent."
          />
        )}
      </Card>
    </div>
  );
}
