"use client";

import { useEffect, useState } from "react";
import {
  claimAfterGatewaySubmit,
  buildNdisGatewayPayload,
  getNdisGatewayPublicStatus,
  submitPayloadToNdisGateway,
  type NdisGatewayPublicStatus,
} from "@/lib/integrations/ndis-gateway";
import {
  claimGatewaySubmitBlocked,
  revalidateClaimRecord,
  type ClaimValidationContext,
} from "@/lib/claim-papl-validation";
import { normalizeClaim, type ClaimRecord } from "@/lib/claim";
import type { ClientRecord } from "@/lib/client";
import type { ProductRecord } from "@/lib/product";

type ClaimGatewayPanelProps = {
  claim: ClaimRecord;
  client: ClientRecord | undefined;
  products: ProductRecord[];
  validationCtx: ClaimValidationContext;
  canSubmit: boolean;
  actorName: string;
  onSubmitted: (claim: ClaimRecord) => void;
};

export function ClaimGatewayPanel({
  claim,
  client,
  products,
  validationCtx,
  canSubmit,
  actorName,
  onSubmitted,
}: ClaimGatewayPanelProps) {
  const [gatewayStatus, setGatewayStatus] = useState<NdisGatewayPublicStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!canSubmit) return;
    void fetch("/api/billing/ndis-gateway/status", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setGatewayStatus(data as NdisGatewayPublicStatus | null))
      .catch(() => setGatewayStatus(getNdisGatewayPublicStatus()));
  }, [canSubmit]);

  async function handleSubmit() {
    setError("");
    setMessage("");
    const validated = normalizeClaim(revalidateClaimRecord(claim, validationCtx, "gateway"));
    const block = claimGatewaySubmitBlocked(validated, validationCtx);
    if (block) {
      setError(block);
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/billing/ndis-gateway/submit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId: claim.id }),
      });

      if (res.ok) {
        const data = (await res.json()) as { updatedClaim?: ClaimRecord; gatewayRef?: string; dryRun?: boolean };
        const next = data.updatedClaim ?? claimAfterGatewaySubmit(
          validated,
          {
            ok: true,
            batchRef: "",
            gatewayRef: data.gatewayRef ?? "",
            lineCount: validated.lines.length,
            dryRun: Boolean(data.dryRun),
            provider: gatewayStatus?.provider ?? "stub",
          },
          actorName
        );
        onSubmitted(next);
        setMessage(
          data.dryRun
            ? `Dry-run submit succeeded — gateway ref ${data.gatewayRef ?? next.gatewayRef}.`
            : `Submitted to gateway — ref ${data.gatewayRef ?? next.gatewayRef}.`
        );
        return;
      }

      if (res.status === 503) {
        const payload = buildNdisGatewayPayload(validated, client, products);
        const local = await submitPayloadToNdisGateway(payload);
        if (!local.ok) {
          setError(local.message);
          return;
        }
        const next = claimAfterGatewaySubmit(validated, local, actorName);
        onSubmitted(next);
        setMessage(`Local dry-run submit — gateway ref ${local.gatewayRef}.`);
        return;
      }

      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Gateway submit failed.");
    } finally {
      setBusy(false);
    }
  }

  const statusLabel = gatewayStatus ?? getNdisGatewayPublicStatus();
  const canGateway = claim.status === "Draft" && canSubmit;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">NDIS gateway submit</h2>
      <p className="mt-1 text-sm text-slate-600">
        Submit a PAPL-validated claim batch to your NDIS gateway (PRODA, LanternPay, or quickclaim adapter).
      </p>
      <p className="mt-2 text-xs text-slate-500">
        {statusLabel.available
          ? `${statusLabel.provider} — ${statusLabel.mode}${statusLabel.mode === "dry-run" ? " (no live POST)" : ""}: ${statusLabel.message}`
          : statusLabel.message}
      </p>
      {claim.gatewayRef ? (
        <p className="mt-3 text-sm text-slate-700">
          Gateway ref: <span className="font-medium text-slate-900">{claim.gatewayRef}</span> ·{" "}
          {claim.gatewayStatus}
        </p>
      ) : null}
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
          disabled={!canGateway || busy || !statusLabel.available}
          onClick={() => void handleSubmit()}
          className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Submitting…" : claim.status === "Draft" ? "Submit to gateway" : "Already submitted"}
        </button>
      </div>
    </section>
  );
}
