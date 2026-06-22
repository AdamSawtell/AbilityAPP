import { BusinessPartnerDetailView } from "@/components/business-partner-pages";

export default async function BusinessPartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BusinessPartnerDetailView id={id} />;
}
