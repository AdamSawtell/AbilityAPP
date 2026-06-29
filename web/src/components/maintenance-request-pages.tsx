"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { MaintenanceRequestList } from "@/components/maintenance-request-list";
import {
  MaintenanceRequestTabbedView,
  useMaintenanceIncidentCreator,
} from "@/components/maintenance-request-view";
import { UnsavedChangesBar } from "@/components/unsaved-changes-bar";
import { useModuleSaveAccess } from "@/lib/access/use-detail-write-access";
import { auditMetaFrom } from "@/lib/audit";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import {
  emptyMaintenanceRequest,
  findMaintenanceRequestByRouteId,
  normalizeMaintenanceRequest,
  type MaintenanceRequestRecord,
} from "@/lib/maintenance-request";

export function MaintenanceRequestListView() {
  const { maintenanceRequests, locations } = useData();
  return <MaintenanceRequestList records={maintenanceRequests} locations={locations} />;
}

export function MaintenanceRequestDetailView({ id }: { id: string }) {
  const { maintenanceRequests, upsertMaintenanceRequest } = useData();
  const { session } = useAuth();
  const canSave = useModuleSaveAccess("maintenance", "maintenance");
  const stored = findMaintenanceRequestByRouteId(maintenanceRequests, id);
  const [draft, setDraft] = useState<MaintenanceRequestRecord | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const record = draft ?? stored ?? null;
  const hasUnsavedChanges = Boolean(draft);
  const createIncident = useMaintenanceIncidentCreator(record ?? emptyMaintenanceRequest());

  useEffect(() => {
    setDraft(null);
    setSaved(false);
    setSaveError(null);
  }, [id]);

  if (!record) {
    return (
      <AppShell
        title="Maintenance request not found"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Maintenance", href: "/maintenance" },
          { label: "Not found" },
        ]}
        audit={{ moduleLabel: "Maintenance" }}
      >
        <p className="text-slate-600">No maintenance request with ID {id}.</p>
        <Link href="/maintenance" className="mt-4 inline-block text-[#b51266] hover:underline">
          Back to maintenance register
        </Link>
      </AppShell>
    );
  }

  function patchDraft(patch: Partial<MaintenanceRequestRecord>) {
    const base = draft ?? stored;
    if (!base) return;
    const actor = session?.displayName ?? session?.username ?? "User";
    setDraft(normalizeMaintenanceRequest({ ...base, ...patch, updatedBy: actor }));
    setSaved(false);
    setSaveError(null);
  }

  function onFieldChange(key: keyof MaintenanceRequestRecord, value: string | MaintenanceRequestRecord["photos"]) {
    if (key === "estimatedCost" || key === "actualCost") {
      patchDraft({ [key]: value === "" ? "" : Number(value) });
      return;
    }
    patchDraft({ [key]: value });
  }

  function onSave() {
    if (!record) return;
    const error = upsertMaintenanceRequest(record);
    if (error) {
      setSaveError(error);
      return;
    }
    setDraft(null);
    setSaved(true);
    setSaveError(null);
  }

  function onConfirmResolution() {
    const actor = session?.displayName ?? session?.username ?? "User";
    patchDraft({ requestorConfirmedAt: new Date().toISOString(), updatedBy: actor });
  }

  return (
    <>
      <AppShell
        title={record.title || record.documentNo}
        subtitle={`${record.documentNo} · ${record.priority} · ${record.status.replace(/_/g, " ")}`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Maintenance", href: "/maintenance" },
          { label: record.documentNo || record.id },
        ]}
        audit={{
          entityType: "maintenance-request",
          entityId: record.id,
          meta: auditMetaFrom(stored ?? record),
        }}
      >
        {saved ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Maintenance request saved.
          </div>
        ) : null}
        {saveError ? (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{saveError}</div>
        ) : null}
        <MaintenanceRequestTabbedView
          record={record}
          onFieldChange={onFieldChange}
          onPhotosChange={(photos) => patchDraft({ photos })}
          onConfirmResolution={onConfirmResolution}
          onCreateIncident={createIncident}
        />
      </AppShell>
      {canSave ? (
        <UnsavedChangesBar visible={hasUnsavedChanges} onSave={onSave} onDiscard={() => setDraft(null)} />
      ) : null}
    </>
  );
}

export function MaintenanceRequestNewView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addMaintenanceRequest, locations } = useData();
  const { session } = useAuth();
  const requestedLocationId = searchParams.get("locationId") ?? "";
  const createdRef = useRef(false);

  // location_id is a non-null FK to support_location, so a request must always
  // start against a real location. When the page is opened from the register
  // without a location context, default to the first available site; the user
  // can change it on the Overview tab.
  const locationId =
    requestedLocationId && locations.some((l) => l.id === requestedLocationId)
      ? requestedLocationId
      : locations[0]?.id ?? "";

  useEffect(() => {
    if (createdRef.current) return;
    if (!locationId) return;
    createdRef.current = true;
    const actor = session?.displayName ?? session?.username ?? "User";
    const saved = addMaintenanceRequest({
      locationId,
      reportedBy: actor,
      title: "",
      description: "",
    });
    router.replace(`/maintenance/${saved.id}`);
  }, [addMaintenanceRequest, locationId, router, session?.displayName, session?.username]);

  if (!locationId) {
    return (
      <AppShell title="No location available" audit={{ moduleLabel: "Maintenance" }}>
        <p className="text-sm text-slate-600">
          Add a location before logging a maintenance request.
        </p>
        <Link href="/locations" className="mt-4 inline-block text-[#b51266] hover:underline">
          Go to locations
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell title="Creating maintenance request…" audit={{ moduleLabel: "Maintenance" }}>
      <p className="text-sm text-slate-600">Setting up a new maintenance request.</p>
    </AppShell>
  );
}
