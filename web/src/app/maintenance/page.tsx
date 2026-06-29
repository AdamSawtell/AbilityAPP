"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { MaintenanceRequestListView } from "@/components/maintenance-request-pages";
import { useAuth } from "@/lib/auth-store";

export default function MaintenancePage() {
  const { canWriteWindow } = useAuth();
  const canCreate = canWriteWindow("maintenance");

  return (
    <AppShell
      title="Maintenance"
      subtitle="Log, track, and resolve maintenance issues across locations."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Maintenance" }]}
      audit={{ moduleLabel: "Maintenance" }}
      actions={
        canCreate ? (
          <Link
            href="/maintenance/new"
            className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
          >
            Log request
          </Link>
        ) : null
      }
    >
      <MaintenanceRequestListView />
    </AppShell>
  );
}
