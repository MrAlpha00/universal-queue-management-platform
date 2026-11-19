"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, Loader2, Pause, Search, X } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { setOrganizationStatus } from "@/app/platform/actions";
import type { Organization } from "@/types/domain";
import { cn } from "@/lib/utils";

const filters = ["ALL", "PENDING", "APPROVED", "SUSPENDED", "REJECTED"];

export function PlatformOrganizationsTable({
  organizations,
}: {
  organizations: Array<Organization & { owner?: { full_name: string | null; email: string | null } | null }>;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("ALL");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");

  const filtered = organizations.filter((org) => {
    if (status !== "ALL" && org.status !== status) return false;
    if (!query.trim()) return true;
    const term = query.toLowerCase();
    return org.name.toLowerCase().includes(term) || org.slug.toLowerCase().includes(term);
  });

  async function change(id: string, next: "APPROVED" | "SUSPENDED" | "REJECTED" | "PENDING") {
    setBusyId(id);
    setError("");
    try {
      await setOrganizationStatus(id, next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update organization");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search organizations…" className="pl-10" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {filters.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatus(value)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition",
                  status === value ? "border-amber-400/40 bg-amber-500/12 text-amber-100" : "border-white/10 bg-white/[0.025] text-muted hover:text-foreground",
                )}
              >
                {value === "ALL" ? "All" : value.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {error && <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}

      <Card className="overflow-hidden">
        {filtered.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Timezone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-violet-400/20 bg-violet-500/10 text-violet-200"><Building2 className="size-4" /></div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{org.name}</p>
                        <p className="truncate text-[11px] text-subtle">/{org.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs">{org.owner?.full_name ?? "—"}</p>
                    <p className="text-[11px] text-subtle">{org.owner?.email ?? org.email ?? "—"}</p>
                  </TableCell>
                  <TableCell className="text-xs text-muted">{org.timezone}</TableCell>
                  <TableCell><StatusBadge status={org.status} /></TableCell>
                  <TableCell className="text-[11px] text-subtle">{new Date(org.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    {busyId === org.id ? (
                      <Loader2 className="ml-auto size-4 animate-spin text-subtle" />
                    ) : (
                      <div className="flex justify-end gap-1">
                        {org.status !== "APPROVED" && (
                          <Button variant="ghost" size="icon-sm" title="Approve" onClick={() => change(org.id, "APPROVED")}><Check className="size-3.5 text-emerald-300" /></Button>
                        )}
                        {org.status === "APPROVED" && (
                          <Button variant="ghost" size="icon-sm" title="Suspend" onClick={() => change(org.id, "SUSPENDED")}><Pause className="size-3.5 text-amber-300" /></Button>
                        )}
                        {org.status !== "REJECTED" && (
                          <Button variant="ghost" size="icon-sm" title="Reject" onClick={() => change(org.id, "REJECTED")}><X className="size-3.5 text-rose-300" /></Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState icon={Building2} title="No organizations found" description="Try adjusting the filter or search term." />
        )}
      </Card>
    </div>
  );
}
