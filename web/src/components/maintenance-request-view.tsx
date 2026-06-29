"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FleetBookingForm } from "@/components/fleet-booking-form";
import { LineItemTable } from "@/components/line-item-table";
import { useAuth } from "@/lib/auth-store";
import { allowedDetailTabsFromGroups, resolveDetailWindowKey } from "@/lib/access/catalog";
import { useModuleSaveAccess } from "@/lib/access/use-detail-write-access";
import { useData } from "@/lib/data-store";
import { emptyIncident } from "@/lib/incident";
import {
  maintenanceCostVarianceExceeded,
  maintenanceRequiresCostApproval,
  maintenanceSlaBreached,
  maintenanceSlaDueAt,
} from "@/lib/maintenance-compliance";
import { maintenancePhotoTableConfig } from "@/lib/maintenance-line-tables";
import { fleetBookingPrefillFromMaintenance } from "@/lib/fleet-vehicle";
import {
  maintenanceRequestCategoryOptions,
  maintenanceRequestPriorityOptions,
  maintenanceRequestStatusOptions,
  maintenanceRequestTabGroups,
  maintenanceRequestTabs,
  maintenanceStatusLabel,
  type MaintenanceRequestRecord,
  type MaintenanceRequestTab,
} from "@/lib/maintenance-request";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#b51266] focus:outline-none focus:ring-2 focus:ring-[#b51266]/20";

function TabSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function MaintenanceRequestTabbedView({
  record,
  onFieldChange,
  onPhotosChange,
  onConfirmResolution,
  onCreateIncident,
  saveMessage,
}: {
  record: MaintenanceRequestRecord;
  onFieldChange: (key: keyof MaintenanceRequestRecord, value: string | MaintenanceRequestRecord["photos"]) => void;
  onPhotosChange: (photos: MaintenanceRequestRecord["photos"]) => void;
  onConfirmResolution: () => void;
  onCreateIncident: () => void;
  saveMessage?: string;
}) {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab") ?? "Overview";
  const { locations, employees } = useData();
  const { session, canWindow, canWriteWindow } = useAuth();
  const canSave = useModuleSaveAccess("maintenance", "maintenance");

  const allowedTabs = allowedDetailTabsFromGroups(
    "maintenance",
    maintenanceRequestTabGroups,
    session?.windowKeys ?? []
  );
  const defaultTab = allowedTabs[0] ?? "Overview";
  const activeTab = (allowedTabs.includes(requestedTab as MaintenanceRequestTab) ? requestedTab : defaultTab) as MaintenanceRequestTab;
  const [localTab, setLocalTab] = useState(activeTab);
  const tab = localTab;

  // Reset the active tab when the record or the requested ?tab= changes so the
  // selection does not stick when navigating between maintenance records.
  useEffect(() => {
    setLocalTab(activeTab);
  }, [record.id, activeTab]);

  const activeWindowKey = resolveDetailWindowKey("maintenance", tab);
  const canEditTab = canSave && (!activeWindowKey || canWriteWindow(activeWindowKey));
  const locationOptions = useMemo(
    () =>
      locations.map((l) => ({
        value: l.id,
        label: `${l.searchKey} — ${l.name}`,
      })),
    [locations]
  );
  const employeeOptions = useMemo(
    () =>
      employees.map((e) => ({
        value: e.id,
        label: `${e.searchKey} — ${e.name}`,
      })),
    [employees]
  );
  const locationName = locationOptions.find((l) => l.value === record.locationId)?.label ?? "—";
  const slaDue = maintenanceSlaDueAt(record);
  const breached = maintenanceSlaBreached(record);
  const needsApproval = maintenanceRequiresCostApproval(record);
  const varianceAlert = maintenanceCostVarianceExceeded(record);
  const actor = session?.displayName ?? session?.username ?? "User";
  const canBookVehicle = canWindow("fleet-bookings");
  const canSaveBooking = canBookVehicle && canWriteWindow("fleet-bookings");
  const bookingPrefill = useMemo(
    () =>
      fleetBookingPrefillFromMaintenance({
        maintenanceRequestId: record.id,
        documentNo: record.documentNo,
        title: record.title,
        locationId: record.locationId,
        assignedEmployeeId: record.assignedEmployeeId,
        scheduledAt: record.scheduledAt,
        actor,
      }),
    [
      record.id,
      record.documentNo,
      record.title,
      record.locationId,
      record.assignedEmployeeId,
      record.scheduledAt,
      actor,
    ]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
      <aside className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        {maintenanceRequestTabGroups.map((group) => {
          const tabs = group.tabs.filter((t) => allowedTabs.includes(t));
          if (!tabs.length) return null;
          return (
            <div key={group.label} className="mb-4 last:mb-0">
              <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{group.label}</p>
              <div className="mt-2 space-y-1">
                {tabs.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setLocalTab(t)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                      tab === t ? "bg-[#fdf2f8] font-medium text-[#b51266]" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </aside>

      <div className="space-y-4">
        {saveMessage ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {saveMessage}
          </div>
        ) : null}

        {tab === "Overview" && canWindow("maintenance-overview") ? (
          <TabSection title="Request overview">
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{maintenanceStatusLabel(record.status)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Priority</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{record.priority}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">SLA</p>
                <p className={`mt-1 text-lg font-semibold ${breached ? "text-rose-700" : "text-slate-900"}`}>
                  {breached ? "Breached" : slaDue ? slaDue.slice(0, 16).replace("T", " ") : "—"}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Title</span>
                <input className={inputClass} value={record.title} onChange={(e) => onFieldChange("title", e.target.value)} disabled={!canEditTab} />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Description</span>
                <textarea className={`${inputClass} min-h-[96px]`} value={record.description} onChange={(e) => onFieldChange("description", e.target.value)} disabled={!canEditTab} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Location</span>
                <select className={inputClass} value={record.locationId} onChange={(e) => onFieldChange("locationId", e.target.value)} disabled={!canEditTab}>
                  <option value="">Select location…</option>
                  {locationOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Category</span>
                <select className={inputClass} value={record.category} onChange={(e) => onFieldChange("category", e.target.value)} disabled={!canEditTab}>
                  {maintenanceRequestCategoryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Priority</span>
                <select className={inputClass} value={record.priority} onChange={(e) => onFieldChange("priority", e.target.value)} disabled={!canEditTab}>
                  {maintenanceRequestPriorityOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Status</span>
                <select className={inputClass} value={record.status} onChange={(e) => onFieldChange("status", e.target.value)} disabled={!canEditTab}>
                  {maintenanceRequestStatusOptions.map((s) => (
                    <option key={s} value={s}>
                      {maintenanceStatusLabel(s)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Reported by</span>
                <input className={inputClass} value={record.reportedBy} onChange={(e) => onFieldChange("reportedBy", e.target.value)} disabled={!canEditTab} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Reported at</span>
                <input type="datetime-local" className={inputClass} value={record.reportedAt?.slice(0, 16) ?? ""} onChange={(e) => onFieldChange("reportedAt", e.target.value)} disabled={!canEditTab} />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {record.incidentId ? (
                <Link href={`/incidents/${record.incidentId}`} className="text-sm font-medium text-[#b51266] hover:underline">
                  Open linked incident
                </Link>
              ) : (
                <button type="button" onClick={onCreateIncident} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" disabled={!canEditTab}>
                  Create incident from this request
                </button>
              )}
              <Link href={`/locations/${record.locationId}?tab=Maintenance`} className="text-sm font-medium text-slate-600 hover:text-[#b51266]">
                View location history ({locationName})
              </Link>
            </div>
          </TabSection>
        ) : null}

        {tab === "Assignment" && canWindow("maintenance-assignment") ? (
          <TabSection title="Assignment and schedule">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Assigned employee</span>
                <select className={inputClass} value={record.assignedEmployeeId} onChange={(e) => onFieldChange("assignedEmployeeId", e.target.value)} disabled={!canEditTab}>
                  <option value="">Select employee…</option>
                  {employeeOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Scheduled visit</span>
                <input type="datetime-local" className={inputClass} value={record.scheduledAt?.slice(0, 16) ?? ""} onChange={(e) => onFieldChange("scheduledAt", e.target.value)} disabled={!canEditTab} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Contractor name</span>
                <input className={inputClass} value={record.contractorName} onChange={(e) => onFieldChange("contractorName", e.target.value)} disabled={!canEditTab} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Contractor phone</span>
                <input className={inputClass} value={record.contractorPhone} onChange={(e) => onFieldChange("contractorPhone", e.target.value)} disabled={!canEditTab} />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Contractor email</span>
                <input className={inputClass} value={record.contractorEmail} onChange={(e) => onFieldChange("contractorEmail", e.target.value)} disabled={!canEditTab} />
              </label>
            </div>

            {canBookVehicle ? (
              <div className="mt-6 border-t border-slate-100 pt-6">
                <p className="mb-4 text-sm text-slate-600">
                  Book a vehicle for the site visit using the same form as Fleet → Bookings. Driver, location, and
                  scheduled visit are prefilled from this request when set.
                </p>
                <FleetBookingForm
                  maintenanceRequestId={record.id}
                  prefill={bookingPrefill}
                  readOnly={!canSaveBooking}
                  formTitle="Book a vehicle for this visit"
                  listFilter={{ maintenanceRequestId: record.id }}
                />
              </div>
            ) : (
              <p className="mt-6 border-t border-slate-100 pt-6 text-sm text-slate-500">
                Vehicle bookings require Fleet → Bookings access. Open{" "}
                <Link href="/fleet" className="font-medium text-[#b51266] hover:underline">
                  Fleet
                </Link>{" "}
                to reserve a vehicle, or ask your administrator for access.
              </p>
            )}
          </TabSection>
        ) : null}

        {tab === "Costs" && canWindow("maintenance-costs") ? (
          <TabSection title="Costs and approval">
            {needsApproval ? (
              <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Costs at or above $500 require Finance/Admin approval before they are considered booked.
              </p>
            ) : null}
            {varianceAlert ? (
              <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                Actual cost varies from the estimate by more than 20%.
              </p>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Estimated cost</span>
                <input type="number" className={inputClass} value={record.estimatedCost === "" ? "" : record.estimatedCost} onChange={(e) => onFieldChange("estimatedCost", e.target.value)} disabled={!canEditTab} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Actual cost</span>
                <input type="number" className={inputClass} value={record.actualCost === "" ? "" : record.actualCost} onChange={(e) => onFieldChange("actualCost", e.target.value)} disabled={!canEditTab} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Cost status</span>
                <select className={inputClass} value={record.costStatus} onChange={(e) => onFieldChange("costStatus", e.target.value)} disabled={!canEditTab}>
                  <option value="pending">pending</option>
                  <option value="reviewed">reviewed</option>
                  <option value="approved">approved</option>
                  <option value="rejected">rejected</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Invoice number</span>
                <input className={inputClass} value={record.invoiceNumber} onChange={(e) => onFieldChange("invoiceNumber", e.target.value)} disabled={!canEditTab} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Supplier name</span>
                <input className={inputClass} value={record.supplierName} onChange={(e) => onFieldChange("supplierName", e.target.value)} disabled={!canEditTab} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Xero bill reference</span>
                <input className={inputClass} value={record.xeroBillReference} onChange={(e) => onFieldChange("xeroBillReference", e.target.value)} disabled={!canEditTab} />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">GST treatment</span>
                <input className={inputClass} value={record.gstTreatment} onChange={(e) => onFieldChange("gstTreatment", e.target.value)} disabled={!canEditTab} />
              </label>
            </div>
            {record.costApprovedBy ? (
              <p className="mt-4 text-sm text-slate-500">
                Approved by {record.costApprovedBy}
                {record.costApprovedAt ? ` · ${record.costApprovedAt.slice(0, 16).replace("T", " ")}` : ""}
              </p>
            ) : null}
          </TabSection>
        ) : null}

        {tab === "Photos" && canWindow("maintenance-photos") ? (
          <TabSection title="Photos and documents">
            <p className="mb-4 text-sm text-slate-600">Add photo or document URLs for the issue, completion evidence, or supplier invoice.</p>
            <LineItemTable
              config={maintenancePhotoTableConfig}
              rows={record.photos}
              onChange={onPhotosChange}
              readOnly={!canEditTab}
            />
          </TabSection>
        ) : null}

        {record.status === "resolved" && !record.requestorConfirmedAt ? (
          <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-4">
            <p className="text-sm text-violet-900">Resolution is recorded. The original requestor must confirm before this request can be closed.</p>
            <button type="button" onClick={onConfirmResolution} className="mt-3 rounded-lg bg-[#b51266] px-3 py-2 text-sm font-medium text-white hover:bg-[#9a0f57]">
              Confirm resolution
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function useMaintenanceIncidentCreator(record: MaintenanceRequestRecord) {
  const router = useRouter();
  const { addIncident, upsertMaintenanceRequest } = useData();
  const { session } = useAuth();

  return () => {
    const actor = session?.displayName ?? session?.username ?? "User";
    const incident = addIncident({
      ...emptyIncident(),
      title: record.title || `Maintenance — ${record.documentNo}`,
      description: record.description,
      category: "Operational",
      primaryLocationId: record.locationId,
      status: "Draft",
      createdBy: actor,
      updatedBy: actor,
    });
    upsertMaintenanceRequest({ ...record, incidentId: incident.id, updatedBy: actor });
    router.push(`/incidents/${incident.id}`);
  };
}
