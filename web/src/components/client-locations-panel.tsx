"use client";

import { useReferenceData } from "@/lib/config-store";
import {
  emptyLocationRow,
  formatLocationAddress,
  locationFlags,
  newLineId,
  renumberLines,
  type ClientLocationRow,
} from "@/lib/client-line-tables";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

function FlagBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600 ring-1 ring-slate-200">
      {label}
    </span>
  );
}

function LocationCard({
  location,
  onChange,
  onRemove,
  onDuplicate,
}: {
  location: ClientLocationRow;
  onChange: (next: ClientLocationRow) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  const { getOptions } = useReferenceData();

  function set<K extends keyof ClientLocationRow>(key: K, value: ClientLocationRow[K]) {
    let next = { ...location, [key]: value };
    if (key === "postToAddress" && value === "Yes") {
      next = { ...next, invoiceAddress: next.invoiceAddress === "Yes" ? next.invoiceAddress : "No" };
    }
    onChange(next);
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">Line {location.lineNo}</p>
          <h3 className="text-base font-semibold text-slate-900">{location.name || "Untitled address"}</h3>
          <p className="mt-1 text-sm text-slate-600">{formatLocationAddress(location)}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {locationFlags(location).map((f) => (
              <FlagBadge key={f} label={f} />
            ))}
            {location.active === "No" ? <FlagBadge label="Inactive" /> : null}
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
        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Address line 3</span>
          <input className={inputClass} value={location.address3} onChange={(e) => set("address3", e.target.value)} />
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

      <div className="mt-4 grid gap-3 rounded-lg border border-slate-100 bg-slate-50/80 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={location.postToAddress === "Yes"}
            onChange={(e) => set("postToAddress", e.target.checked ? "Yes" : "No")}
          />
          Post to address
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={location.invoiceAddress === "Yes"}
            onChange={(e) => set("invoiceAddress", e.target.checked ? "Yes" : "No")}
          />
          Invoice address
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={location.shipToAddress === "Yes"}
            onChange={(e) => set("shipToAddress", e.target.checked ? "Yes" : "No")}
          />
          Ship to address
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={location.serviceDeliveryAddress === "Yes"}
            onChange={(e) => set("serviceDeliveryAddress", e.target.checked ? "Yes" : "No")}
          />
          Service delivery address
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
            placeholder="e.g. Wheelchair access, stairs, key safe"
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

export function ClientLocationsPanel({
  locations,
  onChange,
}: {
  locations: ClientLocationRow[];
  onChange: (rows: ClientLocationRow[]) => void;
}) {
  function updateRow(id: string, next: ClientLocationRow) {
    let rows = locations.map((row) => (row.id === id ? next : row));
    if (next.postToAddress === "Yes") {
      rows = rows.map((row) =>
        row.id === id ? row : { ...row, postToAddress: row.postToAddress === "Yes" ? "No" : row.postToAddress }
      );
    }
    onChange(rows);
  }

  function addLocation() {
    const row = emptyLocationRow(locations.length + 1);
    row.name = "New address";
    onChange(renumberLines([...locations, row]));
  }

  function removeLocation(id: string) {
    onChange(renumberLines(locations.filter((row) => row.id !== id)));
  }

  function duplicateLocation(id: string) {
    const source = locations.find((row) => row.id === id);
    if (!source) return;
    const copy: ClientLocationRow = {
      ...source,
      id: newLineId("loc"),
      name: `${source.name} (copy)`,
      postToAddress: "No",
      invoiceAddress: "No",
    };
    onChange(renumberLines([...locations, copy]));
  }

  const postTo = locations.find((l) => l.postToAddress === "Yes" && l.active === "Yes");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-600">
            Addresses and locations for this client. Mark one as the post to address for mail and correspondence.
          </p>
          {postTo ? (
            <p className="mt-2 text-sm text-slate-700">
              <span className="font-medium">Post to:</span> {postTo.name} — {formatLocationAddress(postTo)}
            </p>
          ) : (
            <p className="mt-2 text-sm text-amber-800">No post to address set.</p>
          )}
        </div>
        <button
          type="button"
          onClick={addLocation}
          className="shrink-0 rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
        >
          Add address
        </button>
      </div>

      {locations.length ? (
        <div className="space-y-4">
          {locations.map((loc) => (
            <LocationCard
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
          No addresses yet. Add a home, postal, or service delivery location.
        </div>
      )}
    </div>
  );
}
