import { AppShell } from "@/components/app-shell";
import { ClaimListView } from "@/components/claim-pages";

export default function ClaimsPage() {
  return (
    <AppShell
      title="Claims"
      subtitle="NDIS claim batches generated from verified timesheet lines."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Claims" }]}
      audit={{ moduleLabel: "Claims" }}
    >
      <ClaimListView />
    </AppShell>
  );
}
