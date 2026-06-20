import { AppShell } from "@/components/app-shell";
import { GenerateInvoicesView } from "@/components/invoice-pages";

export default function GenerateInvoicesPage() {
  return (
    <AppShell
      title="Generate invoices"
      subtitle="Bulk-create draft invoices for plan-managed and self-managed participants."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Invoices", href: "/invoices" },
        { label: "Generate invoices" },
      ]}
      audit={{ moduleLabel: "Generate invoices" }}
    >
      <GenerateInvoicesView />
    </AppShell>
  );
}
