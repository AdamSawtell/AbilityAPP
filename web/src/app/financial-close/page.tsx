import { AppShell } from "@/components/app-shell";
import { FinancialCloseView } from "@/components/financial-close-pages";

export default function FinancialClosePage() {
  return (
    <AppShell
      title="Financial close"
      subtitle="Month-end checklist for plan, billing, and payroll reconciliation."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Reports", href: "/reports" },
        { label: "Financial close" },
      ]}
      audit={{ moduleLabel: "Financial close" }}
    >
      <FinancialCloseView />
    </AppShell>
  );
}
