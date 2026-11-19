import { format } from "date-fns";
import { ScrollText } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/misc";
import { getOrgContext } from "@/services/auth";
import { listAuditLogs } from "@/services/management";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { org } = await getOrgContext(orgSlug, "MANAGER");
  const logs = await listAuditLogs(org.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Accountability"
        title="Audit log"
        description="An immutable record of important actions taken in this organization."
      />

      <Card className="overflow-hidden">
        {logs.length ? (
          <ol className="divide-y divide-white/[0.06]">
            {logs.map((log) => (
              <li key={log.id} className="flex gap-4 p-4 transition hover:bg-white/[0.02]">
                <Avatar name={log.actor?.full_name} email={log.actor?.email} src={log.actor?.avatar_url} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="violet">{log.action.replaceAll("_", " ").toLowerCase()}</Badge>
                    <span className="text-[11px] text-subtle">{log.entity_type}{log.entity_id ? ` · ${log.entity_id.slice(0, 8)}` : ""}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted">
                    {log.actor?.full_name || log.actor?.email || "System"} · {format(new Date(log.created_at), "d MMM yyyy · HH:mm")}
                  </p>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <pre className="mt-2 overflow-x-auto rounded-lg border border-white/[0.06] bg-[#050711] p-2 text-[10px] text-subtle">{JSON.stringify(log.details, null, 0)}</pre>
                  )}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState icon={ScrollText} title="No activity recorded" description="Actions such as service updates, status changes and QR reissues will appear here." />
        )}
      </Card>
    </div>
  );
}
