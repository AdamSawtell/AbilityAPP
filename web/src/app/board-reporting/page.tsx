import { AppShell } from "@/components/app-shell";
import { BoardReportingListView } from "@/components/board-reporting-pages";

export default function BoardReportingPage() {
  return (
    <AppShell
      title="Board reporting"
      subtitle="Generate NDIS board report packs with configurable sections, commentary, and printable export."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Reports", href: "/reports" },
        { label: "Board reporting" },
      ]}
      audit={{ moduleLabel: "Board Reporting" }}
    >
      <BoardReportingListView />
    </AppShell>
  );
}
