"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { useData } from "@/lib/data-store";
import { createLocation } from "@/lib/location";

export default function NewLocationPage() {
  const router = useRouter();
  const { addLocation, locations } = useData();

  useEffect(() => {
    const record = addLocation(
      createLocation(
        {
          name: "New location",
          locationType: "SIL house",
        },
        locations
      )
    );
    router.replace(`/locations/${record.id}`);
  }, [addLocation, locations, router]);

  return (
    <AppShell title="New location" breadcrumbs={[{ label: "Home", href: "/" }, { label: "Locations", href: "/locations" }, { label: "New" }]}>
      <p className="text-sm text-slate-500">Creating location…</p>
    </AppShell>
  );
}
