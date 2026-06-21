import { AppShell } from "@/components/app-shell";
import { MultiProviderBudgetView } from "@/components/multi-provider-budget-pages";

export default function MultiProviderBudgetPage() {
  return (
    <AppShell
      title="Multi-provider budget"
      subtitle="Compare plan budget allocations across NDIS providers."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Service planning", href: "/service-planning" },
        { label: "Multi-provider budget" },
      ]}
      audit={{ moduleLabel: "Multi-provider budget" }}
    >
      <MultiProviderBudgetView />
    </AppShell>
  );
}
