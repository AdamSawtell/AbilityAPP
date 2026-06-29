"use client";

import Link from "next/link";
import { useState } from "react";
import { SystemShell } from "@/components/system/system-shell";
import { UnsavedChangesBar } from "@/components/unsaved-changes-bar";
import { auditMetaFrom } from "@/lib/audit";
import { BUDDY_SHIFT_PAY_POLICIES, normalizeBuddyShiftPayPolicy, type BuddyShiftPayPolicy } from "@/lib/buddy-shift";
import { ORGANIZATION_ID } from "@/lib/organization";
import { useOrganization } from "@/lib/organization-store";
import { useSystemAuthOptional } from "@/lib/system-auth-store";
import { SAVE_TOAST_MESSAGES, showSuccessToast } from "@/lib/toast";

const inputClass =
  "w-full max-w-md rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

export function BuddyShiftSettingsView() {
  const { organization, updateOrganization } = useOrganization();
  const systemAuth = useSystemAuthOptional();
  const hasPageAccess = Boolean(systemAuth?.session);
  const [draftPolicy, setDraftPolicy] = useState<BuddyShiftPayPolicy | null>(null);
  const [saved, setSaved] = useState(false);

  const policy = draftPolicy ?? organization.buddyShiftPayPolicy;
  const hasUnsavedChanges = draftPolicy !== null;

  function onSave() {
    updateOrganization({
      ...organization,
      buddyShiftPayPolicy: normalizeBuddyShiftPayPolicy(policy),
      updatedBy: systemAuth?.session?.displayName ?? systemAuth?.session?.username ?? "System",
    });
    setDraftPolicy(null);
    setSaved(true);
    showSuccessToast(SAVE_TOAST_MESSAGES.settings);
  }

  function onDiscard() {
    setDraftPolicy(null);
    setSaved(false);
  }

  if (!hasPageAccess) {
    return (
      <SystemShell title="Buddy shifts" audit={{ moduleLabel: "Buddy shifts" }}>
        <p className="text-sm text-slate-600">Sign in to System setup to configure buddy shift defaults.</p>
      </SystemShell>
    );
  }

  const selected = BUDDY_SHIFT_PAY_POLICIES.find((p) => p.value === policy);

  return (
    <>
      <SystemShell
        title="Buddy shifts"
        subtitle="Default pay handling for buddy, shadow, and orientation roster shifts."
        breadcrumbs={[
          { label: "System", href: "/system" },
          { label: "Organisation", href: "/system/organization" },
          { label: "Buddy shifts" },
        ]}
        audit={{
          entityType: "organization",
          entityId: ORGANIZATION_ID,
          meta: auditMetaFrom(organization),
        }}
      >
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Buddy shift pay policy</h2>
          <p className="mt-1 text-sm text-slate-500">
            Controls whether roster bookers are prompted for paid vs non-payable when scheduling buddy shifts. Billing
            to the participant is set separately on each shift.
          </p>

          <fieldset className="mt-4 space-y-3">
            {BUDDY_SHIFT_PAY_POLICIES.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${
                  policy === option.value ? "border-[#d4147a]/40 bg-[#fdf2f8]/50" : "border-slate-200"
                }`}
              >
                <input
                  type="radio"
                  name="buddyShiftPayPolicy"
                  value={option.value}
                  checked={policy === option.value}
                  onChange={() => {
                    setDraftPolicy(option.value);
                    setSaved(false);
                  }}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-900">{option.label}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{option.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {selected ? (
            <p className="mt-4 text-xs text-slate-500">
              Current: <span className="font-medium text-slate-700">{selected.label}</span> — {selected.hint}
            </p>
          ) : null}

          {saved && !hasUnsavedChanges ? (
            <p className="mt-4 text-sm text-emerald-700">Buddy shift settings saved.</p>
          ) : null}

          <p className="mt-4 text-xs text-slate-500">
            Rostering bookers with write access can create buddy shifts from the week calendar.{" "}
            <Link href="/help/rostering" className="font-medium text-[#b51266] hover:underline">
              How to roster buddy shifts
            </Link>
          </p>
        </section>
      </SystemShell>

      <UnsavedChangesBar visible={hasUnsavedChanges} onSave={onSave} onDiscard={onDiscard} />
    </>
  );
}
