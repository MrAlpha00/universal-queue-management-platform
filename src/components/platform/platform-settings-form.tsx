"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  Save,
  ShieldCheck,
  UserPlus,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/toggle";
import { savePlatformSetting } from "@/app/platform/actions";
import { cn } from "@/lib/utils";

type Setting = {
  key: string;
  value: unknown;
  description: string | null;
  updated_at: string;
};

const metadata: Record<
  string,
  { label: string; description: string; icon: LucideIcon; type: "boolean" | "number" }
> = {
  auto_approve_organizations: {
    label: "Auto-approve organizations",
    description: "New organizations become public immediately without manual review.",
    icon: ShieldCheck,
    type: "boolean",
  },
  allow_public_registration: {
    label: "Allow public registration",
    description: "Let anyone create an organization from the marketing site.",
    icon: UserPlus,
    type: "boolean",
  },
  default_booking_horizon_days: {
    label: "Default booking horizon (days)",
    description: "Fallback horizon when an organization and its services have no override.",
    icon: CalendarClock,
    type: "number",
  },
  maintenance_mode: {
    label: "Maintenance mode",
    description: "Pause new public bookings while keeping the management console available.",
    icon: Wrench,
    type: "boolean",
  },
};

function initialValue(setting: Setting): string | number | boolean {
  if (typeof setting.value === "boolean") return setting.value;
  if (typeof setting.value === "number") return setting.value;
  if (typeof setting.value === "string") {
    return setting.value === "true" ? true : setting.value === "false" ? false : setting.value;
  }
  return JSON.stringify(setting.value);
}

export function PlatformSettingsForm({ settings }: { settings: Setting[] }) {
  const router = useRouter();
  const [draft, setDraft] = React.useState<Record<string, string | number | boolean>>(() =>
    Object.fromEntries(settings.map((setting) => [setting.key, initialValue(setting)])),
  );
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");

  const dirty = settings.some((setting) => {
    const current = draft[setting.key];
    return JSON.stringify(current) !== JSON.stringify(initialValue(setting));
  });

  function save() {
    setError("");
    setNotice("");
    startTransition(async () => {
      try {
        for (const setting of settings) {
          const current = draft[setting.key];
          const original = initialValue(setting);
          if (JSON.stringify(current) === JSON.stringify(original)) continue;
          await savePlatformSetting(
            setting.key,
            typeof setting.value === "number" ? Number(current) : current,
          );
        }
        setNotice("Platform settings saved.");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to save platform settings");
      }
    });
  }

  return (
    <div className="space-y-5">
      {(error || notice) && (
        <p
          className={cn(
            "rounded-xl border p-3 text-sm",
            error
              ? "border-rose-400/25 bg-rose-500/10 text-rose-200"
              : "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
          )}
        >
          {error || notice}
        </p>
      )}

      <Card className="overflow-hidden">
        <ul className="divide-y divide-white/[0.06]">
          {settings.map((setting) => {
            const meta =
              metadata[setting.key] ??
              ({
                label: setting.key.replaceAll("_", " "),
                description: setting.description ?? "Platform configuration value.",
                icon: Wrench,
                type: "boolean" as const,
              } satisfies (typeof metadata)[string]);
            const value = draft[setting.key];

            return (
              <li key={setting.key} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-amber-400/20 bg-amber-500/10 text-amber-200">
                  <meta.icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{meta.label}</p>
                  <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted">{meta.description}</p>
                  <p className="mt-1.5 text-[10px] uppercase tracking-wider text-subtle">
                    Updated {new Date(setting.updated_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3 sm:justify-end">
                  {meta.type === "boolean" ? (
                    <Switch
                      checked={Boolean(value)}
                      onCheckedChange={(checked) => setDraft({ ...draft, [setting.key]: checked })}
                      aria-label={meta.label}
                    />
                  ) : (
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      value={Number(value)}
                      onChange={(event) =>
                        setDraft({ ...draft, [setting.key]: Number(event.target.value) })
                      }
                      className="h-10 w-28"
                      aria-label={meta.label}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-xs text-subtle">
          Changes apply platform-wide and are recorded in the audit log.
        </p>
        <Button variant="cyan" loading={pending} disabled={pending || !dirty} onClick={save}>
          <Save className="size-4" /> Save changes
        </Button>
      </div>
    </div>
  );
}
