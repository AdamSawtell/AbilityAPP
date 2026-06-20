import { AppShell } from "@/components/app-shell";
import { GenerateClaimsView } from "@/components/claim-pages";

export default function GenerateClaimsPage() {
  return (
    <AppShell
      title="Generate claims"
      subtitle="Bulk-create draft NDIS claim batches from approved, verified timesheet lines."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Claims", href: "/claims" },
        { label: "Generate claims" },
      ]}
      audit={{ moduleLabel: "Generate claims" }}
    >
      <GenerateClaimsView />
    </AppShell>
  );
}
