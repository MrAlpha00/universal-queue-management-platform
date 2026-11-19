"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2, Save, SlidersHorizontal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/label";
import { Input, SelectNative, Textarea } from "@/components/ui/input";
import {
  expireStaleTokens,
  updateOrgProfile,
  updateOrgSettings,
} from "@/app/manage/[orgSlug]/actions";
import type { Organization } from "@/types/domain";

const timezones = [
  "UTC", "Africa/Cairo", "Africa/Lagos", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "America/New_York", "America/Sao_Paulo", "Asia/Dubai",
  "Asia/Kolkata", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney",
  "Europe/Berlin", "Europe/London", "Europe/Paris",
];

export function OrgSettingsForm({
  orgSlug,
  org,
  canManage,
}: {
  orgSlug: string;
  org: Organization;
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");

  const [profile, setProfile] = React.useState({
    name: org.name,
    description: org.description ?? "",
    website: org.website ?? "",
    email: org.email ?? "",
    phone: org.phone ?? "",
    address: org.address ?? "",
    timezone: org.timezone,
    logoUrl: org.logo_url ?? "",
  });

  const [settings, setSettings] = React.useState({
    bookingHorizonDays: Number(org.settings?.booking_horizon_days ?? 3),
    tokenPrefix: String(org.settings?.token_prefix ?? "TK"),
    checkinEarlyMinutes: Number(org.settings?.checkin_early_minutes ?? 0),
    checkinGraceMinutes: Number(org.settings?.checkin_grace_minutes ?? 0),
    reminderOffsets: ((org.settings?.reminder_offsets_minutes as number[] | undefined) ?? [60]).join(", "),
  });

  function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");
    startTransition(async () => {
      try {
        await updateOrgProfile(orgSlug, profile);
        setMessage("Organization profile saved.");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to save profile");
      }
    });
  }

  function saveSettings(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");
    startTransition(async () => {
      try {
        await updateOrgSettings(orgSlug, settings);
        setMessage("Booking settings saved.");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to save settings");
      }
    });
  }

  function expire() {
    setMessage("");
    setError("");
    startTransition(async () => {
      try {
        const result = await expireStaleTokens(orgSlug);
        setMessage(`${result.count} stale token${result.count === 1 ? "" : "s"} expired.`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to expire tokens");
      }
    });
  }

  if (!canManage) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted">Only organization owners and administrators can edit settings.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {(message || error) && (
        <p className={`rounded-xl border p-3 text-sm ${error ? "border-rose-400/25 bg-rose-500/10 text-rose-200" : "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"}`}>{error || message}</p>
      )}

      <form onSubmit={saveProfile}>
        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-sm font-bold"><Building2 className="size-4 text-violet-300" /> Organization profile</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Name" required htmlFor="org-name"><Input id="org-name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></Field>
            <Field label="Public slug" hint="Contact support to change your public URL."><Input value={org.slug} disabled /></Field>
            <Field label="Description" className="sm:col-span-2" htmlFor="org-description"><Textarea id="org-description" value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })} /></Field>
            <Field label="Website" htmlFor="org-website"><Input id="org-website" type="url" value={profile.website} onChange={(e) => setProfile({ ...profile, website: e.target.value })} placeholder="https://" /></Field>
            <Field label="Logo URL" htmlFor="org-logo"><Input id="org-logo" type="url" value={profile.logoUrl} onChange={(e) => setProfile({ ...profile, logoUrl: e.target.value })} placeholder="https://" /></Field>
            <Field label="Support email" htmlFor="org-email"><Input id="org-email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></Field>
            <Field label="Phone" htmlFor="org-phone"><Input id="org-phone" type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></Field>
            <Field label="Address" className="sm:col-span-2" htmlFor="org-address"><Input id="org-address" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} /></Field>
            <Field label="Timezone" htmlFor="org-timezone">
              <SelectNative id="org-timezone" value={profile.timezone} onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}>
                {!timezones.includes(profile.timezone) && <option value={profile.timezone}>{profile.timezone}</option>}
                {timezones.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </SelectNative>
            </Field>
          </div>
          <div className="mt-5 flex justify-end"><Button type="submit" variant="cyan" loading={pending} disabled={pending}><Save className="size-4" /> Save profile</Button></div>
        </Card>
      </form>

      <form onSubmit={saveSettings}>
        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-sm font-bold"><SlidersHorizontal className="size-4 text-cyan-300" /> Booking rules</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Booking horizon (days)" hint="How far ahead customers can book." htmlFor="org-horizon">
              <Input id="org-horizon" type="number" min={1} max={365} value={settings.bookingHorizonDays} onChange={(e) => setSettings({ ...settings, bookingHorizonDays: Number(e.target.value) })} />
            </Field>
            <Field label="Token prefix" hint="Printed before the daily sequence number." htmlFor="org-prefix">
              <Input id="org-prefix" value={settings.tokenPrefix} onChange={(e) => setSettings({ ...settings, tokenPrefix: e.target.value })} maxLength={6} />
            </Field>
            <Field label="Check-in early window (minutes)" htmlFor="org-early">
              <Input id="org-early" type="number" min={0} max={240} value={settings.checkinEarlyMinutes} onChange={(e) => setSettings({ ...settings, checkinEarlyMinutes: Number(e.target.value) })} />
            </Field>
            <Field label="Check-in grace (minutes)" htmlFor="org-grace">
              <Input id="org-grace" type="number" min={0} max={240} value={settings.checkinGraceMinutes} onChange={(e) => setSettings({ ...settings, checkinGraceMinutes: Number(e.target.value) })} />
            </Field>
            <Field label="Reminder offsets (minutes)" className="sm:col-span-2" hint="Comma-separated, e.g. 120, 60, 15." htmlFor="org-reminders">
              <Input id="org-reminders" value={settings.reminderOffsets} onChange={(e) => setSettings({ ...settings, reminderOffsets: e.target.value })} />
            </Field>
          </div>
          <div className="mt-5 flex justify-end"><Button type="submit" variant="cyan" loading={pending} disabled={pending}><Save className="size-4" /> Save rules</Button></div>
        </Card>
      </form>

      <Card className="p-6">
        <h2 className="flex items-center gap-2 text-sm font-bold"><Sparkles className="size-4 text-amber-300" /> Maintenance</h2>
        <p className="mt-2 text-xs text-muted">Expire bookings whose time window has passed. This keeps queue and analytics accurate.</p>
        <Button variant="secondary" size="sm" className="mt-4" loading={pending} disabled={pending} onClick={expire}>Expire stale tokens</Button>
      </Card>
    </div>
  );
}
