"use client";

import { useEffect, useState } from "react";
import {
  enquiryAfterHubSpotSync,
  getCrmPublicStatus,
  getHubSpotPublicStatus,
  syncEnquiryToHubSpot,
  type HubSpotPublicStatus,
} from "@/lib/integrations/hubspot-crm";
import { normalizeEnquiry, type EnquiryRecord } from "@/lib/enquiry";

type CrmPublicStatus = ReturnType<typeof getCrmPublicStatus>;

type EnquiryCrmSyncPanelProps = {
  enquiry: EnquiryRecord;
  canSync: boolean;
  actorName: string;
  onSynced: (enquiry: EnquiryRecord) => void;
};

export function EnquiryCrmSyncPanel({
  enquiry,
  canSync,
  actorName,
  onSynced,
}: EnquiryCrmSyncPanelProps) {
  const [crmStatus, setCrmStatus] = useState<CrmPublicStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!canSync) return;
    void fetch("/api/integrations/crm/status", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCrmStatus(data as CrmPublicStatus | null))
      .catch(() =>
        setCrmStatus({
          hubspot: getHubSpotPublicStatus(),
          webToLeadConfigured: false,
        })
      );
  }, [canSync]);

  async function handleSync() {
    setError("");
    setMessage("");
    setBusy(true);

    try {
      const res = await fetch("/api/integrations/crm/sync", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enquiryId: enquiry.id }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          updatedEnquiry?: EnquiryRecord;
          contactId?: string;
          dryRun?: boolean;
        };
        const next =
          data.updatedEnquiry ??
          enquiryAfterHubSpotSync(
            normalizeEnquiry(enquiry),
            {
              ok: true,
              contactId: data.contactId ?? enquiry.externalCrmId,
              dryRun: Boolean(data.dryRun),
              provider: "hubspot",
            },
            actorName
          );
        onSynced(next);
        setMessage(
          data.dryRun
            ? `Dry-run sync succeeded — contact id ${data.contactId ?? next.externalCrmId}.`
            : `Synced to HubSpot — contact id ${data.contactId ?? next.externalCrmId}.`
        );
        return;
      }

      if (res.status === 503) {
        const local = await syncEnquiryToHubSpot(normalizeEnquiry(enquiry));
        if (!local.ok) {
          setError(local.message);
          return;
        }
        const next = enquiryAfterHubSpotSync(normalizeEnquiry(enquiry), local, actorName);
        onSynced(next);
        setMessage(`Local dry-run sync — contact id ${local.contactId}.`);
        return;
      }

      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "CRM sync failed.");
    } finally {
      setBusy(false);
    }
  }

  const hubspot: HubSpotPublicStatus = crmStatus?.hubspot ?? getHubSpotPublicStatus();

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">External CRM sync</h2>
      <p className="mt-1 text-sm text-slate-600">
        Push this enquiry to HubSpot as a contact when your marketing CRM is connected.
      </p>
      <p className="mt-2 text-xs text-slate-500">
        {hubspot.available
          ? `${hubspot.provider} — ${hubspot.mode}${hubspot.mode === "dry-run" ? " (no live POST)" : ""}: ${hubspot.message}`
          : hubspot.message}
      </p>
      {crmStatus?.webToLeadConfigured ? (
        <p className="mt-2 text-xs text-slate-500">
          Website intake webhook is configured — new form submissions create enquiries automatically.
        </p>
      ) : null}
      {enquiry.externalCrmId ? (
        <p className="mt-3 text-sm text-slate-700">
          CRM contact:{" "}
          <span className="font-medium text-slate-900">{enquiry.externalCrmId}</span>
          {enquiry.externalCrmSyncedAt ? (
            <> · last synced {enquiry.externalCrmSyncedAt.slice(0, 10)}</>
          ) : null}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          {message}
        </p>
      ) : null}
      <div className="mt-4">
        <button
          type="button"
          disabled={!canSync || busy || !hubspot.available}
          onClick={() => void handleSync()}
          className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Syncing…" : enquiry.externalCrmId ? "Re-sync to HubSpot" : "Sync to HubSpot"}
        </button>
      </div>
    </section>
  );
}
