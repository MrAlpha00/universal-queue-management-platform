"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Mail, Plus, ShieldCheck, Trash2, UserCog } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
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
import { Input, SelectNative } from "@/components/ui/input";
import { addMember, removeMember, updateMemberRole } from "@/app/manage/[orgSlug]/actions";
import type { MembershipRole } from "@/config/constants";
import type { OrganizationMember } from "@/types/domain";

const roles: MembershipRole[] = ["OWNER", "ADMIN", "MANAGER", "STAFF"];

export function StaffManager({
  orgSlug,
  members,
  currentUserId,
  canManage,
}: {
  orgSlug: string;
  members: OrganizationMember[];
  currentUserId: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<MembershipRole>("STAFF");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");

  function add() {
    setError("");
    startTransition(async () => {
      try {
        await addMember(orgSlug, { email, role });
        setOpen(false);
        setEmail("");
        setRole("STAFF");
        setNotice("Member added.");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to add member");
      }
    });
  }

  function changeRole(member: OrganizationMember, next: MembershipRole) {
    setError("");
    startTransition(async () => {
      try {
        await updateMemberRole(orgSlug, member.id, next);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to change role");
      }
    });
  }

  function remove(member: OrganizationMember) {
    setError("");
    startTransition(async () => {
      try {
        await removeMember(orgSlug, member.id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to remove member");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">{members.length} team member{members.length === 1 ? "" : "s"}</p>
        {canManage && <Button variant="cyan" size="sm" onClick={() => setOpen(true)}><Plus className="size-3.5" /> Add member</Button>}
      </div>

      {(error || notice) && (
        <p className={`rounded-xl border p-3 text-sm ${error ? "border-rose-400/25 bg-rose-500/10 text-rose-200" : "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"}`}>{error || notice}</p>
      )}

      <Card className="overflow-hidden">
        <ul className="divide-y divide-white/[0.06]">
          {members.map((member) => (
            <li key={member.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar name={member.profile?.full_name} email={member.profile?.email} src={member.profile?.avatar_url} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{member.profile?.full_name || member.profile?.email || "Team member"}</p>
                  <p className="truncate text-[11px] text-subtle">{member.profile?.email ?? "—"}</p>
                </div>
                {member.user_id === currentUserId && <Badge tone="neutral">You</Badge>}
              </div>
              <div className="flex items-center gap-2 sm:justify-end">
                {canManage && member.role !== "OWNER" ? (
                  <SelectNative value={member.role} onChange={(e) => changeRole(member, e.target.value as MembershipRole)} className="h-9 w-36 text-xs">
                    {roles.filter((r) => r !== "OWNER").map((r) => <option key={r} value={r}>{r}</option>)}
                  </SelectNative>
                ) : (
                  <Badge tone={member.role === "OWNER" ? "amber" : "violet"}>{member.role}</Badge>
                )}
                <Badge tone={member.membership_status === "ACTIVE" ? "teal" : "neutral"}>{member.membership_status}</Badge>
                {canManage && member.role !== "OWNER" && (
                  <Button variant="ghost" size="icon-sm" onClick={() => remove(member)} aria-label="Remove member"><Trash2 className="size-3.5 text-rose-300" /></Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add team member</DialogTitle></DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-xl border border-cyan-400/20 bg-cyan-500/[0.07] p-3 text-xs text-cyan-100">
                <Mail className="mt-0.5 size-4 shrink-0" />
                The person must already have a TokenFlow account with this email.
              </div>
              <Field label="Email address" required htmlFor="member-email"><Input id="member-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
              <Field label="Role" htmlFor="member-role">
                <SelectNative id="member-role" value={role} onChange={(e) => setRole(e.target.value as MembershipRole)}>
                  {roles.filter((r) => r !== "OWNER").map((r) => <option key={r} value={r}>{r}</option>)}
                </SelectNative>
              </Field>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-[11px] text-subtle">
                <p className="flex items-center gap-1.5 font-semibold text-muted"><ShieldCheck className="size-3.5" /> Role permissions</p>
                <p className="mt-1.5">ADMIN — manage services, staff and settings · MANAGER — operations and schedules · STAFF — queue, scanner and appointments.</p>
              </div>
              {error && <p className="text-xs text-rose-300">{error}</p>}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="cyan" loading={pending} disabled={pending || !email.trim()} onClick={add}><UserCog className="size-4" /> Add member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
