import { QrScanner } from "@/components/manage/qr-scanner";
import { PageHeader } from "@/components/ui/misc";
import { getOrgContext } from "@/services/auth";
import { listOrgBranches } from "@/services/management";

export const dynamic = "force-dynamic";

export default async function ScannerPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { org } = await getOrgContext(orgSlug, "MEMBER");
  const branches = await listOrgBranches(org.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Check-in"
        title="QR scanner"
        description="Verify customer tokens at the door. Duplicate check-ins are blocked automatically."
      />
      <QrScanner orgSlug={orgSlug} branches={branches.filter((b) => b.is_active).map((b) => ({ id: b.id, name: b.name }))} />
    </div>
  );
}
