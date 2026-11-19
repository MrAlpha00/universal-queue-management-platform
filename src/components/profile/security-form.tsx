"use client";

import * as React from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { changePassword } from "@/app/(customer)/actions";

export function SecurityForm() {
  const [pending, startTransition] = React.useTransition();
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    startTransition(async () => {
      try {
        await changePassword({ currentPassword, newPassword });
        setMessage("Password updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to update password");
      }
    });
  }

  return (
    <Card className="p-6">
      <h2 className="flex items-center gap-2 text-sm font-bold"><KeyRound className="size-4 text-violet-300" /> Change password</h2>
      <p className="mt-1 text-xs text-muted">Use at least 8 characters. You will stay signed in on this device.</p>
      <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-3">
        <Field label="Current password" htmlFor="currentPassword">
          <Input id="currentPassword" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
        </Field>
        <Field label="New password" htmlFor="newPassword">
          <Input id="newPassword" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} required />
        </Field>
        <Field label="Confirm password" htmlFor="confirmPassword">
          <Input id="confirmPassword" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} required />
        </Field>
        {(message || error) && (
          <p className={`sm:col-span-3 rounded-xl border p-3 text-sm ${error ? "border-rose-400/25 bg-rose-500/10 text-rose-200" : "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"}`}>
            {error || message}
          </p>
        )}
        <div className="sm:col-span-3 flex justify-end">
          <Button type="submit" variant="secondary" loading={pending} disabled={pending}>Update password</Button>
        </div>
      </form>
    </Card>
  );
}
