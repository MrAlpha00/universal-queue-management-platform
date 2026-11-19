import { notFound } from "next/navigation";
import { BookingFlow } from "@/components/booking/booking-flow";
import { getBookingContext } from "@/services/availability";

export const dynamic = "force-dynamic";

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string }>;
}) {
  const { slug } = await params;
  const { service } = await searchParams;

  let context;
  try {
    context = await getBookingContext(slug);
  } catch {
    notFound();
  }

  return (
    <BookingFlow
      orgSlug={context.org.slug}
      orgName={context.org.name}
      branches={context.branches}
      services={context.services}
      days={context.days}
      initialServiceId={service}
    />
  );
}
