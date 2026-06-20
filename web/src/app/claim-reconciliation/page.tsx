import { AppShell } from "@/components/app-shell";
import { ClaimReconciliationView } from "@/components/claim-reconciliation-pages";

export default function ClaimReconciliationPage() {
  return (
    <AppShell
      title="Claim reconciliation"
      subtitle="Compare submitted NDIS claims to remittance payments."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Claims", href: "/claims" },
        { label: "Claim reconciliation" },
      ]}
      audit={{ moduleLabel: "Claim reconciliation" }}
    >
      <ClaimReconciliationView />
    </AppShell>
  );
}
