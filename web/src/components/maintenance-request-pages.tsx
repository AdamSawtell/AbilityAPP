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
import { SAVE_TOAST_MESSAGES, showSuccessToast } from "@/lib/toast";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import {
  emptyMaintenanceRequest,
  findMaintenanceRequestByRouteId,
  maintenanceRequestCategoryOptions,
  maintenanceRequestPriorityOptions,
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
    showSuccessToast(SAVE_TOAST_MESSAGES.saved);
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

function titleCase(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

export function MaintenanceRequestNewView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addMaintenanceRequest, locations } = useData();
  const { session } = useAuth();
  const requestedLocationId = searchParams.get("locationId") ?? "";

  // location_id is a non-null FK to support_location, so a request must always
  // start against a real location. Default the picker to the location the user
  // came from (e.g. the location Maintenance tab) when present.
  const defaultLocationId =
    requestedLocationId && locations.some((l) => l.id === requestedLocationId)
      ? requestedLocationId
      : locations[0]?.id ?? "";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationId, setLocationId] = useState(defaultLocationId);
  const [category, setCategory] = useState<string>("general");
  const [priority, setPriority] = useState<string>("medium");
  const [error, setError] = useState("");
  const userPickedLocation = useRef(false);

  // locations and the ?locationId= prefill can arrive after first render (async
  // Supabase hydration / location-scope filtering). Keep the picker aligned with
  // the resolved default until the user makes an explicit choice.
  useEffect(() => {
    if (userPickedLocation.current) return;
    if (defaultLocationId && locationId !== defaultLocationId) {
      setLocationId(defaultLocationId);
    }
  }, [defaultLocationId, locationId]);

  const locationOptions = useMemo(
    () => locations.map((l) => ({ value: l.id, label: `${l.searchKey} — ${l.name}` })),
    [locations]
  );

  function onCreate() {
    if (!title.trim()) {
      setError("Enter a short title for the request.");
      return;
    }
    if (!locationId) {
      setError("Select a location for the request.");
      return;
    }
    const actor = session?.displayName ?? session?.username ?? "User";
    const created = addMaintenanceRequest({
      locationId,
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      reportedBy: actor,
    });
    router.push(`/maintenance/${created.id}`);
  }

  if (!defaultLocationId && locations.length === 0) {
    return (
      <AppShell title="No location available" audit={{ moduleLabel: "Maintenance" }}>
        <p className="text-sm text-slate-600">Add a location before logging a maintenance request.</p>
        <Link href="/locations" className="mt-4 inline-block text-[#b51266] hover:underline">
          Go to locations
        </Link>
      </AppShell>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#d4147a] focus:outline-none focus:ring-1 focus:ring-[#d4147a]";
  const labelClass = "block text-xs font-semibold uppercase tracking-wide text-slate-500";

  return (
    <AppShell
      title="Log maintenance request"
      subtitle="Capture the issue. A request number is assigned when you create the record."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Maintenance", href: "/maintenance" },
        { label: "New" },
      ]}
      audit={{ moduleLabel: "Maintenance" }}
      actions={
        <>
          <Link
            href="/maintenance"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={onCreate}
            className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
          >
            Create request
          </button>
        </>
      }
    >
      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}
      <div className="max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-1">
          <label htmlFor="mr-title" className={labelClass}>
            Title
          </label>
          <input
            id="mr-title"
            className={inputClass}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError("");
            }}
            placeholder="e.g. Leaking tap in bathroom"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="mr-location" className={labelClass}>
            Location
          </label>
          <select
            id="mr-location"
            className={inputClass}
            value={locationId}
            onChange={(e) => {
              userPickedLocation.current = true;
              setLocationId(e.target.value);
              setError("");
            }}
          >
            <option value="">Select a location…</option>
            {locationOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="mr-category" className={labelClass}>
              Category
            </label>
            <select
              id="mr-category"
              className={inputClass}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {maintenanceRequestCategoryOptions.map((o) => (
                <option key={o} value={o}>
                  {titleCase(o)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="mr-priority" className={labelClass}>
              Priority
            </label>
            <select
              id="mr-priority"
              className={inputClass}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              {maintenanceRequestPriorityOptions.map((o) => (
                <option key={o} value={o}>
                  {titleCase(o)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-1">
          <label htmlFor="mr-description" className={labelClass}>
            Description
          </label>
          <textarea
            id="mr-description"
            className={`${inputClass} min-h-[120px]`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue, access notes, and any safety concerns."
          />
        </div>
      </div>
    </AppShell>
  );
}
