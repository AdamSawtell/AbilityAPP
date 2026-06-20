import { AppShell } from "@/components/app-shell";
import { InvoiceListView } from "@/components/invoice-pages";

export default function InvoicesPage() {
  return (
    <AppShell
      title="Invoices"
      subtitle="Plan-managed and self-managed participant invoices from verified timesheet lines."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Invoices" }]}
      audit={{ moduleLabel: "Invoices" }}
    >
      <InvoiceListView />
    </AppShell>
  );
}
