"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FleetBookingForm } from "@/components/fleet-booking-form";
import { LineItemTable } from "@/components/line-item-table";
import { RecordCalendarPanel } from "@/components/record-calendar-panel";
import { fleetFuelLogTableConfig, fleetInspectionTableConfig, fleetServiceRecordTableConfig } from "@/lib/fleet-line-tables";
import { allowedDetailTabsFromGroups, resolveDetailWindowKey } from "@/lib/access/catalog";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import {
  fleetVehicleComplianceFieldKeys,
  fleetVehicleOverviewFieldKeys,
  fleetVehicleRegistrationFieldKeys,
  fleetVehicleStatusOptions,
  fleetVehicleTabGroups,
  fleetVehicleTabs,
  fleetVehicleExpiryAlerts,
  fleetVehicleServiceSummary,
  type FleetVehicleRecord,
  type FleetVehicleTab,
} from "@/lib/fleet-vehicle";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

const fieldLabels: Partial<Record<keyof FleetVehicleRecord, string>> = {
  searchKey: "Search key",
  name: "Name",
  make: "Make",
  model: "Model",
  year: "Year",
  vin: "VIN",
  registrationNumber: "Registration number",
  regoExpiry: "Registration expiry",
  insurancePolicy: "Insurance policy",
  insuranceExpiry: "Insurance expiry",
  locationId: "Assigned location",
  assignedDriverId: "Assigned driver",
  status: "Status",
  purchaseDate: "Purchase date",
  purchaseCost: "Purchase cost",
  usefulLifeYears: "Useful life (years)",
  residualValue: "Residual value",
  depreciationMethod: "Depreciation method",
  disposalDate: "Disposal date",
  disposalProceeds: "Disposal proceeds",
  accessibilityFeatures: "Accessibility features",
  modificationNotes: "Modification notes",
  modificationServiceDue: "Modification service due",
  complianceNotes: "Compliance notes",
  odometerReading: "Odometer reading",
  notes: "Notes",
};

function asInputValue(value: unknown): string {
  return value == null ? "" : String(value);
}

function Field({
  vehicle,
  fieldKey,
  onChange,
  readOnly,
  options,
}: {
  vehicle: FleetVehicleRecord;
  fieldKey: keyof FleetVehicleRecord;
  onChange: (key: keyof FleetVehicleRecord, value: string) => void;
  readOnly?: boolean;
  options?: { value: string; label: string }[];
}) {
  const label = fieldLabels[fieldKey] ?? String(fieldKey);
  const value = asInputValue(vehicle[fieldKey]);
  const textarea = fieldKey === "notes" || fieldKey === "accessibilityFeatures" || fieldKey === "modificationNotes" || fieldKey === "complianceNotes";

  return (
    <label className={textarea ? "block sm:col-span-2" : "block"}>
      <span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>
      {readOnly ? (
        <div className="min-h-[38px] rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {value || "—"}
        </div>
      ) : options ? (
        <select value={value} onChange={(event) => onChange(fieldKey, event.target.value)} className={inputClass}>
          <option value="">Select…</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : textarea ? (
        <textarea value={value} onChange={(event) => onChange(fieldKey, event.target.value)} rows={4} className={inputClass} />
      ) : (
        <input value={value} onChange={(event) => onChange(fieldKey, event.target.value)} className={inputClass} />
      )}
    </label>
  );
}

function TabSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function FleetVehicleTabbedView({
  vehicle,
  onFieldChange,
  onCollectionChange,
  readOnly = false,
}: {
  vehicle: FleetVehicleRecord;
  onFieldChange: (key: keyof FleetVehicleRecord, value: string) => void;
  onCollectionChange: <K extends "serviceRecords" | "inspections" | "fuelLogs">(key: K, rows: FleetVehicleRecord[K]) => void;
  readOnly?: boolean;
}) {
  const { session, canWindow, canWriteWindow } = useAuth();
  const { employees, locations, incidents, rosterShifts, fleetBookings } = useData();
  const [activeTab, setActiveTab] = useState<FleetVehicleTab>("Overview");

  const allowedTabs = allowedDetailTabsFromGroups("fleet", fleetVehicleTabGroups, session?.windowKeys ?? []);
  const safeAllowedTabs = allowedTabs.length ? allowedTabs : [...fleetVehicleTabs];
  const activeWindowKey = resolveDetailWindowKey("fleet", activeTab);
  const canEditTab = !readOnly && (!activeWindowKey || canWriteWindow(activeWindowKey));

  const dropdowns = useMemo(
    () => ({
      fleetServiceType: ["Scheduled", "Repair", "Inspection", "Tyres", "Other"],
      fleetServiceCostStatus: ["pending", "reviewed", "approved", "rejected"],
      fleetInspectionResult: ["pass", "fail"],
      employeeId: employees.map((e) => e.id),
      rosterShiftId: rosterShifts.map((s) => s.id),
    }),
    [employees, rosterShifts]
  );

  const optionLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    for (const employee of employees) labels[employee.id] = `${employee.searchKey} — ${employee.name}`;
    for (const shift of rosterShifts) labels[shift.id] = `${shift.shiftRef} — ${shift.shiftDate} ${shift.startTime}`;
    return labels;
  }, [employees, rosterShifts]);

  const locationOptions = locations.map((location) => ({
    value: location.id,
    label: `${location.searchKey} — ${location.name}`,
  }));
  const employeeOptions = employees.map((employee) => ({
    value: employee.id,
    label: `${employee.searchKey} — ${employee.name}`,
  }));
  const statusOptions = fleetVehicleStatusOptions.map((status) => ({ value: status, label: status.replace("_", " ") }));

  const vehicleBookings = fleetBookings
    .filter((row) => row.vehicleId === vehicle.id)
    .sort((a, b) => a.startDatetime.localeCompare(b.startDatetime));
  const vehicleIncidents = incidents.filter((incident) => incident.vehicleId === vehicle.id);
  const linkedShifts = rosterShifts.filter((shift) => shift.vehicleId === vehicle.id);
  const expiryAlerts = fleetVehicleExpiryAlerts(vehicle);

  return (
    <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
      <aside className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        {fleetVehicleTabGroups.map((group) => {
          const tabs = group.tabs.filter((tab) => safeAllowedTabs.includes(tab));
          if (!tabs.length) return null;
          return (
            <div key={group.label} className="mb-4 last:mb-0">
              <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{group.label}</p>
              <div className="mt-2 space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                      activeTab === tab ? "bg-[#fdf2f8] font-medium text-[#b51266]" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </aside>

      <div className="space-y-6">
        {activeTab === "Overview" && canWindow("fleet-overview") ? (
          <TabSection title="Vehicle overview">
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{vehicle.status.replace("_", " ")}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Service</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{fleetVehicleServiceSummary(vehicle)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Bookings</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{vehicleBookings.length}</p>
              </div>
            </div>
            {expiryAlerts.length ? (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                {expiryAlerts.map((alert) => (
                  <p key={`${alert.kind}-${alert.date}`}>
                    {alert.label}: {alert.date} ({alert.daysUntil < 0 ? "overdue" : `${alert.daysUntil} days`})
                  </p>
                ))}
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              {fleetVehicleOverviewFieldKeys.map((key) => (
                <Field
                  key={key}
                  vehicle={vehicle}
                  fieldKey={key}
                  onChange={onFieldChange}
                  readOnly={!canEditTab}
                  options={key === "status" ? statusOptions : key === "locationId" ? locationOptions : key === "assignedDriverId" ? employeeOptions : undefined}
                />
              ))}
            </div>
          </TabSection>
        ) : null}

        {activeTab === "Calendar" && canWindow("fleet-calendar") ? (
          <TabSection title="Vehicle calendar">
            <RecordCalendarPanel
              entityKind="vehicle"
              entityId={vehicle.id}
              activities={[]}
              description="Vehicle bookings and roster shifts linked to this vehicle."
            />
            <div className="mt-4 rounded-xl border border-slate-200">
              <div className="border-b border-slate-100 px-4 py-3 text-sm font-medium text-slate-700">Linked roster shifts</div>
              <div className="divide-y divide-slate-100">
                {linkedShifts.map((shift) => (
                  <Link key={shift.id} href={`/rostering/shifts/${shift.id}`} className="block px-4 py-3 text-sm hover:bg-slate-50">
                    {shift.shiftRef} — {shift.shiftDate} {shift.startTime}-{shift.endTime}
                  </Link>
                ))}
                {!linkedShifts.length ? <p className="px-4 py-6 text-sm text-slate-500">No roster shifts are linked to this vehicle yet.</p> : null}
              </div>
            </div>
          </TabSection>
        ) : null}

        {activeTab === "Registration & insurance" && canWindow("fleet-registration-and-insurance") ? (
          <TabSection title="Registration, insurance, and asset lifecycle">
            <div className="grid gap-4 sm:grid-cols-2">
              {fleetVehicleRegistrationFieldKeys.map((key) => (
                <Field key={key} vehicle={vehicle} fieldKey={key} onChange={onFieldChange} readOnly={!canEditTab} />
              ))}
            </div>
          </TabSection>
        ) : null}

        {activeTab === "Servicing" && canWindow("fleet-servicing") ? (
          <TabSection title="Service history and upcoming maintenance">
            <LineItemTable
              config={fleetServiceRecordTableConfig}
              rows={vehicle.serviceRecords}
              onChange={(rows) => onCollectionChange("serviceRecords", rows)}
              dropdowns={dropdowns}
              readOnly={!canEditTab}
            />
          </TabSection>
        ) : null}

        {activeTab === "Inspections" && canWindow("fleet-inspections") ? (
          <TabSection title="Pre-start inspections">
            <p className="mb-4 text-sm text-slate-600">
              A failed inspection marks the vehicle off road when the record is saved.
            </p>
            <LineItemTable
              config={fleetInspectionTableConfig}
              rows={vehicle.inspections}
              onChange={(rows) => onCollectionChange("inspections", rows)}
              dropdowns={dropdowns}
              optionLabels={optionLabels}
              readOnly={!canEditTab}
            />
          </TabSection>
        ) : null}

        {activeTab === "Bookings" && canWindow("fleet-bookings") ? (
          <TabSection title="Vehicle bookings">
            <FleetBookingForm
              fixedVehicle={vehicle}
              readOnly={!canEditTab}
              listFilter={{ vehicleId: vehicle.id }}
            />
          </TabSection>
        ) : null}

        {activeTab === "Fuel & mileage" && canWindow("fleet-fuel-and-mileage") ? (
          <TabSection title="Fuel and mileage">
            <p className="mb-4 text-sm text-slate-600">
              MVP captures odometer readings for kilometre reporting. Fuel purchase receipts remain Phase 2.
            </p>
            <LineItemTable
              config={fleetFuelLogTableConfig}
              rows={vehicle.fuelLogs}
              onChange={(rows) => onCollectionChange("fuelLogs", rows)}
              dropdowns={dropdowns}
              optionLabels={optionLabels}
              readOnly={!canEditTab}
            />
          </TabSection>
        ) : null}

        {activeTab === "Accessibility & compliance" && canWindow("fleet-accessibility-and-compliance") ? (
          <TabSection title="Accessibility and NDIS transport compliance">
            <div className="grid gap-4 sm:grid-cols-2">
              {fleetVehicleComplianceFieldKeys.map((key) => (
                <Field key={key} vehicle={vehicle} fieldKey={key} onChange={onFieldChange} readOnly={!canEditTab} />
              ))}
            </div>
          </TabSection>
        ) : null}

        {activeTab === "Incidents" && canWindow("fleet-incidents") ? (
          <TabSection title="Vehicle-related incidents">
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {vehicleIncidents.map((incident) => (
                <Link key={incident.id} href={`/incidents/${incident.id}`} className="block px-4 py-3 text-sm hover:bg-slate-50">
                  <span className="font-medium text-slate-900">{incident.documentNo} — {incident.title}</span>
                  <span className="ml-2 text-slate-500">{incident.status}</span>
                </Link>
              ))}
              {!vehicleIncidents.length ? <p className="px-4 py-6 text-sm text-slate-500">No incidents are linked to this vehicle.</p> : null}
            </div>
          </TabSection>
        ) : null}
      </div>
    </div>
  );
}
