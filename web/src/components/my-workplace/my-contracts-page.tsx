"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DocumentViewerModal } from "@/components/my-workplace/document-viewer-modal";
import { MyWorkplaceGuard, myWorkplaceBreadcrumbs } from "@/components/my-workplace/my-workplace-guard";
import { MyWorkplaceSubnav } from "@/components/my-workplace/my-workplace-subnav";
import { StatusBadge } from "@/components/status-badge";
import { useData } from "@/lib/data-store";
import type { EmployeeRecord } from "@/lib/employee";
import type { MyContractView } from "@/lib/my-workplace/types";

export function MyContractsPage() {
  const { upsertEmployee } = useData();
  const [contracts, setContracts] = useState<MyContractView[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [ackId, setAckId] = useState("");
  const [viewerDoc, setViewerDoc] = useState<MyContractView | null>(null);

  function loadContracts() {
    void fetch("/api/my/contracts", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load contracts");
        return res.json() as Promise<{ contracts: MyContractView[] }>;
      })
      .then((data) => setContracts(data.contracts))
      .catch((err: Error) => setError(err.message));
  }

  useEffect(() => {
    loadContracts();
  }, []);

  async function acknowledge(documentId: string) {
    setAckId(documentId);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/my/contracts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      const body = (await res.json()) as { error?: string; contracts?: MyContractView[]; employee?: EmployeeRecord };
      if (!res.ok) throw new Error(body.error ?? "Acknowledge failed");
      if (body.employee) upsertEmployee(body.employee);
      setContracts(body.contracts ?? []);
      setMessage("Document acknowledged.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Acknowledge failed");
    } finally {
      setAckId("");
    }
  }

  return (
    <MyWorkplaceGuard windowKey="my-contracts">
      <AppShell
        title="Contracts & policies"
        subtitle="View employment documents and confirm you have read required items."
        breadcrumbs={myWorkplaceBreadcrumbs("Contracts")}
        audit={{ moduleLabel: "My contracts" }}
      >
        <MyWorkplaceSubnav />
        {message ? <p className="mb-4 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
        <div className="space-y-4">
          {contracts.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
              No employment contracts or policies are available for your account yet.
            </p>
          ) : (
            contracts.map((doc) => {
              const needsAck = doc.requiresAcknowledgement && !doc.acknowledged;
              return (
                <article key={doc.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{doc.documentType}</p>
                      <h2 className="mt-1 text-lg font-semibold text-slate-900">{doc.name}</h2>
                      <p className="mt-1 text-sm text-slate-600">
                        {doc.issueDate ? `Issued ${doc.issueDate}` : "—"}
                        {doc.documentRef ? ` · Ref ${doc.documentRef}` : ""}
                      </p>
                      {doc.notes ? <p className="mt-2 text-sm text-slate-600">{doc.notes}</p> : null}
                      {doc.acknowledgedAt ? (
                        <p className="mt-2 text-xs text-slate-500">Acknowledged {new Date(doc.acknowledgedAt).toLocaleString("en-AU")}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-start gap-2">
                      <StatusBadge status={needsAck ? "Requested" : doc.acknowledged ? "Approved" : doc.status} />
                      <button
                        type="button"
                        onClick={() => setViewerDoc(doc)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        View document
                      </button>
                      {needsAck ? (
                        <button
                          type="button"
                          disabled={ackId === doc.id}
                          onClick={() => acknowledge(doc.id)}
                          className="rounded-lg bg-[#d4147a] px-3 py-2 text-sm font-medium text-white hover:bg-[#b51266] disabled:opacity-60"
                        >
                          {ackId === doc.id ? "Saving…" : "I have read and agree"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
        <DocumentViewerModal
          open={Boolean(viewerDoc)}
          title={viewerDoc?.name ?? "Document"}
          documentRef={viewerDoc?.documentRef ?? ""}
          onClose={() => setViewerDoc(null)}
        />
      </AppShell>
    </MyWorkplaceGuard>
  );
}
