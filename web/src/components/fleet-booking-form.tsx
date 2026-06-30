"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { validateFleetBooking } from "@/lib/fleet-compliance";
import {
  createEmptyFleetBooking,
  fleetBookingStatusOptions,
  fleetVehicleLabel,
  type FleetBookingRow,
  type FleetVehicleRecord,
} from "@/lib/fleet-vehicle";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#b51266] focus:outline-none focus:ring-2 focus:ring-[#b51266]/20";

export type FleetBookingFormProps = {
  /** When set, the vehicle picker is hidden (Fleet → Bookings tab). */
  fixedVehicle?: FleetVehicleRecord;
  /** Prefill values merged into a new booking row. */
  prefill?: Partial<FleetBookingRow>;
  /** When set, saved bookings are linked to this maintenance request. */
  maintenanceRequestId?: string;
  readOnly?: boolean;
  /** Heading for the form card — defaults to "Book this vehicle". */
  formTitle?: string;
  /** Filter the booking list below the form. */
  listFilter?: { vehicleId?: string; maintenanceRequestId?: string; locationId?: string };
};

export function FleetBookingForm({
  fixedVehicle,
  prefill,
  maintenanceRequestId,
  readOnly = false,
  formTitle = "Book this vehicle",
  listFilter,
}: FleetBookingFormProps) {
  const { session } = useAuth();
  const { clients, employees, locations, fleetVehicles, fleetBookings, upsertFleetBooking } = useData();
  const actor = session?.displayName ?? session?.username ?? "User";

  const [booking, setBooking] = useState<FleetBookingRow>(() =>
    createEmptyFleetBooking({
      vehicleId: fixedVehicle?.id ?? prefill?.vehicleId ?? "",
      maintenanceRequestId: maintenanceRequestId ?? prefill?.maintenanceRequestId ?? "",
      createdBy: actor,
      updatedBy: actor,
      ...prefill,
    })
  );
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);

  // Re-seed the form only when the parent record (maintenance request or fixed
  // vehicle) changes — not on every assignment field edit — so in-progress
  // booking edits are never wiped while the user is filling the form.
  const syncedKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const key = `${maintenanceRequestId ?? ""}::${fixedVehicle?.id ?? ""}`;
    if (syncedKeyRef.current === key) return;
    syncedKeyRef.current = key;
    setBooking(
      createEmptyFleetBooking({
        vehicleId: fixedVehicle?.id ?? prefill?.vehicleId ?? "",
        maintenanceRequestId: maintenanceRequestId ?? prefill?.maintenanceRequestId ?? "",
        createdBy: actor,
        updatedBy: actor,
        ...prefill,
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-seed only when the parent record changes
  }, [maintenanceRequestId, fixedVehicle?.id]);

  const locationOptions = useMemo(
    () => locations.map((location) => ({ value: location.id, label: `${location.searchKey} — ${location.name}` })),
    [locations]
  );
  const employeeOptions = useMemo(
    () => employees.map((employee) => ({ value: employee.id, label: `${employee.searchKey} — ${employee.name}` })),
    [employees]
  );
  const clientOptions = useMemo(
    () => clients.map((client) => ({ value: client.id, label: `${client.searchKey} — ${client.name}` })),
    [clients]
  );
  const vehicleOptions = useMemo(
    () =>
      fleetVehicles
        .filter((v) => v.status === "active" || v.id === booking.vehicleId)
        .map((v) => ({ value: v.id, label: fleetVehicleLabel(v) })),
    [fleetVehicles, booking.vehicleId]
  );

  const optionLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    for (const employee of employees) labels[employee.id] = `${employee.searchKey} — ${employee.name}`;
    return labels;
  }, [employees]);

  const clientLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    for (const client of clients) labels[client.id] = client.name;
    return labels;
  }, [clients]);

  const listedBookings = useMemo(() => {
    let rows = fleetBookings;
    if (listFilter?.maintenanceRequestId) {
      rows = rows.filter((row) => row.maintenanceRequestId === listFilter.maintenanceRequestId);
    } else if (listFilter?.vehicleId) {
      rows = rows.filter((row) => row.vehicleId === listFilter.vehicleId);
    } else if (listFilter?.locationId) {
      rows = rows.filter((row) => row.locationId === listFilter.locationId);
    } else if (fixedVehicle) {
      rows = rows.filter((row) => row.vehicleId === fixedVehicle.id);
    }
    return [...rows].sort((a, b) => a.startDatetime.localeCompare(b.startDatetime));
  }, [fleetBookings, listFilter, fixedVehicle]);

  function submitBooking() {
    setBookingMessage(null);
    const vehicle =
      fixedVehicle ?? fleetVehicles.find((row) => row.id === booking.vehicleId);
    const payload: FleetBookingRow = {
      ...booking,
      maintenanceRequestId: maintenanceRequestId ?? booking.maintenanceRequestId,
      updatedBy: actor,
      createdBy: booking.createdBy || actor,
    };
    const issues = validateFleetBooking(
      payload,
      fleetBookings,
      vehicle,
      employees.find((employee) => employee.id === payload.employeeId)
    );
    const blocking = issues.find((issue) => issue.severity === "error");
    if (blocking) {
      setBookingMessage(blocking.message);
      return;
    }
    const error = upsertFleetBooking(payload, vehicle);
    if (error) {
      setBookingMessage(error);
      return;
    }
    setBookingMessage("Vehicle booking saved.");
    setBooking(
      createEmptyFleetBooking({
        vehicleId: fixedVehicle?.id ?? "",
        maintenanceRequestId: maintenanceRequestId ?? "",
        createdBy: actor,
        updatedBy: actor,
        ...prefill,
      })
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 p-4">
        <h3 className="font-medium text-slate-900">{formTitle}</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {!fixedVehicle ? (
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-slate-600">Vehicle</span>
              <select
                className={inputClass}
                value={booking.vehicleId}
                onChange={(e) => setBooking({ ...booking, vehicleId: e.target.value })}
                disabled={readOnly}
              >
                <option value="">Select vehicle…</option>
                {vehicleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Driver</span>
            <select
              className={inputClass}
              value={booking.employeeId}
              onChange={(e) => setBooking({ ...booking, employeeId: e.target.value })}
              disabled={readOnly}
            >
              <option value="">Select driver…</option>
              {employeeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Client (optional)</span>
            <select
              className={inputClass}
              value={booking.clientId}
              onChange={(e) => setBooking({ ...booking, clientId: e.target.value })}
              disabled={readOnly}
            >
              <option value="">None</option>
              {clientOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Location</span>
            <select
              className={inputClass}
              value={booking.locationId}
              onChange={(e) => setBooking({ ...booking, locationId: e.target.value })}
              disabled={readOnly}
            >
              <option value="">None</option>
              {locationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Status</span>
            <select
              className={inputClass}
              value={booking.status}
              onChange={(e) => setBooking({ ...booking, status: e.target.value })}
              disabled={readOnly}
            >
              {fleetBookingStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Start</span>
            <input
              type="datetime-local"
              className={inputClass}
              value={booking.startDatetime}
              onChange={(e) => setBooking({ ...booking, startDatetime: e.target.value })}
              disabled={readOnly}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">End</span>
            <input
              type="datetime-local"
              className={inputClass}
              value={booking.endDatetime}
              onChange={(e) => setBooking({ ...booking, endDatetime: e.target.value })}
              disabled={readOnly}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Purpose</span>
            <input
              className={inputClass}
              value={booking.purpose}
              onChange={(e) => setBooking({ ...booking, purpose: e.target.value })}
              disabled={readOnly}
            />
          </label>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={submitBooking}
            disabled={readOnly}
            className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266] disabled:opacity-50"
          >
            Save booking
          </button>
          {bookingMessage ? (
            <p className={`text-sm ${bookingMessage.includes("saved") ? "text-emerald-700" : "text-slate-600"}`}>
              {bookingMessage}
            </p>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">When</th>
              {!fixedVehicle ? <th className="px-4 py-3">Vehicle</th> : null}
              <th className="px-4 py-3">Driver</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Purpose</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {listedBookings.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3">
                  {row.startDatetime} to {row.endDatetime}
                </td>
                {!fixedVehicle ? (
                  <td className="px-4 py-3">
                    {fleetVehicles.find((v) => v.id === row.vehicleId)?.name ?? row.vehicleId}
                  </td>
                ) : null}
                <td className="px-4 py-3">{optionLabels[row.employeeId] ?? "—"}</td>
                <td className="px-4 py-3">{row.clientId ? clientLabels[row.clientId] ?? row.clientId : "—"}</td>
                <td className="px-4 py-3">{row.purpose}</td>
                <td className="px-4 py-3">{row.status}</td>
              </tr>
            ))}
            {!listedBookings.length ? (
              <tr>
                <td colSpan={fixedVehicle ? 5 : 6} className="px-4 py-6 text-center text-slate-500">
                  No bookings yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
