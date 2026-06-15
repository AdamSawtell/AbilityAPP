"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ContractDateTimeline } from "@/components/contract-date-timeline";
import { ContractTabbedView } from "@/components/contract-view";
import { RecordTasksPanel } from "@/components/record-tasks-panel";
import { ClientRecordLink } from "@/components/record-link";
import { UnsavedChangesBar } from "@/components/unsaved-changes-bar";
import { formatContractDate, type ContractRecord } from "@/lib/contract";
import type { ContractLineCollectionKey } from "@/lib/contract-line-tables";
import { useData } from "@/lib/data-store";
import { auditMetaFrom } from "@/lib/audit";

function ContractFormFallback() {
  return <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading…</div>;
}

export function ContractListView() {
  const { contracts } = useData();

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Document</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Client</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Start</th>
            <th className="px-4 py-3">End</th>
            <th className="px-4 py-3">Review</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {contracts.map((c) => (
            <tr key={c.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium">
                <Link href={`/contracts/${c.id}`} className="text-[#b51266] hover:underline">
                  {c.documentNo}
                </Link>
              </td>
              <td className="max-w-[220px] truncate px-4 py-3">{c.name}</td>
              <td className="px-4 py-3">
                {c.clientId ? (
                  <ClientRecordLink
                    id={c.clientId}
                    searchKey={c.businessPartnerName}
                    name={c.businessPartnerName}
                    className="text-slate-700 hover:underline"
                  />
                ) : (
                  c.businessPartnerName || "—"
                )}
              </td>
              <td className="px-4 py-3 text-slate-600">{c.contractType}</td>
              <td className="px-4 py-3 whitespace-nowrap">{formatContractDate(c.startDate)}</td>
              <td className="px-4 py-3 whitespace-nowrap">{formatContractDate(c.endDate)}</td>
              <td className="px-4 py-3 whitespace-nowrap">{formatContractDate(c.reviewDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ClientContractsPanel({
  clientId,
  clientName,
  searchKey,
}: {
  clientId: string;
  clientName: string;
  searchKey: string;
}) {
  const { getContractsByClientId } = useData();
  const contracts = getContractsByClientId(clientId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Service agreements and linked contracts for this client. Dates drive review and renewal.
        </p>
        <Link
          href={`/contracts/new?clientId=${clientId}`}
          className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
        >
          New contract
        </Link>
      </div>

      {contracts.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {contracts.map((c) => (
            <Link
              key={c.id}
              href={`/contracts/${c.id}`}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#f9a8d4] hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-500">{c.documentNo}</p>
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{c.contractType}</p>
                </div>
                <span className="text-xs text-slate-400">{c.contractTerm}</span>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="text-slate-400">Start</dt>
                  <dd className="font-medium text-slate-800">{formatContractDate(c.startDate)}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">End</dt>
                  <dd className="font-medium text-slate-800">{formatContractDate(c.endDate)}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Review</dt>
                  <dd className="font-medium text-[#b51266]">{formatContractDate(c.reviewDate)}</dd>
                </div>
              </dl>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
          <p className="text-sm text-slate-600">No contracts linked to {searchKey} yet.</p>
          <Link
            href={`/contracts/new?clientId=${clientId}`}
            className="mt-3 inline-block text-sm font-medium text-[#b51266] hover:underline"
          >
            Create contract for {clientName}
          </Link>
        </div>
      )}
    </div>
  );
}

export function ContractDetailView({ id }: { id: string }) {
  const { contracts, clients, upsertContract } = useData();
  const stored = contracts.find((c) => c.id === id);
  const [draft, setDraft] = useState<ContractRecord | null>(null);
  const [saved, setSaved] = useState(false);

  const contract = draft ?? stored ?? null;
  const client = contract?.clientId ? clients.find((c) => c.id === contract.clientId) : null;
  const hasUnsavedChanges = Boolean(draft);

  if (!contract) {
    return (
      <AppShell
        title="Contract not found"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Contracts", href: "/contracts" }, { label: "Not found" }]}
      >
        <p className="text-slate-600">No contract with ID {id}.</p>
        <Link href="/contracts" className="mt-4 inline-block text-[#b51266] hover:underline">
          Back to contracts
        </Link>
      </AppShell>
    );
  }

  function onChange(key: keyof ContractRecord, value: string) {
    const base = draft ?? stored;
    if (!base) return;
    setDraft({ ...base, [key]: value, updatedBy: "SuperUser" });
    setSaved(false);
  }

  function onLineItemsChange(key: ContractLineCollectionKey, rows: ContractRecord[ContractLineCollectionKey]) {
    const base = draft ?? stored;
    if (!base) return;
    setDraft({ ...base, [key]: rows, updatedBy: "SuperUser" });
    setSaved(false);
  }

  function onSave() {
    if (!contract) return;
    upsertContract(contract);
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
        title={`Contract ${contract.documentNo}`}
        subtitle={contract.contractType}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Contracts", href: "/contracts" },
          { label: contract.documentNo },
        ]}
        actions={
          <>
            <Link
              href="/contracts"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              All contracts
            </Link>
            {client ? (
              <ClientRecordLink
                id={client.id}
                searchKey={client.searchKey}
                name={client.name}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 shadow-sm hover:bg-emerald-100"
              >
                View client
              </ClientRecordLink>
            ) : null}
          </>
        }
        audit={{
          entityType: "contract",
          entityId: contract.id,
          meta: auditMetaFrom(stored ?? contract),
        }}
      >
        <ContractDateTimeline contract={contract} />
        {saved && !hasUnsavedChanges ? <p className="mb-4 text-sm text-emerald-700">Saved</p> : null}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <Suspense fallback={<ContractFormFallback />}>
            <ContractTabbedView contract={contract} onChange={onChange} onLineItemsChange={onLineItemsChange} />
          </Suspense>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-8">
          <RecordTasksPanel
            entityType="contract"
            entityId={contract.id}
            entityLabel={`${contract.documentNo} — ${contract.name}`}
          />
        </div>
      </AppShell>
      <UnsavedChangesBar visible={hasUnsavedChanges} onSave={onSave} onDiscard={onDiscard} />
    </>
  );
}

export function NewContractView({ clientId }: { clientId?: string }) {
  const router = useRouter();
  const { clients, addContract } = useData();
  const client = clientId ? clients.find((c) => c.id === clientId) : undefined;
  const seed = useMemo((): ContractRecord | null => {
    if (!client) return null;
    return {
      id: "",
      documentNo: "",
      clientId: client.id,
      businessPartnerName: client.name,
      contractType: "NDIS Service Agreement",
      name: `NDIS Support Agreement - ${client.name}`,
      description: "",
      contractTerm: "Fixed",
      executionDate: new Date().toISOString().slice(0, 10),
      startDate: client.dateSupportCommencement || new Date().toISOString().slice(0, 10),
      endDate: "",
      reviewDate: client.birthday || "",
      reference: "",
      project: "",
      createdBy: "SuperUser",
      updatedBy: "SuperUser",
      audit: [],
    };
  }, [client]);

  const [record, setRecord] = useState<ContractRecord | null>(seed);
  const [error, setError] = useState("");

  if (clientId && !client) {
    return (
      <AppShell title="Client not found">
        <Link href="/contracts" className="text-[#b51266] hover:underline">
          Back to contracts
        </Link>
      </AppShell>
    );
  }

  function onCreate() {
    if (!record || !record.name.trim() || !record.startDate || !record.endDate || !record.reviewDate) {
      setError("Name, start date, end date, and review date are required.");
      return;
    }
    const created = addContract(record);
    router.push(`/contracts/${created.id}`);
  }

  return (
    <AppShell
      title="New contract"
      subtitle={client ? `For ${client.name}` : "Create a contract record"}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Contracts", href: "/contracts" },
        { label: "New" },
      ]}
      audit={{ moduleLabel: "New contract" }}
      actions={
        <>
          <Link
            href={client ? `/clients/${client.id}?tab=Service%20agreements` : "/contracts"}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={onCreate}
            className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
          >
            Create contract
          </button>
        </>
      }
    >
      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}
      {record ? (
        <Suspense fallback={<ContractFormFallback />}>
          <ContractTabbedView
            contract={record}
            onChange={(key, value) => setRecord((prev) => (prev ? { ...prev, [key]: value } : prev))}
            onLineItemsChange={(key, rows) => setRecord((prev) => (prev ? { ...prev, [key]: rows } : prev))}
          />
        </Suspense>
      ) : (
        <p className="text-sm text-slate-500">Open this page from a client to pre-fill the business partner.</p>
      )}
    </AppShell>
  );
}
