import { AppShell } from "@/components/app-shell";
import { ClientListView } from "@/components/client-pages";

export default function ClientsPage() {
  return (
    <AppShell
      title="Clients"
      subtitle="People receiving support through your organisation."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Clients" }]}
      audit={{ moduleLabel: "Clients" }}
    >
      <ClientListView />
    </AppShell>
  );
}
