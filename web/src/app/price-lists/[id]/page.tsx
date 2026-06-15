import { PriceListDetailView } from "@/components/price-list-pages";

export default async function PriceListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PriceListDetailView key={id} id={id} />;
}
