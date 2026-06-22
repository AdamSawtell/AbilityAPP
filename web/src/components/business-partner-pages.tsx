"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { UnsavedChangesBar } from "@/components/unsaved-changes-bar";
import { useModuleSaveAccess } from "@/lib/access/use-detail-write-access";
import { useAuth } from "@/lib/auth-store";
import { auditMetaFrom } from "@/lib/audit";
import {
  businessPartnerSections,
  type BusinessPartnerFieldDef,
  type BusinessPartnerRecord,
} from "@/lib/business-partner";
import { useReferenceData } from "@/lib/config-store";
import { useData } from "@/lib/data-store";

function PartnerField({
  field,
  value,
  onChange,
  readOnly,
}: {
  field: BusinessPartnerFieldDef;
  value: string;
  onChange: (key: keyof BusinessPartnerRecord, value: string) => void;
  readOnly?: boolean;
}) {
  const { getOptions } = useReferenceData();
  const base =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20 disabled:bg-slate-50 disabled:text-slate-500";

  if (field.readOnly || readOnly) {
    return <input className={base} value={value || "—"} readOnly disabled />;
  }

  if (field.type === "textarea") {
    return (
      <textarea
        className={`${base} min-h-[80px] resize-y`}
        value={value}
        onChange={(e) => onChange(field.key, e.target.value)}
      />
    );
  }

  if (field.type === "select" && field.optionsKey) {
    const options = getOptions(field.optionsKey);
    return (
      <select className={base} value={value} onChange={(e) => onChange(field.key, e.target.value)}>
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      className={base}
      type={field.type === "email" ? "email" : field.type === "tel" ? "tel" : "text"}
      value={value}
      onChange={(e) => onChange(field.key, e.target.value)}
    />
  );
}

function PartnerForm({
  partner,
  onChange,
  readOnly = false,
}: {
  partner: BusinessPartnerRecord;
  onChange: (key: keyof BusinessPartnerRecord, value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-6">
      {businessPartnerSections.map((section) => (
        <section key={section.title} className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">{section.title}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {section.fields.map((field) => (
              <label key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">{field.label}</span>
                <PartnerField
                  field={field}
                  value={String(partner[field.key] ?? "")}
                  onChange={onChange}
                  readOnly={readOnly}
                />
              </label>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function BusinessPartnerListView() {
  const { businessPartners } = useData();
  const { canWriteWindow } = useAuth();
  const canCreate = canWriteWindow("business-partners");

  return (
    <div className="space-y-4">
      {canCreate ? (
        <div className="flex justify-end">
          <Link
            href="/business-partners/new"
            className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
          >
            New business partner
          </Link>
        </div>
      ) : null}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Search key</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Payment terms</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {businessPartners.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/business-partners/${p.id}`} className="text-[#b51266] hover:underline">
                    {p.searchKey}
                  </Link>
                </td>
                <td className="max-w-[240px] truncate px-4 py-3">{p.name}</td>
                <td className="px-4 py-3 text-slate-600">{p.partnerType || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{p.status || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{p.email || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{p.paymentTerms || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function BusinessPartnerDetailView({ id }: { id: string }) {
  const { businessPartners, upsertBusinessPartner } = useData();
  const canSave = useModuleSaveAccess("business-partners", "business-partner");
  const stored = businessPartners.find((p) => p.id === id);
  const [draft, setDraft] = useState<BusinessPartnerRecord | null>(null);
  const [saved, setSaved] = useState(false);

  const partner = draft ?? stored ?? null;
  const hasUnsavedChanges = Boolean(draft);

  if (!partner) {
    return (
      <AppShell
        title="Business partner not found"
        audit={{ moduleLabel: "Business partners" }}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Business partners", href: "/business-partners" },
          { label: "Not found" },
        ]}
      >
        <p className="text-slate-600">No business partner with ID {id}.</p>
        <Link href="/business-partners" className="mt-4 inline-block text-[#b51266] hover:underline">
          Back to business partners
        </Link>
      </AppShell>
    );
  }

  function onChange(key: keyof BusinessPartnerRecord, value: string) {
    const base = draft ?? stored;
    if (!base) return;
    setDraft({ ...base, [key]: value, updatedBy: "SuperUser" });
    setSaved(false);
  }

  function onSave() {
    if (!partner) return;
    try {
      upsertBusinessPartner(partner);
      setDraft(null);
      setSaved(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not save business partner.");
    }
  }

  function onDiscard() {
    setDraft(null);
    setSaved(false);
  }

  return (
    <>
      <AppShell
        title={partner.name}
        subtitle={`${partner.searchKey} · ${partner.partnerType || "External partner"}`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Business partners", href: "/business-partners" },
          { label: partner.searchKey },
        ]}
        audit={{
          entityType: "business-partner",
          entityId: partner.id,
          meta: auditMetaFrom(stored ?? partner),
        }}
      >
        {saved && !hasUnsavedChanges ? <p className="mb-4 text-sm text-emerald-700">Saved</p> : null}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <PartnerForm partner={partner} onChange={onChange} readOnly={!canSave} />
        </div>
      </AppShell>
      <UnsavedChangesBar visible={hasUnsavedChanges && canSave} onSave={onSave} onDiscard={onDiscard} />
    </>
  );
}

export function NewBusinessPartnerView() {
  const router = useRouter();
  const { addBusinessPartner } = useData();
  const { canWriteWindow } = useAuth();
  const canCreate = canWriteWindow("business-partners");

  const seed = useMemo(
    (): BusinessPartnerRecord => ({
      id: "",
      searchKey: "",
      name: "",
      partnerType: "Plan manager",
      status: "Active",
      email: "",
      phone: "",
      mobile: "",
      abn: "",
      address1: "",
      address2: "",
      city: "",
      state: "SA",
      postcode: "",
      country: "Australia",
      preferredCommunicationMethod: "Email",
      invoiceDeliveryMethod: "Email",
      statementDeliveryMethod: "Email",
      paymentTerms: "14 days",
      bankBsb: "",
      bankAccountNumber: "",
      bankAccountName: "",
      remittanceEmail: "",
      notes: "",
      createdBy: "SuperUser",
      updatedBy: "SuperUser",
    }),
    []
  );

  const [record, setRecord] = useState(seed);
  const [error, setError] = useState("");

  if (!canCreate) {
    return (
      <AppShell title="New business partner" audit={{ moduleLabel: "Business partners" }}>
        <p className="text-slate-600">You do not have permission to create business partners.</p>
      </AppShell>
    );
  }

  function onChange(key: keyof BusinessPartnerRecord, value: string) {
    setRecord((prev) => ({ ...prev, [key]: value, updatedBy: "SuperUser" }));
    setError("");
  }

  function onCreate() {
    if (!record.searchKey.trim() || !record.name.trim() || !record.partnerType.trim()) {
      setError("Search key, name, and partner type are required.");
      return;
    }
    try {
      const created = addBusinessPartner(record);
      router.push(`/business-partners/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create business partner.");
    }
  }

  return (
    <AppShell
      title="New business partner"
      subtitle="Plan managers, vendors, referrers, and other external organisations"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Business partners", href: "/business-partners" },
        { label: "New" },
      ]}
      audit={{ moduleLabel: "Business partners" }}
      actions={
        <button
          type="button"
          onClick={onCreate}
          className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
        >
          Create partner
        </button>
      }
    >
      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <PartnerForm partner={record} onChange={onChange} />
      </div>
    </AppShell>
  );
}
