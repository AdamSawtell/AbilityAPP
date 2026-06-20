import { AppShell } from "@/components/app-shell";
import { NdisAuditPackView } from "@/components/ndis-audit-pack-pages";

export default function NdisAuditPackPage() {
  return (
    <AppShell
      title="NDIS audit pack"
      subtitle="Export audit evidence for participants, delivery, billing, and compliance."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Reports", href: "/reports" },
        { label: "NDIS audit pack" },
      ]}
      audit={{ moduleLabel: "NDIS audit pack" }}
    >
      <NdisAuditPackView />
    </AppShell>
  );
}
