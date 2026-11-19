import { format } from "date-fns";
import { ScrollText } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/misc";
import { listPlatformActivity } from "@/services/platform";

export const dynamic = "force-dynamic";

export default async function PlatformActivityPage() {
  const activity = await listPlatformActivity(250);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Accountability"
        title="Platform activity"
        description="An immutable audit trail of administrative actions across organizations and the platform console."
      />

      <Card className="overflow-hidden">
        {activity.length ? (
          <ol className="divide-y divide-white/[0.06]">
            {activity.map((event) => (
              <li key={event.id} className="flex gap-4 p-4 transition hover:bg-white/[0.02]">
                <Avatar name={event.actor?.full_name} email={event.actor?.email} src={event.actor?.avatar_url} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="violet">{event.action.replaceAll("_", " ").toLowerCase()}</Badge>
                    <span className="text-[11px] text-subtle">
                      {event.organization?.name ?? "Platform"} · {event.entity_type}
                      {event.entity_id ? ` · ${event.entity_id.slice(0, 8)}` : ""}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted">
                    {event.actor?.full_name || event.actor?.email || "System"} ·{" "}
                    {format(new Date(event.created_at), "d MMM yyyy · HH:mm")}
                  </p>
                  {event.details && Object.keys(event.details).length > 0 && (
                    <pre className="mt-2 overflow-x-auto rounded-lg border border-white/[0.06] bg-[#050711] p-2 text-[10px] text-subtle">
                      {JSON.stringify(event.details)}
                    </pre>
                  )}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState
            icon={ScrollText}
            title="No activity yet"
            description="Organization approvals, role changes and settings updates will be recorded here."
          />
        )}
      </Card>
    </div>
  );
}
