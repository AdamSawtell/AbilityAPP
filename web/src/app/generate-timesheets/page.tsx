import { ModulePlaceholderView } from "@/components/module-placeholder-page";

export default function GenerateTimesheetsPage() {
  return (
    <ModulePlaceholderView
      title="Generate timesheets"
      subtitle="Bulk-create timesheet lines from completed bookings for a date range."
      abilityErpName="Generate Timesheets"
      description="In AbilityERP, Generate Timesheets rolls up completed service bookings into worker timesheets. This function will be added after rostering and timesheet records are in place."
      relatedLinks={[
        { href: "/service-bookings", label: "Service bookings" },
        { href: "/timesheets", label: "Timesheets" },
      ]}
    />
  );
}
