"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { LocationListView } from "@/components/location-pages";
import { useAuth } from "@/lib/auth-store";

export default function LocationsPage() {
  const { canWriteWindow } = useAuth();
  const canCreateLocation = canWriteWindow("locations");

  return (
    <AppShell
      title="Locations"
      subtitle="Support locations — SIL houses, day programs, and service sites. Link clients, staff, and alerts to each site."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Locations" }]}
      audit={{ moduleLabel: "Locations" }}
      actions={
        canCreateLocation ? (
          <Link
            href="/locations/new"
            className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
          >
            Add location
          </Link>
        ) : null
      }
    >
      <LocationListView />
    </AppShell>
  );
}
