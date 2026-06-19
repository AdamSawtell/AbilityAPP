"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { EnquiryCoreSummary } from "@/components/enquiry-core-summary";
import { EnquiryTabbedView } from "@/components/enquiry-view";
import { ClientRecordLink } from "@/components/record-link";
import { UnsavedChangesBar } from "@/components/unsaved-changes-bar";
import { useConvertEnquiry, useData } from "@/lib/data-store";
import { useAuth } from "@/lib/auth-store";
import { useWorkspace, workspaceKey } from "@/lib/workspace-store";
import type { EnquiryActivityRow, EnquiryRecord } from "@/lib/enquiry";
import { auditMetaFrom } from "@/lib/audit";

function EnquiryTabbedViewFallback() {
  return <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading…</div>;
}

export function EnquiryDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { enquiries, updateEnquiry, getClientByEnquiryId } = useData();
  const convert = useConvertEnquiry();
  const { canProcess } = useAuth();
  const { openEnquiry, setTabDirty } = useWorkspace();
  const stored = enquiries.find((r) => r.id === id);
  const linkedClient = getClientByEnquiryId(id);
  const [draft, setDraft] = useState<EnquiryRecord | null>(null);
  const [saved, setSaved] = useState(false);
  const [converting, setConverting] = useState(false);

  const record = draft ?? stored ?? null;
  const hasUnsavedChanges = Boolean(draft);
  const tabKey = workspaceKey("enquiry", id);

  useEffect(() => {
    if (!stored) return;
    openEnquiry(stored.id, stored.documentNo, `${stored.firstName} ${stored.lastName}`.trim());
  }, [id, stored, openEnquiry]);

  useEffect(() => {
    setTabDirty(tabKey, hasUnsavedChanges);
  }, [tabKey, hasUnsavedChanges, setTabDirty]);

  if (!record) {
    return (
      <AppShell
        title="Enquiry not found"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Enquiries", href: "/enquiries" },
          { label: "Not found" },
        ]}
      >
        <p className="text-slate-600">No record with ID {id}.</p>
        <Link href="/enquiries" className="mt-4 inline-block text-[#b51266] hover:underline">
          Back to enquiries
        </Link>
      </AppShell>
    );
  }

  const isConverted = record.status.startsWith("4_") || Boolean(linkedClient);
  const participantName = `${record.firstName} ${record.lastName}`.trim();

  function onChange(key: keyof EnquiryRecord, value: string) {
    const base = draft ?? stored;
    if (!base) return;
    setDraft({ ...base, [key]: value, updatedBy: "SuperUser" });
    setSaved(false);
  }

  function onActivityChange(rows: EnquiryActivityRow[]) {
    const base = draft ?? stored;
    if (!base) return;
    setDraft({ ...base, activity: rows, updatedBy: "SuperUser" });
    setSaved(false);
  }

  function onSave() {
    if (!record) return;
    updateEnquiry(record);
    setDraft(null);
    setSaved(true);
  }

  function onDiscard() {
    setDraft(null);
    setSaved(false);
  }

  function onConvert() {
    setConverting(true);
    const client = convert(id);
    if (client) {
      router.push(`/clients/${client.id}?tab=${encodeURIComponent("Activity")}`);
    }
    setConverting(false);
  }

  return (
    <>
      <AppShell
        title={`Enquiry ${record.documentNo}`}
        subtitle={participantName || "Participant details"}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Enquiries", href: "/enquiries" },
          { label: record.documentNo },
        ]}
        actions={
          <>
            <Link
              href="/enquiries"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Back
            </Link>
            {linkedClient ? (
              <ClientRecordLink
                id={linkedClient.id}
                searchKey={linkedClient.searchKey}
                name={linkedClient.name}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 shadow-sm hover:bg-emerald-100"
              >
                View client
              </ClientRecordLink>
            ) : canProcess("enquiry-to-client") ? (
              <button
                type="button"
                disabled={converting || isConverted || hasUnsavedChanges}
                title={hasUnsavedChanges ? "Save changes before converting" : undefined}
                onClick={onConvert}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isConverted ? "Converted" : converting ? "Converting…" : "Convert to client"}
              </button>
            ) : null}
          </>
        }
        audit={{
          entityType: "enquiry",
          entityId: record.id,
          meta: auditMetaFrom(stored ?? record),
        }}
      >
        <EnquiryCoreSummary
          record={record}
          participantName={participantName}
          linkedClient={linkedClient}
          saved={saved && !hasUnsavedChanges}
        />

        <Suspense fallback={<EnquiryTabbedViewFallback />}>
          <EnquiryTabbedView
            record={record}
            participantName={participantName}
            onChange={onChange}
            onActivityChange={onActivityChange}
          />
        </Suspense>
      </AppShell>

      <UnsavedChangesBar visible={hasUnsavedChanges} onSave={onSave} onDiscard={onDiscard} />
    </>
  );
}
