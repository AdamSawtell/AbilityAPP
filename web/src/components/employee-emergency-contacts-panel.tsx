"use client";

import { useReferenceData } from "@/lib/config-store";
import type { EmployeeEmergencyContactRow } from "@/lib/employee";
import { emptyEmergencyContactRow, renumberLines } from "@/lib/employee-line-tables";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

function ContactCard({
  contact,
  onChange,
  onRemove,
  onSetPrimary,
}: {
  contact: EmployeeEmergencyContactRow;
  onChange: (next: EmployeeEmergencyContactRow) => void;
  onRemove: () => void;
  onSetPrimary: () => void;
}) {
  const { getOptions } = useReferenceData();

  function set<K extends keyof EmployeeEmergencyContactRow>(key: K, value: EmployeeEmergencyContactRow[K]) {
    onChange({ ...contact, [key]: value });
  }

  return (
    <article
      className={`rounded-xl border bg-white p-5 shadow-sm ${
        contact.primaryContact === "Yes" ? "border-indigo-200 ring-1 ring-indigo-100" : "border-slate-200"
      }`}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">Line {contact.lineNo}</p>
          <h3 className="text-base font-semibold text-slate-900">{contact.name || "Unnamed contact"}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {[contact.contactType, contact.relationship].filter(Boolean).join(" · ") || "—"}
          </p>
          {contact.primaryContact === "Yes" ? (
            <span className="mt-2 inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-indigo-800 ring-1 ring-indigo-200">
              Primary
            </span>
          ) : null}
        </div>
        <div className="flex gap-2">
          {contact.primaryContact !== "Yes" ? (
            <button type="button" onClick={onSetPrimary} className="text-xs font-medium text-indigo-700 hover:text-indigo-900">
              Set primary
            </button>
          ) : null}
          <button type="button" onClick={onRemove} className="text-xs font-medium text-red-600 hover:text-red-700">
            Remove
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Contact type</span>
          <select className={inputClass} value={contact.contactType} onChange={(e) => set("contactType", e.target.value)}>
            {getOptions("emergencyContactType").map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Name</span>
          <input className={inputClass} value={contact.name} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Relationship</span>
          <select className={inputClass} value={contact.relationship} onChange={(e) => set("relationship", e.target.value)}>
            <option value="">—</option>
            {getOptions("contactRelationship").map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Call order</span>
          <input
            type="number"
            min={1}
            className={inputClass}
            value={contact.callOrder}
            onChange={(e) => set("callOrder", Number(e.target.value) || 1)}
          />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Phone</span>
          <input className={inputClass} value={contact.phone} onChange={(e) => set("phone", e.target.value)} />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Mobile</span>
          <input className={inputClass} value={contact.mobile} onChange={(e) => set("mobile", e.target.value)} />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Email</span>
          <input type="email" className={inputClass} value={contact.email} onChange={(e) => set("email", e.target.value)} />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Notes</span>
          <textarea className={`${inputClass} min-h-[72px] resize-y`} value={contact.notes} onChange={(e) => set("notes", e.target.value)} />
        </label>
      </div>
    </article>
  );
}

export function PrimaryEmergencyContactSummary({
  contact,
  tabHref,
}: {
  contact?: EmployeeEmergencyContactRow;
  tabHref: string;
}) {
  if (!contact) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Primary emergency contact</h3>
          <p className="mt-1 text-sm text-slate-700">{contact.name}</p>
          <p className="text-sm text-slate-500">
            {[contact.relationship, contact.mobile || contact.phone].filter(Boolean).join(" · ")}
          </p>
        </div>
        <a href={tabHref} className="text-sm font-medium text-[#b51266] hover:underline">
          Manage contacts
        </a>
      </div>
    </div>
  );
}

export function EmployeeEmergencyContactsPanel({
  contacts,
  onChange,
}: {
  contacts: EmployeeEmergencyContactRow[];
  onChange: (rows: EmployeeEmergencyContactRow[]) => void;
}) {
  function updateRow(id: string, next: EmployeeEmergencyContactRow) {
    onChange(renumberLines(contacts.map((c) => (c.id === id ? next : c))));
  }

  function removeRow(id: string) {
    onChange(renumberLines(contacts.filter((c) => c.id !== id)));
  }

  function setPrimary(id: string) {
    onChange(
      renumberLines(
        contacts.map((c) => ({
          ...c,
          primaryContact: c.id === id ? "Yes" : "No",
        }))
      )
    );
  }

  function addContact() {
    onChange(renumberLines([...contacts, emptyEmergencyContactRow(contacts.length + 1)]));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Emergency contacts & next of kin</h3>
          <p className="text-sm text-slate-500">One or more contacts with a single primary for urgent reach-out.</p>
        </div>
        <button
          type="button"
          onClick={addContact}
          className="rounded-lg bg-[#d4147a] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#b51266]"
        >
          Add contact
        </button>
      </div>

      {contacts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
          No emergency contacts yet.
        </div>
      ) : (
        <div className="space-y-4">
          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onChange={(next) => updateRow(contact.id, next)}
              onRemove={() => removeRow(contact.id)}
              onSetPrimary={() => setPrimary(contact.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
