import { AppShell } from "@/components/app-shell";
import { TimesheetApprovalView } from "@/components/timesheet-approval-pages";

export default function TimesheetApprovalPage() {
  return (
    <AppShell
      title="Timesheet approval"
      subtitle="Approve submitted timesheets in your scope — by exception, ready first."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Service delivery", href: "/timesheets" },
        { label: "Timesheet approval" },
      ]}
      audit={{ moduleLabel: "Timesheet approval" }}
    >
      <TimesheetApprovalView />
    </AppShell>
  );
}
