"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { useData } from "@/lib/data-store";

export default function NewFleetVehiclePage() {
  const router = useRouter();
  const { addFleetVehicle, fleetVehicles } = useData();

  useEffect(() => {
    const nextNo = fleetVehicles.length + 1;
    const record = addFleetVehicle({
      searchKey: `VEH-${String(nextNo).padStart(3, "0")}`,
      name: "New vehicle",
      status: "active",
    });
    router.replace(`/fleet/${record.id}`);
  }, [addFleetVehicle, fleetVehicles.length, router]);

  return (
    <AppShell
      title="New vehicle"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Fleet", href: "/fleet" }, { label: "New" }]}
      audit={{ moduleLabel: "Fleet" }}
    >
      <p className="text-sm text-slate-500">Creating vehicle…</p>
    </AppShell>
  );
}
