"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { FleetVehicleList } from "@/components/fleet-vehicle-list";
import { FleetVehicleTabbedView } from "@/components/fleet-vehicle-view";
import { UnsavedChangesBar } from "@/components/unsaved-changes-bar";
import { RecordLineSaveProvider } from "@/lib/record-line-save-context";
import { useModuleSaveAccess } from "@/lib/access/use-detail-write-access";
import { auditMetaFrom } from "@/lib/audit";
import { SAVE_TOAST_MESSAGES, showSuccessToast } from "@/lib/toast";
import { useData } from "@/lib/data-store";
import { findFleetVehicleByRouteId, normalizeFleetVehicle, type FleetVehicleRecord } from "@/lib/fleet-vehicle";

export function FleetVehicleListView() {
  const { fleetVehicles } = useData();
  return <FleetVehicleList records={fleetVehicles} />;
}

export function FleetVehicleDetailView({ id }: { id: string }) {
  const { fleetVehicles, upsertFleetVehicle } = useData();
  const canSaveVehicle = useModuleSaveAccess("fleet", "fleet");
  const stored = findFleetVehicleByRouteId(fleetVehicles, id);
  const [draft, setDraft] = useState<FleetVehicleRecord | null>(null);
  const [saved, setSaved] = useState(false);

  const vehicle = draft ?? stored ?? null;
  const hasUnsavedChanges = Boolean(draft);

  useEffect(() => {
    setDraft(null);
    setSaved(false);
  }, [id]);

  if (!vehicle) {
    return (
      <AppShell
        title="Vehicle not found"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Fleet", href: "/fleet" },
          { label: "Not found" },
        ]}
        audit={{ moduleLabel: "Fleet" }}
      >
        <p className="text-slate-600">No vehicle with ID {id}.</p>
        <Link href="/fleet" className="mt-4 inline-block text-[#b51266] hover:underline">
          Back to fleet
        </Link>
      </AppShell>
    );
  }

  function patchDraft(patch: Partial<FleetVehicleRecord>) {
    const base = draft ?? stored;
    if (!base) return;
    setDraft(normalizeFleetVehicle({ ...base, ...patch, updatedBy: "SuperUser" }));
    setSaved(false);
  }

  function onFieldChange(key: keyof FleetVehicleRecord, value: string) {
    patchDraft({ [key]: value });
  }

  function onCollectionChange<K extends "serviceRecords" | "inspections" | "fuelLogs">(
    key: K,
    rows: FleetVehicleRecord[K]
  ) {
    patchDraft({ [key]: rows });
  }

  function onSave() {
    if (!vehicle) return;
    upsertFleetVehicle(vehicle);
    setDraft(null);
    setSaved(true);
    showSuccessToast(SAVE_TOAST_MESSAGES.saved);
  }

  function onDiscard() {
    setDraft(null);
    setSaved(false);
  }

  return (
    <>
      <RecordLineSaveProvider
        onSave={onSave}
        onDiscard={onDiscard}
        dirty={hasUnsavedChanges}
        canSave={canSaveVehicle}
      >
        <AppShell
        title={vehicle.name}
        subtitle={`${vehicle.searchKey} · ${vehicle.registrationNumber || "No registration"} · ${vehicle.status.replace("_", " ")}`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Fleet", href: "/fleet" },
          { label: vehicle.searchKey || vehicle.name },
        ]}
        audit={{
          entityType: "fleet-vehicle",
          entityId: vehicle.id,
          meta: auditMetaFrom(stored ?? vehicle),
        }}
      >
        {saved ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Vehicle saved.
          </div>
        ) : null}
        <FleetVehicleTabbedView
          vehicle={vehicle}
          onFieldChange={onFieldChange}
          onCollectionChange={onCollectionChange}
          readOnly={!canSaveVehicle}
        />
      </AppShell>
      </RecordLineSaveProvider>
      <UnsavedChangesBar visible={hasUnsavedChanges} onSave={onSave} onDiscard={onDiscard} saveDisabled={!canSaveVehicle} />
    </>
  );
}
