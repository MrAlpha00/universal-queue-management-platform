"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, ShieldCheck, ShieldOff, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { setUserPlatformRole } from "@/app/platform/actions";
import type { Profile } from "@/types/domain";
import { cn } from "@/lib/utils";

type Membership = {
  user_id: string;
  role: string;
  org_id: string;
  organizations: { name: string; slug: string } | null;
};

const filters = ["ALL", "PLATFORM_ADMIN", "USER"] as const;

export function PlatformUsersTable({
  users,
  memberships,
  currentUserId,
}: {
  users: Profile[];
  memberships: Membership[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<(typeof filters)[number]>("ALL");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");

  const membershipsByUser = React.useMemo(() => {
    const map = new Map<string, Membership[]>();
    for (const membership of memberships) {
      const list = map.get(membership.user_id) ?? [];
      list.push(membership);
      map.set(membership.user_id, list);
    }
    return map;
  }, [memberships]);

  const filtered = users.filter((user) => {
    if (filter !== "ALL" && user.platform_role !== filter) return false;
    if (!query.trim()) return true;
    const term = query.toLowerCase();
    return (
      (user.full_name ?? "").toLowerCase().includes(term) ||
      (user.email ?? "").toLowerCase().includes(term)
    );
  });

  async function change(user: Profile, role: "USER" | "PLATFORM_ADMIN") {
    setBusyId(user.id);
    setError("");
    try {
      await setUserPlatformRole(user.id, role);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update platform role");
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
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or email…"
              className="pl-10"
            />
          </div>
          <div className="flex gap-1.5">
            {filters.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition",
                  filter === value
                    ? "border-amber-400/40 bg-amber-500/12 text-amber-100"
                    : "border-white/10 bg-white/[0.025] text-muted hover:text-foreground",
                )}
              >
                {value === "ALL" ? "All users" : value === "PLATFORM_ADMIN" ? "Platform admins" : "Users"}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {error && (
        <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>
      )}

      <Card className="overflow-hidden">
        {filtered.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Person</TableHead>
                <TableHead>Organizations</TableHead>
                <TableHead>Platform role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Access</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => {
                const orgs = membershipsByUser.get(user.id) ?? [];
                const isSelf = user.id === currentUserId;
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={user.full_name} email={user.email} src={user.avatar_url} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {user.full_name || user.email || "Unnamed user"}
                            {isSelf && <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-amber-300">You</span>}
                          </p>
                          <p className="truncate text-[11px] text-subtle">{user.email ?? "—"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {orgs.length ? (
                        <div className="flex max-w-[260px] flex-wrap gap-1">
                          {orgs.slice(0, 2).map((membership) => (
                            <Badge key={`${membership.org_id}-${membership.role}`} tone="violet">
                              {membership.organizations?.name ?? "Organization"} · {membership.role.toLowerCase()}
                            </Badge>
                          ))}
                          {orgs.length > 2 && <Badge tone="neutral">+{orgs.length - 2}</Badge>}
                        </div>
                      ) : (
                        <span className="text-xs text-subtle">No memberships</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge tone={user.platform_role === "PLATFORM_ADMIN" ? "amber" : "neutral"}>
                        {user.platform_role === "PLATFORM_ADMIN" ? (
                          <><ShieldCheck className="size-3" /> Platform admin</>
                        ) : (
                          "User"
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[11px] text-subtle">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {busyId === user.id ? (
                        <Loader2 className="ml-auto size-4 animate-spin text-subtle" />
                      ) : user.platform_role === "PLATFORM_ADMIN" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isSelf}
                          title={isSelf ? "You cannot remove your own platform access" : "Remove platform access"}
                          onClick={() => change(user, "USER")}
                        >
                          <ShieldOff className="size-3.5 text-rose-300" /> Remove access
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => change(user, "PLATFORM_ADMIN")}>
                          <ShieldCheck className="size-3.5 text-amber-300" /> Grant access
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <EmptyState icon={Users} title="No users found" description="Try a different search term or filter." />
        )}
      </Card>
    </div>
  );
}
