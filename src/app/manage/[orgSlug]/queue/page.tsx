import Link from "next/link";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { QrCode } from "lucide-react";
import { QueueBoard } from "@/components/manage/queue-board";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/misc";
import { getOrgContext } from "@/services/auth";
import { getQueueAppointments } from "@/services/management";

export const dynamic = "force-dynamic";

export default async function QueuePage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { org } = await getOrgContext(orgSlug, "MEMBER");
  const today = format(toZonedTime(new Date(), org.timezone), "yyyy-MM-dd");
  const appointments = await getQueueAppointments(org.id, today);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Live operations"
        title="Daily queue"
        description={`${format(toZonedTime(new Date(), org.timezone), "EEEE, d MMMM yyyy")} · ${org.timezone}`}
        actions={
          <Button asChild variant="cyan" size="sm">
            <Link href={`/manage/${orgSlug}/scanner`}><QrCode className="size-3.5" /> QR scanner</Link>
          </Button>
        }
      />
      <QueueBoard appointments={appointments} orgSlug={orgSlug} />
    </div>
  );
}
