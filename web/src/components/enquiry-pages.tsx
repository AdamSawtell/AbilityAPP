"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { EnquiryForm } from "@/components/enquiry-form";
import { RecordTasksPanel } from "@/components/record-tasks-panel";
import { ClientRecordLink } from "@/components/record-link";
import { StatusBadge } from "@/components/status-badge";
import { UnsavedChangesBar } from "@/components/unsaved-changes-bar";
import { detailTabsForRole } from "@/lib/access/catalog";
import { useConvertEnquiry, useData } from "@/lib/data-store";
import { useAuth } from "@/lib/auth-store";
import { useWorkspace, workspaceKey } from "@/lib/workspace-store";
import { formSections, type EnquiryRecord } from "@/lib/enquiry";

export function EnquiryDetailView({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { enquiries, updateEnquiry, getClientByEnquiryId } = useData();
  const convert = useConvertEnquiry();
  const { canProcess, session } = useAuth();
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
  const allowedTabs = detailTabsForRole("enquiries", session?.windowKeys ?? []);
  const defaultTab = allowedTabs[0] ?? "Enquiry details";
  const requestedTab = searchParams.get("tab") ?? defaultTab;
  const activeTab = allowedTabs.includes(requestedTab) ? requestedTab : defaultTab;

  function onChange(key: keyof EnquiryRecord, value: string) {
    const base = draft ?? stored;
    if (!base) return;
    setDraft({ ...base, [key]: value, updatedBy: "SuperUser" });
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
      router.push(`/clients/${client.id}`);
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
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <StatusBadge status={record.status} />
          {saved && !hasUnsavedChanges ? <span className="text-sm text-emerald-700">Saved</span> : null}
          {linkedClient ? (
            <span className="text-sm text-slate-600">
            Linked client:{" "}
            <ClientRecordLink
              id={linkedClient.id}
              searchKey={linkedClient.searchKey}
              name={linkedClient.name}
              className="text-[#b51266] hover:underline"
            >
              {linkedClient.searchKey} — {linkedClient.name}
            </ClientRecordLink>
            </span>
          ) : null}
        </div>
        <EnquiryForm record={record} sections={formSections} onChange={onChange} activeSection={activeTab} />

        <div className="mt-8 border-t border-slate-200 pt-8">
          <RecordTasksPanel
            entityType="enquiry"
            entityId={record.id}
            entityLabel={`${record.documentNo} — ${participantName}`}
          />
        </div>
      </AppShell>

      <UnsavedChangesBar visible={hasUnsavedChanges} onSave={onSave} onDiscard={onDiscard} />
    </>
  );
}
