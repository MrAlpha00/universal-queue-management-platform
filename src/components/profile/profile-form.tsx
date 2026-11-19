"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/label";
import { Input, SelectNative } from "@/components/ui/input";
import { updateProfile } from "@/app/(customer)/actions";
import type { Profile } from "@/types/domain";

const timezones = [
  "UTC", "Africa/Cairo", "Africa/Lagos", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "America/New_York", "America/Sao_Paulo", "Asia/Dubai",
  "Asia/Kolkata", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney",
  "Europe/Berlin", "Europe/London", "Europe/Paris",
];

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");
  const [fullName, setFullName] = React.useState(profile.full_name ?? "");
  const [phone, setPhone] = React.useState(profile.phone ?? "");
  const [avatarUrl, setAvatarUrl] = React.useState(profile.avatar_url ?? "");
  const [timezone, setTimezone] = React.useState(profile.timezone || "UTC");
  const [locale, setLocale] = React.useState(profile.locale || "en");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");
    startTransition(async () => {
      try {
        await updateProfile({ fullName, phone, avatarUrl, timezone, locale });
        setMessage("Profile saved.");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to save profile");
      }
    });
  }

  return (
    <form onSubmit={submit}>
      <Card className="p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" htmlFor="fullName">
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
          </Field>
          <Field label="Email address" hint="Managed by your authentication provider.">
            <Input value={profile.email ?? ""} disabled />
          </Field>
          <Field label="Phone number" htmlFor="phone">
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" />
          </Field>
          <Field label="Avatar URL" htmlFor="avatarUrl">
            <Input id="avatarUrl" type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="Timezone" htmlFor="timezone">
            <SelectNative id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {!timezones.includes(timezone) && <option value={timezone}>{timezone}</option>}
              {timezones.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </SelectNative>
          </Field>
          <Field label="Language" htmlFor="locale">
            <SelectNative id="locale" value={locale} onChange={(e) => setLocale(e.target.value)}>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
            </SelectNative>
          </Field>
        </div>

        {(message || error) && (
          <p className={`mt-5 rounded-xl border p-3 text-sm ${error ? "border-rose-400/25 bg-rose-500/10 text-rose-200" : "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"}`}>
            {error || message}
          </p>
        )}

        <div className="mt-6 flex justify-end">
          <Button type="submit" variant="cyan" loading={pending} disabled={pending}>
            {message ? <Check className="size-4" /> : <Save className="size-4" />} Save changes
          </Button>
        </div>
      </Card>
    </form>
  );
}
