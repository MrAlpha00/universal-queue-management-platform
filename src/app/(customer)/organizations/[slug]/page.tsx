import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Building2, Clock3, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/misc";
import { getPublicOrganizationDetail } from "@/services/organizations";

export const dynamic = "force-dynamic";

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await getPublicOrganizationDetail(slug);
  if (!detail) notFound();

  const { org, branches, services } = detail;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-violet-400/25 bg-violet-500/10 text-violet-200">
            {org.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={org.logo_url} alt="" className="size-full object-cover" />
            ) : (
              <Building2 className="size-6" />
            )}
          </div>
          <div>
            <Badge tone="teal">Approved organization</Badge>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{org.name}</h1>
            <p className="mt-1 text-sm text-muted">/{org.slug}</p>
          </div>
        </div>
        <Button asChild variant="cyan" size="lg">
          <Link href={`/book/${org.slug}`}>
            Book an appointment <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-base font-bold">About</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {org.description || "This organization has not provided a description yet."}
            </p>
            <Separator className="my-5" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-2.5 text-sm">
                <MapPin className="mt-0.5 size-4 shrink-0 text-violet-300" />
                <span className="text-muted">{org.address || "Address not provided"}</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm">
                <Clock3 className="mt-0.5 size-4 shrink-0 text-cyan-300" />
                <span className="text-muted">Timezone: {org.timezone}</span>
              </div>
              {org.email && (
                <div className="flex items-start gap-2.5 text-sm">
                  <Users className="mt-0.5 size-4 shrink-0 text-teal-300" />
                  <span className="text-muted">{org.email}</span>
                </div>
              )}
              {org.website && (
                <a href={org.website} target="_blank" rel="noreferrer" className="flex items-start gap-2.5 text-sm text-cyan-300 hover:underline">
                  <ArrowRight className="mt-0.5 size-4 shrink-0" />
                  <span className="truncate">{org.website}</span>
                </a>
              )}
            </div>
          </Card>

          <div>
            <h2 className="mb-4 text-base font-bold">Services</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {services.map((service) => (
                <Card key={service.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-bold">{service.name}</h3>
                    <Badge tone="violet">{service.duration_minutes} min</Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">
                    {service.description || "No description available."}
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-3 text-[11px] text-subtle">
                    <span>Capacity {service.capacity}/slot</span>
                    <Link href={`/book/${org.slug}?service=${service.id}`} className="font-semibold text-cyan-300 hover:text-cyan-200">
                      Select →
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <Card className="h-fit p-5">
          <h2 className="text-sm font-bold">Locations</h2>
          <div className="mt-4 space-y-3">
            {branches.map((branch) => (
              <div key={branch.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                <p className="text-xs font-semibold text-foreground">{branch.name}</p>
                <p className="mt-1 text-[11px] text-subtle">{branch.address || branch.city || "Address not provided"}</p>
              </div>
            ))}
          </div>
          <Button asChild className="mt-5 w-full" variant="secondary">
            <Link href={`/book/${org.slug}`}>See availability</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
