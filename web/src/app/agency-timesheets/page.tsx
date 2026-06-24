import { AppShell } from "@/components/app-shell";
import { AgencyTimesheetListView } from "@/components/agency-timesheet-pages";

export default function AgencyTimesheetsPage() {
  return (
    <AppShell
      title="Agency timesheets"
      subtitle="Vendor buy-side hours and cost from completed agency roster shifts."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Agency timesheets" }]}
      audit={{ moduleLabel: "Agency timesheets" }}
    >
      <AgencyTimesheetListView />
    </AppShell>
  );
}
