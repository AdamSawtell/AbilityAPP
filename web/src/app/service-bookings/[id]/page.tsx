import { ServiceBookingDetailView } from "@/components/service-booking-pages";

export default async function ServiceBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ServiceBookingDetailView id={id} />;
}
