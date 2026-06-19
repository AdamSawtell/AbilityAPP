import { ModulePlaceholderView } from "@/components/module-placeholder-page";

export default function TimesheetsPage() {
  return (
    <ModulePlaceholderView
      title="Timesheets"
      subtitle="Review and approve worker time from completed service bookings."
      abilityErpName="Timesheet"
      description="Timesheets will capture hours worked against service bookings, support approval workflows, and feed payroll and NDIS claiming. Use service bookings today to schedule delivery."
      relatedLinks={[
        { href: "/service-bookings", label: "Service bookings" },
        { href: "/generate-timesheets", label: "Generate timesheets" },
      ]}
    />
  );
}
