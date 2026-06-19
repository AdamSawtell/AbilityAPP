import { ModulePlaceholderView } from "@/components/module-placeholder-page";

export default function RosteringPage() {
  return (
    <ModulePlaceholderView
      title="Rostering"
      subtitle="Build and maintain staff rosters across locations and service lines."
      abilityErpName="Rostering / Booking Generator"
      description="Rostering will let you build recurring patterns, generate service bookings in bulk, and assign workers to shifts. This sits alongside service bookings and timesheets in the delivery stack."
      relatedLinks={[
        { href: "/service-bookings", label: "Service bookings" },
        { href: "/timesheets", label: "Timesheets" },
      ]}
    />
  );
}
