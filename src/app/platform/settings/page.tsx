import { AlertTriangle } from "lucide-react";
import { PlatformSettingsForm } from "@/components/platform/platform-settings-form";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { getPlatformSettings } from "@/services/platform";

export const dynamic = "force-dynamic";

export default async function PlatformSettingsPage() {
  const settings = await getPlatformSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuration"
        title="Platform settings"
        description="Global switches that shape registration, approvals and booking availability."
      />

      <Card className="flex items-start gap-3 border-amber-400/20 bg-amber-500/[0.06] p-4">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-300" />
        <div>
          <p className="text-sm font-semibold text-amber-100">Handle with care</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-100/70">
            These values affect every organization. Prefer organization-level overrides for
            day-to-day booking rules and keep maintenance mode for planned outages only.
          </p>
        </div>
      </Card>

      <PlatformSettingsForm settings={settings} />
    </div>
  );
}
