import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Ticket } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/misc";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/services/auth";

export const dynamic = "force-dynamic";

type TokenRow = {
  id: string;
  token_number: string;
  status: string;
  appointment_date: string;
  issued_at: string;
  appointment: {
    start_time: string;
    end_time: string;
    customer: { full_name: string | null; email: string | null } | null;
    service: { name: string } | null;
  } | null;
};

export default async function TokensPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { orgSlug } = await params;
  const { status = "ALL" } = await searchParams;
  const { org } = await getOrgContext(orgSlug, "MEMBER");
  const supabase = await createClient();

  let query = supabase
    .from("tokens")
    .select(`
      id, token_number, status, appointment_date, issued_at,
      appointment:appointments(
        start_time, end_time,
        customer:profiles(full_name, email),
        service:services(name)
      )
    `)
    .eq("org_id", org.id)
    .order("issued_at", { ascending: false })
    .limit(200);
  if (status !== "ALL") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;
  const tokens = (data ?? []) as unknown as TokenRow[];
  const today = format(toZonedTime(new Date(), org.timezone), "yyyy-MM-dd");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Token lifecycle"
        title="Tokens"
        description="Every token issued by your organization, with its current lifecycle state."
      />

      <Card className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
        {[
          { label: "Today's tokens", value: tokens.filter((t) => t.appointment_date === today).length },
          { label: "Active", value: tokens.filter((t) => ["BOOKED", "CHECKED_IN", "IN_PROGRESS"].includes(t.status)).length },
          { label: "Completed", value: tokens.filter((t) => t.status === "COMPLETED").length },
          { label: "Expired / cancelled", value: tokens.filter((t) => ["EXPIRED", "CANCELLED", "NO_SHOW"].includes(t.status)).length },
        ].map((item) => (
          <div key={item.label}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle">{item.label}</p>
            <p className="mt-1 text-xl font-bold tabular-nums">{item.value}</p>
          </div>
        ))}
      </Card>

      <div className="flex flex-wrap gap-1.5">
        {["ALL", "BOOKED", "CHECKED_IN", "IN_PROGRESS", "COMPLETED", "EXPIRED", "CANCELLED"].map((value) => (
          <a
            key={value}
            href={`/manage/${orgSlug}/tokens?status=${value}`}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
              status === value
                ? "border-violet-400/40 bg-violet-500/12 text-violet-100"
                : "border-white/10 bg-white/[0.025] text-muted hover:text-foreground"
            }`}
          >
            {value === "ALL" ? "All" : value.replaceAll("_", " ").toLowerCase()}
          </a>
        ))}
      </div>

      <Card className="overflow-hidden">
        {tokens.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Window</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issued</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tokens.map((token) => (
                <TableRow key={token.id}>
                  <TableCell className="font-mono text-xs font-bold text-violet-200">{token.token_number}</TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{token.appointment?.customer?.full_name || "Customer"}</p>
                    <p className="text-[11px] text-subtle">{token.appointment?.customer?.email ?? "—"}</p>
                  </TableCell>
                  <TableCell className="text-muted">{token.appointment?.service?.name ?? "—"}</TableCell>
                  <TableCell className="text-xs">{token.appointment_date}</TableCell>
                  <TableCell className="text-xs">{token.appointment?.start_time?.slice(0, 5)} – {token.appointment?.end_time?.slice(0, 5)}</TableCell>
                  <TableCell><StatusBadge status={token.status as never} /></TableCell>
                  <TableCell className="text-[11px] text-subtle">{format(new Date(token.issued_at), "d MMM · HH:mm")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState icon={Ticket} title="No tokens yet" description="Tokens are issued automatically when customers book appointments." />
        )}
      </Card>
    </div>
  );
}
