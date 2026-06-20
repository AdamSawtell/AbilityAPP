import { AppShell } from "@/components/app-shell";
import { TimesheetListView } from "@/components/timesheet-pages";

export default function TimesheetsPage() {
  return (
    <AppShell
      title="Timesheets"
      subtitle="Review and approve worker time generated from roster shifts."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Timesheets" }]}
      audit={{ moduleLabel: "Timesheets" }}
    >
      <TimesheetListView />
    </AppShell>
  );
}
