"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { FleetVehicleListView } from "@/components/fleet-vehicle-pages";
import { useAuth } from "@/lib/auth-store";

export default function FleetPage() {
  const { canWriteWindow } = useAuth();
  const canCreateVehicle = canWriteWindow("fleet");

  return (
    <AppShell
      title="Fleet"
      subtitle="Vehicle register, servicing, pre-start inspections, and bookings for provider-owned transport."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Fleet" }]}
      audit={{ moduleLabel: "Fleet" }}
      actions={
        canCreateVehicle ? (
          <Link
            href="/fleet/new"
            className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
          >
            Add vehicle
          </Link>
        ) : null
      }
    >
      <FleetVehicleListView />
    </AppShell>
  );
}
