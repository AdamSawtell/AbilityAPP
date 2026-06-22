import { AppShell } from "@/components/app-shell";
import { BusinessPartnerListView } from "@/components/business-partner-pages";

export default function BusinessPartnersPage() {
  return (
    <AppShell
      title="Business partners"
      subtitle="Plan managers, vendors, referrers, and NDIS partners. Communication and payment preferences live on each record."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Business partners" }]}
      audit={{ moduleLabel: "Business partners" }}
    >
      <BusinessPartnerListView />
    </AppShell>
  );
}
