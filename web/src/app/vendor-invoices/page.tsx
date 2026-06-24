import { AppShell } from "@/components/app-shell";
import { VendorInvoiceListView } from "@/components/vendor-invoice-pages";

export default function VendorInvoicesPage() {
  return (
    <AppShell
      title="Vendor invoices"
      subtitle="Agency vendor invoices submitted from the agency portal."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Vendor invoices" }]}
      audit={{ moduleLabel: "Vendor invoices" }}
    >
      <VendorInvoiceListView />
    </AppShell>
  );
}
