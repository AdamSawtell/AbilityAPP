import { AppShell } from "@/components/app-shell";
import { InvoiceReconciliationView } from "@/components/invoice-reconciliation-pages";

export default function InvoiceReconciliationPage() {
  return (
    <AppShell
      title="Invoice reconciliation"
      subtitle="Compare participant invoices to recorded payments."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Invoices", href: "/invoices" },
        { label: "Invoice reconciliation" },
      ]}
      audit={{ moduleLabel: "Invoice reconciliation" }}
    >
      <InvoiceReconciliationView />
    </AppShell>
  );
}
