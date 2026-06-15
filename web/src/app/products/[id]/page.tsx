import { ProductDetailView } from "@/components/product-pages";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductDetailView key={id} id={id} />;
}
