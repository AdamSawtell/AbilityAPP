"use client";

import Link from "next/link";
import type { FleetVehicleRecord } from "@/lib/fleet-vehicle";
import { fleetVehicleLabel } from "@/lib/fleet-vehicle";

export function FleetVehicleRecordLink({ vehicle }: { vehicle: FleetVehicleRecord }) {
  return (
    <Link href={`/fleet/${vehicle.id}`} className="font-medium text-[#b51266] hover:underline">
      {fleetVehicleLabel(vehicle)}
    </Link>
  );
}
