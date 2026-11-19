import Link from "next/link";
import { BellRing, Globe2, LockKeyhole, Settings2 } from "lucide-react";
import { SecurityForm } from "@/components/profile/security-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader, Separator } from "@/components/ui/misc";
import { requireSession } from "@/services/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireSession();

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Account" title="Settings" description="Manage your preferences, notifications and account security." />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <SecurityForm />

          <Card className="p-6">
            <h2 className="flex items-center gap-2 text-sm font-bold"><BellRing className="size-4 text-cyan-300" /> Email notifications</h2>
            <p className="mt-1 text-xs text-muted">Booking confirmations, reminders and status updates are sent to your account email.</p>
            <div className="mt-5 space-y-3">
              {[
                { label: "Booking confirmation", detail: "Sent immediately after you book." },
                { label: "Appointment reminders", detail: "Configured per organization before your visit." },
                { label: "Status changes", detail: "Check-in, completion, reschedule and cancellation." },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <div>
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="mt-0.5 text-xs text-muted">{item.detail}</p>
                  </div>
                  <Badge tone="teal">On</Badge>
                </div>
              ))}
            </div>
            <Separator className="my-5" />
            <p className="text-xs text-subtle">Your notification address: <span className="font-semibold text-foreground">{session.email}</span></p>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold"><Globe2 className="size-4 text-teal-300" /> Regional</h2>
            <dl className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between gap-3"><dt className="text-muted">Timezone</dt><dd className="font-semibold">{session.profile.timezone}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Language</dt><dd className="font-semibold uppercase">{session.profile.locale}</dd></div>
            </dl>
            <Link href="/profile" className="mt-5 inline-block text-xs font-semibold text-cyan-300 hover:underline">Edit in profile →</Link>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold"><LockKeyhole className="size-4 text-amber-300" /> Privacy</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Your QR reference rotates and only its hash is stored. Organization staff can only see tokens for their own branch.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold"><Settings2 className="size-4 text-violet-300" /> Workspace access</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted">Manage an organization? Switch to its management workspace.</p>
            <Link href="/organizations" className="mt-4 inline-block text-xs font-semibold text-cyan-300 hover:underline">Browse organizations →</Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
