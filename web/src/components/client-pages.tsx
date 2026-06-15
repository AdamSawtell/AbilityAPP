"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ClientCoreSummary } from "@/components/client-core-summary";
import { ClientTabbedView } from "@/components/client-view";
import { ClientRecordLink, EnquiryRecordLink } from "@/components/record-link";
import { UnsavedChangesBar } from "@/components/unsaved-changes-bar";
import { useData } from "@/lib/data-store";
import { useWorkspace, workspaceKey } from "@/lib/workspace-store";
import type { ClientLineCollectionKey } from "@/lib/client-line-tables";
import type { ClientRecord } from "@/lib/client";

function ClientTabbedViewFallback() {
  return <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading…</div>;
}

function ClientStatusBadge({ status }: { status: string }) {
  const label = status.replace(/^\d+_/, "").replace(/_/g, " ");
  return (
    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200 ring-inset">
      {label}
    </span>
  );
}

export function ClientListView() {
  const { clients } = useData();

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <p className="border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
        Click a client to open them in the workspace. You can keep several open at once.
      </p>
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Search key</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Funding body</th>
            <th className="px-4 py-3">Disability</th>
            <th className="px-4 py-3">Enquiry</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {clients.map((c) => (
            <tr key={c.id} className="hover:bg-[#fdf2f8]/40">
              <td className="px-4 py-3 font-medium">
                <ClientRecordLink
                  id={c.id}
                  searchKey={c.searchKey}
                  name={c.name}
                  className="text-[#b51266] hover:underline"
                />
              </td>
              <td className="px-4 py-3">{c.name}</td>
              <td className="px-4 py-3">
                <ClientStatusBadge status={c.status} />
              </td>
              <td className="max-w-[200px] truncate px-4 py-3 text-slate-600">{c.fundingBody}</td>
              <td className="max-w-[180px] truncate px-4 py-3 text-slate-600">{c.disability}</td>
              <td className="px-4 py-3">
                {c.enquiryId ? (
                  <EnquiryRecordLink
                    id={c.enquiryId}
                    documentNo={c.enquiryId}
                    className="text-slate-600 hover:underline"
                  />
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ClientDetailView({ id }: { id: string }) {
  const { clients, upsertClient, getServiceAgreementsByClientId, getSupportPlanByClientId } = useData();
  const { openClient, setTabDirty, touchTab } = useWorkspace();
  const stored = clients.find((c) => c.id === id);
  const [draft, setDraft] = useState<ClientRecord | null>(null);
  const [saved, setSaved] = useState(false);

  const client = draft ?? stored ?? null;
  const enquiryLink = client?.enquiryId;
  const hasUnsavedChanges = Boolean(draft);
  const agreementCount = getServiceAgreementsByClientId(id).length;
  const hasSupportPlan = Boolean(getSupportPlanByClientId(id));
  const tabKey = workspaceKey("client", id);

  useEffect(() => {
    if (!stored) return;
    openClient(stored.id, stored.searchKey, stored.name);
  }, [id, stored, openClient]);

  useEffect(() => {
    setTabDirty(tabKey, hasUnsavedChanges);
  }, [tabKey, hasUnsavedChanges, setTabDirty]);

  useEffect(() => {
    if (client) touchTab(tabKey, client.searchKey, client.name);
  }, [client, tabKey, touchTab]);

  if (!client) {
    return (
      <AppShell
        title="Client not found"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Clients", href: "/clients" },
          { label: "Not found" },
        ]}
      >
        <p className="text-slate-600">No client with ID {id}.</p>
        <Link href="/clients" className="mt-4 inline-block text-[#b51266] hover:underline">
          Back to clients
        </Link>
      </AppShell>
    );
  }

  function onChange(key: keyof ClientRecord, value: string | boolean) {
    const base = draft ?? stored;
    if (!base) return;
    setDraft({ ...base, [key]: value, updatedBy: "SuperUser" });
    setSaved(false);
  }

  function onLineItemsChange(key: ClientLineCollectionKey, rows: ClientRecord[ClientLineCollectionKey]) {
    const base = draft ?? stored;
    if (!base) return;
    setDraft({ ...base, [key]: rows, updatedBy: "SuperUser" });
    setSaved(false);
  }

  function onSave() {
    if (!client) return;
    upsertClient(client);
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
        title={client.name}
        subtitle={`${client.searchKey}${enquiryLink ? ` · enquiry ${enquiryLink}` : ""}`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Clients", href: "/clients" },
          { label: client.searchKey },
        ]}
        actions={
          <>
            <Link
              href="/clients"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              All clients
            </Link>
            {enquiryLink ? (
              <EnquiryRecordLink
                id={enquiryLink}
                documentNo={enquiryLink}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              />
            ) : null}
          </>
        }
      >
        <ClientCoreSummary client={client} />

        <div className="mb-3 flex items-center gap-3">
          <ClientStatusBadge status={client.status} />
          {saved && !hasUnsavedChanges ? <span className="text-sm text-emerald-700">Saved</span> : null}
          {hasUnsavedChanges ? (
            <span className="text-sm text-amber-700">Unsaved changes</span>
          ) : null}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <Suspense fallback={<ClientTabbedViewFallback />}>
            <ClientTabbedView
              client={client}
              agreementCount={agreementCount}
              hasSupportPlan={hasSupportPlan}
              onChange={onChange}
              onLineItemsChange={onLineItemsChange}
            />
          </Suspense>
        </div>
      </AppShell>

      <UnsavedChangesBar visible={hasUnsavedChanges} onSave={onSave} onDiscard={onDiscard} />
    </>
  );
}
