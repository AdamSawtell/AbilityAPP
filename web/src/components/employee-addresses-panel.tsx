"use client";

import Link from "next/link";
import { useReferenceData } from "@/lib/config-store";
import type { EmployeeLocationRow } from "@/lib/employee";
import { emptyEmployeeLocationRow, renumberLines } from "@/lib/employee-line-tables";
import { formatEmployeeAddress } from "@/lib/employee";
import { newLineId } from "@/lib/client-line-tables";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

function AddressCard({
  location,
  onChange,
  onRemove,
  onDuplicate,
}: {
  location: EmployeeLocationRow;
  onChange: (next: EmployeeLocationRow) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  const { getOptions } = useReferenceData();

  function set<K extends keyof EmployeeLocationRow>(key: K, value: EmployeeLocationRow[K]) {
    onChange({ ...location, [key]: value });
  }

  return (
    <article
      className={`rounded-xl border bg-white p-5 shadow-sm ${
        location.primaryAddress === "Yes" ? "border-indigo-200 ring-1 ring-indigo-100" : "border-slate-200"
      }`}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">Line {location.lineNo}</p>
          <h3 className="text-base font-semibold text-slate-900">{location.name || "Untitled address"}</h3>
          <p className="mt-1 text-sm text-slate-600">{formatEmployeeAddress(location)}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {location.primaryAddress === "Yes" ? (
              <span className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-indigo-800 ring-1 ring-indigo-200">
                Primary
              </span>
            ) : null}
            {location.active === "No" ? (
              <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600 ring-1 ring-slate-200">
                Inactive
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onDuplicate} className="text-xs font-medium text-slate-600 hover:text-slate-900">
            Duplicate
          </button>
          <button type="button" onClick={onRemove} className="text-xs font-medium text-red-600 hover:text-red-700">
            Remove
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Location name</span>
          <input className={inputClass} value={location.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Home" />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Address type</span>
          <select className={inputClass} value={location.addressType} onChange={(e) => set("addressType", e.target.value)}>
            {getOptions("addressType").map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Address line 1</span>
          <input className={inputClass} value={location.address1} onChange={(e) => set("address1", e.target.value)} />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Address line 2</span>
          <input className={inputClass} value={location.address2} onChange={(e) => set("address2", e.target.value)} />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-medium text-slate-600">City / suburb</span>
          <input className={inputClass} value={location.city} onChange={(e) => set("city", e.target.value)} />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-medium text-slate-600">State</span>
          <select className={inputClass} value={location.state} onChange={(e) => set("state", e.target.value)}>
            <option value="">Select…</option>
            {getOptions("australianState").map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Postcode</span>
          <input className={inputClass} value={location.postcode} onChange={(e) => set("postcode", e.target.value)} />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Country</span>
          <select className={inputClass} value={location.country} onChange={(e) => set("country", e.target.value)}>
            {getOptions("country").map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Phone</span>
          <input className={inputClass} type="tel" value={location.phone} onChange={(e) => set("phone", e.target.value)} />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Mobile</span>
          <input className={inputClass} type="tel" value={location.mobile} onChange={(e) => set("mobile", e.target.value)} />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Email</span>
          <input className={inputClass} type="email" value={location.email} onChange={(e) => set("email", e.target.value)} />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 rounded-lg border border-slate-100 bg-slate-50/80 p-4">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={location.primaryAddress === "Yes"}
            onChange={(e) => set("primaryAddress", e.target.checked ? "Yes" : "No")}
          />
          Primary address
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={location.active === "Yes"}
            onChange={(e) => set("active", e.target.checked ? "Yes" : "No")}
          />
          Active
        </label>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Valid from</span>
          <input className={inputClass} type="date" value={location.validFrom} onChange={(e) => set("validFrom", e.target.value)} />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Valid to</span>
          <input className={inputClass} type="date" value={location.validTo} onChange={(e) => set("validTo", e.target.value)} />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Access notes</span>
          <textarea
            className={`${inputClass} min-h-[64px] resize-y`}
            value={location.accessNotes}
            onChange={(e) => set("accessNotes", e.target.value)}
          />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Description</span>
          <textarea
            className={`${inputClass} min-h-[64px] resize-y`}
            value={location.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </label>
      </div>
    </article>
  );
}

export function PrimaryAddressSummary({
  primary,
  addressTabHref,
}: {
  primary?: EmployeeLocationRow;
  addressTabHref?: string;
}) {
  if (!primary) {
    return (
      <div className="rounded-lg border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
        No primary address set.
        {addressTabHref ? (
          <>
            {" "}
            <Link href={addressTabHref} className="font-medium text-[#b51266] hover:underline">
              Add an address
            </Link>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Primary address</p>
      <p className="mt-1 font-medium text-slate-900">{primary.name}</p>
      <p className="text-sm text-slate-600">{formatEmployeeAddress(primary)}</p>
      {addressTabHref ? (
        <Link href={addressTabHref} className="mt-2 inline-block text-sm text-[#b51266] hover:underline">
          Manage all addresses
        </Link>
      ) : null}
    </div>
  );
}

export function EmployeeAddressesPanel({
  locations,
  onChange,
}: {
  locations: EmployeeLocationRow[];
  onChange: (rows: EmployeeLocationRow[]) => void;
}) {
  function updateRow(id: string, next: EmployeeLocationRow) {
    let rows = locations.map((row) => (row.id === id ? next : row));
    if (next.primaryAddress === "Yes") {
      rows = rows.map((row) =>
        row.id === id ? row : { ...row, primaryAddress: row.primaryAddress === "Yes" ? "No" : row.primaryAddress }
      );
    }
    onChange(rows);
  }

  function addAddress() {
    const row = emptyEmployeeLocationRow(locations.length + 1);
    row.name = "New address";
    if (locations.length === 0) row.primaryAddress = "Yes";
    onChange(renumberLines([...locations, row]));
  }

  function removeLocation(id: string) {
    onChange(renumberLines(locations.filter((row) => row.id !== id)));
  }

  function duplicateLocation(id: string) {
    const source = locations.find((row) => row.id === id);
    if (!source) return;
    const copy: EmployeeLocationRow = {
      ...source,
      id: newLineId("emp-loc"),
      name: `${source.name} (copy)`,
      primaryAddress: "No",
    };
    onChange(renumberLines([...locations, copy]));
  }

  const primary = locations.find((l) => l.primaryAddress === "Yes" && l.active === "Yes");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Addresses</h3>
          <p className="text-sm text-slate-500">
            One or more addresses per employee. Mark exactly one as primary for mail and payroll.
          </p>
          {primary ? (
            <p className="mt-2 text-sm text-slate-700">
              <span className="font-medium">Primary:</span> {primary.name} — {formatEmployeeAddress(primary)}
            </p>
          ) : (
            <p className="mt-2 text-sm text-amber-800">No primary address set.</p>
          )}
        </div>
        <button
          type="button"
          onClick={addAddress}
          className="shrink-0 rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
        >
          Add address
        </button>
      </div>

      {locations.length ? (
        <div className="space-y-4">
          {locations.map((loc) => (
            <AddressCard
              key={loc.id}
              location={loc}
              onChange={(next) => updateRow(loc.id, next)}
              onRemove={() => removeLocation(loc.id)}
              onDuplicate={() => duplicateLocation(loc.id)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center text-sm text-slate-600">
          No addresses yet. Add a home or postal address.
        </div>
      )}
    </div>
  );
}
