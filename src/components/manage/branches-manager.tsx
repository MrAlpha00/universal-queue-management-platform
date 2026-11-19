"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2, MapPin, Pencil, Plus, Power } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { saveBranch, toggleBranch } from "@/app/manage/[orgSlug]/actions";
import type { Branch } from "@/types/domain";

type Form = {
  id: string | null;
  name: string;
  slug: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  timezone: string;
};

const blank: Form = { id: null, name: "", slug: "", address: "", city: "", phone: "", email: "", timezone: "" };

export function BranchesManager({ orgSlug, branches }: { orgSlug: string; branches: Branch[] }) {
  const router = useRouter();
  const [form, setForm] = React.useState<Form | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState("");

  function submit() {
    if (!form) return;
    setError("");
    startTransition(async () => {
      try {
        await saveBranch(orgSlug, form.id, {
          name: form.name,
          slug: form.slug,
          address: form.address,
          city: form.city,
          phone: form.phone,
          email: form.email,
          timezone: form.timezone,
        });
        setForm(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to save branch");
      }
    });
  }

  function toggle(branch: Branch) {
    startTransition(async () => {
      try {
        await toggleBranch(orgSlug, branch.id, !branch.is_active);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to update branch");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">{branches.length} location{branches.length === 1 ? "" : "s"}</p>
        <Button variant="cyan" size="sm" onClick={() => { setError(""); setForm({ ...blank }); }}><Plus className="size-3.5" /> New branch</Button>
      </div>

      {error && <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {branches.map((branch) => (
          <Card key={branch.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="grid size-10 place-items-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-200">
                <Building2 className="size-5" />
              </div>
              <Badge tone={branch.is_active ? "teal" : "neutral"}>{branch.is_active ? "Active" : "Inactive"}</Badge>
            </div>
            <h3 className="mt-4 text-sm font-bold">{branch.name}</h3>
            <p className="mt-1 flex items-start gap-1.5 text-xs text-muted"><MapPin className="mt-0.5 size-3.5 shrink-0" /> {branch.address || branch.city || "No address provided"}</p>
            <p className="mt-1 text-[11px] text-subtle">{branch.timezone || "Organization timezone"}</p>
            <div className="mt-4 flex gap-1.5 border-t border-white/[0.07] pt-3">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]" onClick={() => { setError(""); setForm({
                id: branch.id,
                name: branch.name,
                slug: branch.slug,
                address: branch.address ?? "",
                city: branch.city ?? "",
                phone: branch.phone ?? "",
                email: branch.email ?? "",
                timezone: branch.timezone ?? "",
              }); }}><Pencil className="size-3" /> Edit</Button>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]" onClick={() => toggle(branch)}><Power className="size-3" /> {branch.is_active ? "Deactivate" : "Activate"}</Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={Boolean(form)} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form?.id ? "Edit branch" : "New branch"}</DialogTitle></DialogHeader>
          <DialogBody>
            {form && (
              <div className="grid gap-4">
                <Field label="Name" required htmlFor="branch-name"><Input id="branch-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                <Field label="Slug" hint="Leave blank to generate from the name." htmlFor="branch-slug"><Input id="branch-slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></Field>
                <Field label="Street address" htmlFor="branch-address"><Input id="branch-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="City" htmlFor="branch-city"><Input id="branch-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
                  <Field label="Timezone" htmlFor="branch-timezone"><Input id="branch-timezone" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} placeholder="Inherit from organization" /></Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Phone" htmlFor="branch-phone"><Input id="branch-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
                  <Field label="Email" htmlFor="branch-email"><Input id="branch-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                </div>
              </div>
            )}
            {error && <p className="mt-4 text-xs text-rose-300">{error}</p>}
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setForm(null)}>Cancel</Button>
            <Button variant="cyan" loading={pending} disabled={pending || !form?.name.trim()} onClick={submit}>Save branch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
