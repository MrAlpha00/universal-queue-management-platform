import { format } from "date-fns";
import { BellRing, MailCheck, MailX } from "lucide-react";
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
import { getOrgContext } from "@/services/auth";
import { listNotificationEvents, listReminderEvents } from "@/services/management";

export const dynamic = "force-dynamic";

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { org } = await getOrgContext(orgSlug, "MANAGER");
  const [notifications, reminders] = await Promise.all([
    listNotificationEvents(org.id),
    listReminderEvents(org.id),
  ]);

  const sent = notifications.filter((n) => n.status === "SENT").length;
  const failed = notifications.filter((n) => n.status === "FAILED").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Communications"
        title="Notifications"
        description="Delivery history for booking confirmations, reminders and status emails."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Sent", value: sent, icon: MailCheck, tone: "text-emerald-300" },
          { label: "Failed", value: failed, icon: MailX, tone: "text-rose-300" },
          { label: "Scheduled reminders", value: reminders.filter((r) => r.status === "SCHEDULED").length, icon: BellRing, tone: "text-cyan-300" },
        ].map((item) => (
          <Card key={item.label} className="flex items-center gap-3 p-4">
            <div className={`grid size-10 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] ${item.tone}`}><item.icon className="size-5" /></div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">{item.label}</p>
              <p className="text-xl font-bold tabular-nums">{item.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-white/[0.07] px-5 py-4"><h2 className="text-sm font-bold">Recent emails</h2></div>
        {notifications.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="text-xs font-semibold">{event.event_type.replaceAll("_", " ").toLowerCase()}</TableCell>
                  <TableCell className="text-xs text-muted">{event.recipient}</TableCell>
                  <TableCell className="max-w-[240px] truncate text-xs text-muted">{event.subject ?? "—"}</TableCell>
                  <TableCell><Badge tone={event.status === "SENT" ? "teal" : event.status === "FAILED" ? "coral" : "neutral"}>{event.status.toLowerCase()}</Badge></TableCell>
                  <TableCell className="text-[11px] text-subtle">{format(new Date(event.created_at), "d MMM · HH:mm")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState icon={BellRing} title="No emails yet" description="Notification delivery will appear here once customers book." />
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-white/[0.07] px-5 py-4"><h2 className="text-sm font-bold">Reminder schedule</h2></div>
        {reminders.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Offset</TableHead>
                <TableHead>Scheduled for</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Sent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reminders.map((reminder) => (
                <TableRow key={reminder.id}>
                  <TableCell className="text-xs font-semibold">{reminder.offset_minutes} min before</TableCell>
                  <TableCell className="text-xs text-muted">{format(new Date(reminder.scheduled_for), "d MMM yyyy · HH:mm")}</TableCell>
                  <TableCell><Badge tone={reminder.status === "SENT" ? "teal" : reminder.status === "FAILED" ? "coral" : reminder.status === "CANCELLED" ? "neutral" : "cyan"}>{reminder.status.toLowerCase()}</Badge></TableCell>
                  <TableCell className="text-xs tabular-nums text-muted">{reminder.attempts}</TableCell>
                  <TableCell className="text-[11px] text-subtle">{reminder.sent_at ? format(new Date(reminder.sent_at), "d MMM · HH:mm") : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState icon={BellRing} title="No reminders scheduled" description="Reminders are scheduled automatically when a booking is confirmed." />
        )}
      </Card>
    </div>
  );
}
