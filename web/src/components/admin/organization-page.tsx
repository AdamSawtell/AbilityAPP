"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { UnsavedChangesBar } from "@/components/unsaved-changes-bar";
import { useAuth } from "@/lib/auth-store";
import { auditMetaFrom } from "@/lib/audit";
import {
  ORGANIZATION_ID,
  organizationDisplayName,
  organizationSections,
  type OrganizationFieldDef,
  type OrganizationRecord,
} from "@/lib/organization";
import { useOrganization } from "@/lib/organization-store";

function OrgField({
  field,
  value,
  onChange,
}: {
  field: OrganizationFieldDef;
  value: string;
  onChange: (key: keyof OrganizationRecord, value: string) => void;
}) {
  const base =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

  if (field.type === "textarea") {
    return (
      <textarea
        className={`${base} min-h-[120px] resize-y`}
        value={value}
        placeholder={field.placeholder}
        onChange={(e) => onChange(field.key, e.target.value)}
      />
    );
  }

  return (
    <input
      className={base}
      type={field.type === "url" ? "url" : field.type}
      value={value}
      placeholder={field.placeholder}
      onChange={(e) => onChange(field.key, e.target.value)}
    />
  );
}

export function OrganizationAdminView() {
  const { organization, source, updateOrganization, resetOrganization } = useOrganization();
  const { session } = useAuth();
  const [draft, setDraft] = useState<OrganizationRecord | null>(null);
  const [saved, setSaved] = useState(false);

  const record = draft ?? organization;
  const hasUnsavedChanges = Boolean(draft);
  const displayName = organizationDisplayName(record);

  function onChange(key: keyof OrganizationRecord, value: string) {
    const base = draft ?? organization;
    setDraft({
      ...base,
      [key]: value,
      updatedBy: session?.displayName ?? session?.username ?? "SuperUser",
    });
    setSaved(false);
  }

  function onSave() {
    if (!record) return;
    updateOrganization(record);
    setDraft(null);
    setSaved(true);
  }

  function onDiscard() {
    setDraft(null);
    setSaved(false);
  }

  return (
    <>
      <AppShell
        title="Organisation"
        subtitle={
          source === "supabase"
            ? "Provider profile stored in Supabase — used for branding, NDIS details, and future document templates."
            : "Configure your provider organisation profile for branding and NDIS registration details."
        }
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Admin", href: "/admin/organization" },
          { label: "Organisation" },
        ]}
        audit={{
          entityType: "organization",
          entityId: ORGANIZATION_ID,
          meta: auditMetaFrom(organization),
        }}
        actions={
          source === "local" ? (
            <button
              type="button"
              onClick={resetOrganization}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Reset to defaults
            </button>
          ) : null
        }
      >
        <div className="mb-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            {record.logoUrl?.trim() ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={record.logoUrl} alt="" className="h-full w-full object-contain" />
            ) : (
              <span className="text-2xl font-bold text-[#d4147a]">a</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-slate-900">{displayName}</p>
            <p className="text-sm text-slate-500">
              {record.legalName && record.legalName !== record.tradingName ? record.legalName : "Legal name not set"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {record.city && record.state ? `${record.city}, ${record.state}` : "Address not complete"}
              {record.ndisRegistrationNumber ? ` · NDIS ${record.ndisRegistrationNumber}` : ""}
            </p>
          </div>
          {saved && !hasUnsavedChanges ? <span className="text-sm text-emerald-700">Saved</span> : null}
        </div>

        <div className="space-y-6">
          {organizationSections.map((section) => (
            <section key={section.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-slate-900">{section.title}</h2>
                {section.description ? <p className="mt-1 text-sm text-slate-500">{section.description}</p> : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {section.fields.map((field) => (
                  <div
                    key={field.key}
                    className={field.type === "textarea" ? "sm:col-span-2" : ""}
                  >
                    <label className="mb-1 block text-sm font-medium text-slate-700">{field.label}</label>
                    <OrgField field={field} value={String(record[field.key] ?? "")} onChange={onChange} />
                    {field.hint ? <p className="mt-1 text-xs text-slate-400">{field.hint}</p> : null}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </AppShell>

      <UnsavedChangesBar visible={hasUnsavedChanges} onSave={onSave} onDiscard={onDiscard} />
    </>
  );
}
