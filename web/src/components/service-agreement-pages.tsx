"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { LineItemTable, type GenericTableConfig } from "@/components/line-item-table";
import { ClientRecordLink } from "@/components/record-link";
import { RecordTasksPanel } from "@/components/record-tasks-panel";
import {
  ServiceAgreementScheduleSummary,
  ServiceAgreementScheduleWizard,
} from "@/components/service-agreement-schedule";
import { UnsavedChangesBar } from "@/components/unsaved-changes-bar";
import { useAuth } from "@/lib/auth-store";
import { formatContractDate } from "@/lib/contract";
import { newLineId } from "@/lib/client-line-tables";
import { useReferenceData } from "@/lib/config-store";
import {
  normalizeServiceAgreement,
  type ServiceAgreementLine,
  type ServiceAgreementRecord,
} from "@/lib/service-agreement";
import { useData } from "@/lib/data-store";
import { auditMetaFrom } from "@/lib/audit";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

const lineConfig: GenericTableConfig<ServiceAgreementLine> = {
  columns: [
    { key: "lineNo", label: "Line", type: "number" as const, className: "w-14" },
    { key: "productId", label: "Product", type: "select" as const, optionsKey: "productId" },
    { key: "name", label: "Name", type: "text" as const },
    { key: "plannedPrice", label: "Planned price", type: "text" as const },
    { key: "fundingType", label: "Funding type", type: "select" as const, optionsKey: "fundingType" },
    { key: "fundingBody", label: "Funding body", type: "text" as const },
  ],
  emptyRow: (lineNo: number): ServiceAgreementLine => ({
    id: newLineId("sal"),
    lineNo,
    productId: "",
    name: "",
    description: "",
    plannedPrice: "",
    registrationGroup: "",
    fundingType: "Funding Body",
    fundingBody: "",
    fundingManagementType: "Portal Managed",
    budgetRules: "Strict Limit",
  }),
  addLabel: "Add agreement line",
  emptyMessage: "No service lines yet. Add products from the linked price list.",
};

export function ServiceAgreementListView() {
  const { serviceAgreements, clients } = useData();

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Search key</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Client</th>
            <th className="px-4 py-3">Contract date</th>
            <th className="px-4 py-3">Finish</th>
            <th className="px-4 py-3">Planned amount</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {serviceAgreements.map((sa) => {
            const client = clients.find((c) => c.id === sa.clientId);
            return (
              <tr key={sa.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/service-agreements/${sa.id}`} className="text-[#b51266] hover:underline">
                    {sa.searchKey}
                  </Link>
                </td>
                <td className="px-4 py-3">{sa.name}</td>
                <td className="px-4 py-3">
                  {client ? (
                    <ClientRecordLink id={client.id} searchKey={client.searchKey} name={client.name} className="text-slate-700 hover:underline" />
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">{formatContractDate(sa.contractDate)}</td>
                <td className="px-4 py-3">{formatContractDate(sa.finishDate)}</td>
                <td className="px-4 py-3">${sa.totalPlannedAmount}</td>
                <td className="px-4 py-3">{sa.status}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ClientServiceAgreementsPanel({
  clientId,
  searchKey,
}: {
  clientId: string;
  clientName: string;
  searchKey: string;
}) {
  const { getServiceAgreementsByClientId } = useData();
  const agreements = getServiceAgreementsByClientId(clientId);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        NDIS service agreements for this client. Lines use products from the assigned price list.
      </p>
      {agreements.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {agreements.map((sa) => (
            <Link
              key={sa.id}
              href={`/service-agreements/${sa.id}`}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#f9a8d4] hover:shadow-md"
            >
              <p className="text-xs font-medium text-slate-500">{sa.searchKey}</p>
              <p className="font-semibold text-slate-900">{sa.name}</p>
              <p className="mt-2 text-sm text-slate-600">
                {formatContractDate(sa.contractDate)} → {formatContractDate(sa.finishDate)}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-800">${sa.totalPlannedAmount} planned</p>
              <p className="mt-2 text-xs text-slate-500">{sa.lines.length} service lines</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center">
          <p className="text-sm text-slate-600">No service agreements linked to {searchKey} yet.</p>
        </div>
      )}
    </div>
  );
}

export function ServiceAgreementDetailView({ id }: { id: string }) {
  const { serviceAgreements, clients, products, priceLists, upsertServiceAgreement } = useData();
  const { getOptions } = useReferenceData();
  const { canWriteWindow } = useAuth();
  const canSaveAgreement = canWriteWindow("service-agreements");
  const stored = serviceAgreements.find((r) => r.id === id);
  const [draft, setDraft] = useState<ServiceAgreementRecord | null>(null);
  const [saved, setSaved] = useState(false);
  const record = draft ?? stored ?? null;
  const hasUnsavedChanges = Boolean(draft);
  const client = record ? clients.find((c) => c.id === record.clientId) : null;
  const priceList = record ? priceLists.find((pl) => pl.id === record.priceListId) : null;

  const productDropdown = {
    productId: products.map((p) => p.id),
    fundingType: getOptions("fundingType"),
  };
  const productLabels = Object.fromEntries(products.map((p) => [p.id, `${p.searchKey} — ${p.name}`]));

  if (!record) {
    return (
      <AppShell title="Service agreement not found" audit={{ moduleLabel: "Service agreements" }}>
        <Link href="/service-agreements" className="text-[#b51266] hover:underline">
          Back to service agreements
        </Link>
      </AppShell>
    );
  }

  function onChange<K extends keyof ServiceAgreementRecord>(key: K, value: ServiceAgreementRecord[K]) {
    const base = draft ?? stored;
    if (!base) return;
    const next = { ...base, [key]: value, updatedBy: "SuperUser" };
    setDraft(normalizeServiceAgreement(next));
    setSaved(false);
  }

  return (
    <>
      <AppShell
        title={record.name}
        subtitle={`${record.searchKey} · ${record.status}`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Service agreements", href: "/service-agreements" },
          { label: record.searchKey },
        ]}
        actions={
          client ? (
            <Link
              href={`/clients/${client.id}?tab=Service%20agreements`}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              View client
            </Link>
          ) : null
        }
        audit={{
          entityType: "service-agreement",
          entityId: record.id,
          meta: auditMetaFrom(stored ?? record),
        }}
      >
        <fieldset disabled={!canSaveAgreement} className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4 disabled:opacity-100">
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Name</span>
            <input className={inputClass} value={record.name} onChange={(e) => onChange("name", e.target.value)} />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Term</span>
            <select className={inputClass} value={record.term} onChange={(e) => onChange("term", e.target.value)}>
              {getOptions("serviceAgreementTerm").map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Execution date</span>
            <input className={inputClass} type="date" value={record.executionDate} onChange={(e) => onChange("executionDate", e.target.value)} />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Contract date</span>
            <input className={inputClass} type="date" value={record.contractDate} onChange={(e) => onChange("contractDate", e.target.value)} />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Finish date</span>
            <input className={inputClass} type="date" value={record.finishDate} onChange={(e) => onChange("finishDate", e.target.value)} />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Review date</span>
            <input className={inputClass} type="date" value={record.reviewDate} onChange={(e) => onChange("reviewDate", e.target.value)} />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Price list</span>
            <select className={inputClass} value={record.priceListId} onChange={(e) => onChange("priceListId", e.target.value)}>
              <option value="">None</option>
              {priceLists.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Status</span>
            <select className={inputClass} value={record.status} onChange={(e) => onChange("status", e.target.value)}>
              {getOptions("serviceAgreementStatus").map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Total planned amount</span>
            <input className={inputClass} value={record.totalPlannedAmount} readOnly />
          </label>
        </fieldset>

        <div className="mb-6 space-y-4">
          <ServiceAgreementScheduleSummary lines={record.lines} />
          <ServiceAgreementScheduleWizard
            rows={record.lines}
            readOnly={!canSaveAgreement}
            onApply={(rows) => onChange("lines", rows)}
          />
        </div>

        {client ? (
          <p className="mb-4 text-sm text-slate-600">
            Client:{" "}
            <ClientRecordLink id={client.id} searchKey={client.searchKey} name={client.name} className="font-medium text-[#b51266] hover:underline" />
            {priceList ? <> · Price list: {priceList.name}</> : null}
          </p>
        ) : null}

        <h3 className="mb-3 text-sm font-semibold text-slate-900">Schedule of supports</h3>
        <LineItemTable
          config={lineConfig}
          rows={record.lines}
          dropdowns={productDropdown}
          optionLabels={productLabels}
          onChange={(rows) => onChange("lines", rows)}
          readOnly={!canSaveAgreement}
        />
        {saved && !hasUnsavedChanges ? <p className="mt-4 text-sm text-emerald-700">Saved</p> : null}

        <div className="mt-8 border-t border-slate-200 pt-8">
          <RecordTasksPanel
            entityType="service-agreement"
            entityId={record.id}
            entityLabel={`${record.searchKey} — ${record.name}`}
          />
        </div>
      </AppShell>
      <UnsavedChangesBar
        visible={hasUnsavedChanges && canSaveAgreement}
        onSave={() => {
          upsertServiceAgreement(record);
          setDraft(null);
          setSaved(true);
        }}
        onDiscard={() => {
          setDraft(null);
          setSaved(false);
        }}
      />
    </>
  );
}
