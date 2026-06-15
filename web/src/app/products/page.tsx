import { AppShell } from "@/components/app-shell";
import { ProductListView } from "@/components/product-pages";

export default function ProductsPage() {
  return (
    <AppShell
      title="Products"
      subtitle="NDIS support products and services. Assign a price list to each product."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Products" }]}
      audit={{ moduleLabel: "Products" }}
    >
      <ProductListView />
    </AppShell>
  );
}
