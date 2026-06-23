"use client";

import Link from "next/link";
import { useState } from "react";
import { SystemShell } from "@/components/system/system-shell";
import { UnsavedChangesBar } from "@/components/unsaved-changes-bar";
import { useAdminPageAccess } from "@/lib/access/window-surface";
import { auditMetaFrom } from "@/lib/audit";
import {
  INCIDENT_MANAGEMENT_SETTINGS,
  normalizeInvestigationSlaDays,
} from "@/lib/incident-management-settings";
import { ORGANIZATION_ID } from "@/lib/organization";
import { useOrganization } from "@/lib/organization-store";
import { useSystemAuthOptional } from "@/lib/system-auth-store";

const inputClass =
  "w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

export function IncidentManagementSettingsView() {
  const { hasAccess } = useAdminPageAccess("system");
  const hasPageAccess = hasAccess("system-incident-management");
  const { organization, updateOrganization } = useOrganization();
  const systemAuth = useSystemAuthOptional();
  const [draftSlaDays, setDraftSlaDays] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  const slaDays = draftSlaDays ?? organization.incidentInvestigationSlaDays;
  const hasUnsavedChanges = draftSlaDays !== null;

  function onSave() {
    const nextSla = normalizeInvestigationSlaDays(slaDays);
    updateOrganization({
      ...organization,
      incidentInvestigationSlaDays: nextSla,
      updatedBy: systemAuth?.session?.displayName ?? systemAuth?.session?.username ?? "System",
    });
    setDraftSlaDays(null);
    setSaved(true);
  }

  function onDiscard() {
    setDraftSlaDays(null);
    setSaved(false);
  }

  if (!hasPageAccess) {
    return (
      <SystemShell title="Incident management" audit={{ moduleLabel: "Incident management" }}>
        <p className="text-sm text-slate-600">Sign in to System setup to configure incident defaults.</p>
      </SystemShell>
    );
  }

  return (
    <>
      <SystemShell
        title="Incident management"
        subtitle="Investigation SLA and other incident module defaults for the workspace."
        breadcrumbs={[
          { label: "System", href: "/system" },
          { label: "Incident reports", href: "/system/setup/incidents" },
          { label: "Incident management" },
        ]}
        audit={{
          entityType: "organization",
          entityId: ORGANIZATION_ID,
          meta: auditMetaFrom(organization),
        }}
      >
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">{INCIDENT_MANAGEMENT_SETTINGS.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{INCIDENT_MANAGEMENT_SETTINGS.description}</p>
          </div>
          <label className="block max-w-xs text-sm">
            <span className="mb-1.5 block font-medium text-slate-700">
              {INCIDENT_MANAGEMENT_SETTINGS.slaField.label}
            </span>
            <input
              className={inputClass}
              type="number"
              min={1}
              step={1}
              value={slaDays}
              placeholder={INCIDENT_MANAGEMENT_SETTINGS.slaField.placeholder}
              onChange={(e) => {
                setDraftSlaDays(normalizeInvestigationSlaDays(e.target.value));
                setSaved(false);
              }}
            />
            <span className="mt-1.5 block text-xs text-slate-500">{INCIDENT_MANAGEMENT_SETTINGS.slaField.hint}</span>
          </label>
          {saved && !hasUnsavedChanges ? (
            <p className="mt-4 text-sm text-emerald-700">Saved. The incident dashboard and automations use this value.</p>
          ) : null}
        </section>

        <p className="mt-4 text-sm text-slate-500">
          Pair with{" "}
          <Link href="/system/admin/task-automations" className="font-medium text-[#b51266] hover:underline">
            Task automations
          </Link>{" "}
          for Investigation SLA breached rules, and review statuses under{" "}
          <Link href="/system/reference-data/incidents" className="font-medium text-[#b51266] hover:underline">
            Incident reference data
          </Link>
          .
        </p>
      </SystemShell>

      <UnsavedChangesBar
        visible={hasUnsavedChanges}
        onSave={onSave}
        onDiscard={onDiscard}
        message="Unsaved incident settings"
      />
    </>
  );
}
