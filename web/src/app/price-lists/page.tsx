import { AppShell } from "@/components/app-shell";
import { PriceListListView } from "@/components/price-list-pages";

export default function PriceListsPage() {
  return (
    <AppShell
      title="Price lists"
      subtitle="NDIS price lists with product prices. Products reference a list for their rates."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Price lists" }]}
    >
      <PriceListListView />
    </AppShell>
  );
}
