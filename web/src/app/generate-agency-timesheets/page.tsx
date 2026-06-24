import { AppShell } from "@/components/app-shell";
import { GenerateAgencyTimesheetsView } from "@/components/agency-timesheet-pages";

export default function GenerateAgencyTimesheetsPage() {
  return (
    <AppShell
      title="Generate agency timesheets"
      subtitle="Bulk-create draft vendor timesheets from completed agency roster shifts."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Agency timesheets", href: "/agency-timesheets" },
        { label: "Generate agency timesheets" },
      ]}
      audit={{ moduleLabel: "Generate agency timesheets" }}
    >
      <GenerateAgencyTimesheetsView />
    </AppShell>
  );
}
