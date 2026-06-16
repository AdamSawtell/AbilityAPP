import { AppShell } from "@/components/app-shell";
import { LocationListView } from "@/components/location-pages";
import Link from "next/link";

export default function LocationsPage() {
  return (
    <AppShell
      title="Locations"
      subtitle="Support locations — SIL houses, day programs, and service sites. Link clients, staff, and alerts to each site."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Locations" }]}
      audit={{ moduleLabel: "Locations" }}
      actions={
        <Link
          href="/locations/new"
          className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
        >
          Add location
        </Link>
      }
    >
      <LocationListView />
    </AppShell>
  );
}
