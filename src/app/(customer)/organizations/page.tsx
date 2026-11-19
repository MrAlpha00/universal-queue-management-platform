import Link from "next/link";
import { ArrowRight, Building2, MapPin, Search, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/misc";
import { listPublicOrganizations } from "@/services/organizations";

export const dynamic = "force-dynamic";

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const organizations = await listPublicOrganizations(q);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Directory"
        title="Explore organizations"
        description="Discover approved providers and book your next visit in seconds."
      />

      <Card className="p-4 sm:p-5">
        <form action="/organizations" method="get" className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <Input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search by name or description…"
              className="pl-10"
              aria-label="Search organizations"
            />
          </div>
          <Button type="submit" variant="cyan">
            Search <ArrowRight className="size-4" />
          </Button>
        </form>
      </Card>

      {organizations.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {organizations.map((org) => (
            <Link key={org.id} href={`/organizations/${org.slug}`} className="group">
              <Card className="flex h-full flex-col p-5 transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/30 hover:shadow-[0_20px_60px_-30px_rgba(139,92,246,0.6)]">
                <div className="flex items-start gap-3">
                  <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-violet-400/25 bg-violet-500/10 text-violet-200">
                    {org.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={org.logo_url} alt="" className="size-full rounded-xl object-cover" />
                    ) : (
                      <Building2 className="size-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold text-foreground group-hover:text-violet-100">
                      {org.name}
                    </h3>
                    <p className="truncate text-[11px] text-subtle">/{org.slug}</p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-subtle transition group-hover:translate-x-0.5 group-hover:text-violet-300" />
                </div>
                <p className="mt-4 line-clamp-3 min-h-[3.75rem] text-xs leading-relaxed text-muted">
                  {org.description || "This organization has not added a description yet."}
                </p>
                <div className="mt-4 flex items-center gap-1.5 border-t border-white/[0.07] pt-4 text-[11px] text-subtle">
                  <MapPin className="size-3.5" />
                  <span className="truncate">{org.address || org.timezone}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Store}
          title="No organizations found"
          description={q ? `No approved organizations match “${q}”. Try a different search.` : "No organizations have been approved yet. Check back soon."}
          action={q ? <Button asChild variant="secondary"><Link href="/organizations">Clear search</Link></Button> : undefined}
        />
      )}
    </div>
  );
}
