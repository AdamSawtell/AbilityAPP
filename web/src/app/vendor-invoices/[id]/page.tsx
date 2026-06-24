import { VendorInvoiceDetailView } from "@/components/vendor-invoice-pages";

export default async function VendorInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VendorInvoiceDetailView id={id} />;
}
