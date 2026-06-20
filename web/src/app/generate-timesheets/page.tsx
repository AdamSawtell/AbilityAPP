import { AppShell } from "@/components/app-shell";
import { GenerateTimesheetsView } from "@/components/timesheet-pages";

export default function GenerateTimesheetsPage() {
  return (
    <AppShell
      title="Generate timesheets"
      subtitle="Bulk-create draft timesheets from published roster shifts for a pay period."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Timesheets", href: "/timesheets" },
        { label: "Generate timesheets" },
      ]}
      audit={{ moduleLabel: "Generate timesheets" }}
    >
      <GenerateTimesheetsView />
    </AppShell>
  );
}
