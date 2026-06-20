import { AppShell } from "@/components/app-shell";
import { PlanReconciliationView } from "@/components/plan-reconciliation-pages";

export default function PlanReconciliationPage() {
  return (
    <AppShell
      title="Plan reconciliation"
      subtitle="Compare monthly service plans to delivered hours and billed amounts."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Service planning", href: "/service-planning" },
        { label: "Plan reconciliation" },
      ]}
      audit={{ moduleLabel: "Plan reconciliation" }}
    >
      <PlanReconciliationView />
    </AppShell>
  );
}
