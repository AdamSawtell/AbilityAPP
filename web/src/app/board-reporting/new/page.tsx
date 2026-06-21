import { AppShell } from "@/components/app-shell";
import { BoardReportingCreateView } from "@/components/board-reporting-pages";

export default function BoardReportingNewPage() {
  return (
    <AppShell
      title="New board report"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Board Reporting", href: "/board-reporting" },
        { label: "New" },
      ]}
      audit={{ moduleLabel: "Board Reporting" }}
    >
      <BoardReportingCreateView />
    </AppShell>
  );
}
