import { AppShell } from "@/components/app-shell";
import { ServiceAgreementListView } from "@/components/service-agreement-pages";

export default function ServiceAgreementsPage() {
  return (
    <AppShell
      title="Service agreements"
      subtitle="NDIS service agreements linked to clients. Lines use products from price lists."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Service agreements" }]}
      audit={{ moduleLabel: "Service agreements" }}
    >
      <ServiceAgreementListView />
    </AppShell>
  );
}
