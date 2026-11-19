import { Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
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
import { getOrgContext } from "@/services/auth";
import { listOrgCustomers } from "@/services/management";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { org } = await getOrgContext(orgSlug, "MEMBER");
  const customers = await listOrgCustomers(org.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Relationships"
        title="Customers"
        description="People who have booked with your organization."
      />

      <Card className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle">Unique customers</p>
          <p className="mt-1 text-xl font-bold tabular-nums">{customers.length}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle">Total visits</p>
          <p className="mt-1 text-xl font-bold tabular-nums">{customers.reduce((sum, c) => sum + c.visits, 0)}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle">Repeat customers</p>
          <p className="mt-1 text-xl font-bold tabular-nums">{customers.filter((c) => c.visits > 1).length}</p>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {customers.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Visits</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Last visit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={customer.full_name} email={customer.email} src={customer.avatar_url} />
                      <span className="font-medium">{customer.full_name || "Customer"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs">{customer.email ?? "—"}</p>
                    <p className="text-[11px] text-subtle">{customer.phone ?? ""}</p>
                  </TableCell>
                  <TableCell className="text-xs font-semibold tabular-nums">{customer.visits}</TableCell>
                  <TableCell className="text-xs tabular-nums text-muted">{customer.completed}</TableCell>
                  <TableCell className="text-xs text-muted">{customer.last_visit ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState icon={Users} title="No customers yet" description="Customers appear here after their first booking." />
        )}
      </Card>
    </div>
  );
}
