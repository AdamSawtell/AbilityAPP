import { AppShell } from "@/components/app-shell";
import { ContractListView } from "@/components/contract-pages";

export default function ContractsPage() {
  return (
    <AppShell
      title="Contracts"
      subtitle="Service agreements and commercial contracts. Start, end, and review dates drive renewals."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Contracts" }]}
    >
      <ContractListView />
    </AppShell>
  );
}
