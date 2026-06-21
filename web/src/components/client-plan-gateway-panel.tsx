"use client";

import { useEffect, useState } from "react";
import type { ClientPlanBudgetRow } from "@/lib/client-line-tables";
import type { ClientRecord } from "@/lib/client";
import {
  getNdisPlanGatewayPublicStatus,
  pullPlanFromNdisGateway,
  type NdisPlanGatewayPublicStatus,
} from "@/lib/integrations/ndis-plan-gateway";
import { replacePlanBudgetCsvRows, appendPlanBudgetCsvRows } from "@/lib/plan-budget-csv-import";

type ClientPlanGatewayPanelProps = {
  client: ClientRecord;
  rows: ClientPlanBudgetRow[];
  canSync: boolean;
  onApply: (rows: ClientPlanBudgetRow[]) => void;
};

export function ClientPlanGatewayPanel({ client, rows, canSync, onApply }: ClientPlanGatewayPanelProps) {
  const [gatewayStatus, setGatewayStatus] = useState<NdisPlanGatewayPublicStatus | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!canSync) return;
    const controller = new AbortController();
    void fetch("/api/integrations/plan/status", { credentials: "include", signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setGatewayStatus(data as NdisPlanGatewayPublicStatus | null))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setGatewayStatus(getNdisPlanGatewayPublicStatus());
      });
    return () => controller.abort();
  }, [canSync]);

  async function handlePull() {
    setError("");
    setMessage("");
    setBusy(true);

    try {
      const res = await fetch("/api/integrations/plan/sync", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          fundingBodyNumber: client.fundingBodyNumber,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          planRef?: string;
          dryRun?: boolean;
          planStart?: string;
          planEnd?: string;
          lines?: Array<{
            supportBudget: string;
            supportCategory: string;
            description: string;
            ndisLineItemRef: string;
            allocatedAmount: number;
            claimedAmount: number;
          }>;
        };

        const imported = data.lines ?? [];
        const next = replaceExisting
          ? replacePlanBudgetCsvRows(imported)
          : appendPlanBudgetCsvRows(rows, imported);

        onApply(next);
        let successMessage = data.dryRun
          ? `Dry-run plan pull succeeded — ${imported.length} line${imported.length === 1 ? "" : "s"} ${replaceExisting ? "replaced" : "appended"} (ref ${data.planRef ?? "n/a"}). Save the client record to persist.`
          : `Plan pulled from gateway — ${imported.length} line${imported.length === 1 ? "" : "s"} ${replaceExisting ? "replaced" : "appended"} (ref ${data.planRef ?? "n/a"}). Save the client record to persist.`;
        if (data.planStart && data.planEnd) {
          successMessage += ` Plan period ${data.planStart} to ${data.planEnd}.`;
        }
        setMessage(successMessage);
        return;
      }

      if (res.status === 503) {
        const local = await pullPlanFromNdisGateway(client);
        if (!local.ok) {
          setError(local.message);
          return;
        }
        const next = replaceExisting
          ? replacePlanBudgetCsvRows(local.lines)
          : appendPlanBudgetCsvRows(rows, local.lines);
        onApply(next);
        setMessage(`Local dry-run plan pull — ref ${local.planRef}. Save the client record to persist.`);
        return;
      }

      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Plan gateway pull failed.");
    } finally {
      setBusy(false);
    }
  }

  const status = gatewayStatus ?? getNdisPlanGatewayPublicStatus();
  const ndisNumber = client.fundingBodyNumber?.trim() ?? "";

  if (!canSync) return null;

  return (
    <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">NDIS plan gateway</h3>
      <p className="mt-1 text-sm text-slate-600">
        Pull plan budget lines from PRODA or your commercial gateway when credentials are configured. Dry-run returns a
        scaffold based on the participant NDIS number.
      </p>
      <p className="mt-2 text-xs text-slate-500">
        {status.available
          ? `${status.provider} — ${status.mode}${status.mode === "dry-run" ? " (sample scaffold)" : ""}: ${status.message}`
          : status.message}
      </p>
      {!ndisNumber ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Add the participant <strong>Funding body number</strong> (NDIS number) on the client profile before pulling a
          plan.
        </p>
      ) : (
        <p className="mt-3 text-sm text-slate-700">
          NDIS number: <span className="font-medium text-slate-900">{ndisNumber}</span>
        </p>
      )}
      <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={replaceExisting}
          onChange={(e) => setReplaceExisting(e.target.checked)}
          className="rounded border-slate-300"
        />
        Replace existing plan budget lines
      </label>
      {error ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">{error}</p>
      ) : null}
      {message ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          {message}
        </p>
      ) : null}
      <div className="mt-4">
        <button
          type="button"
          disabled={busy || !status.available || !ndisNumber}
          onClick={() => void handlePull()}
          className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Pulling plan…" : "Pull plan from gateway"}
        </button>
      </div>
    </section>
  );
}
