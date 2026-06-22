"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { registerGeneratedDocument } from "@/lib/document-client";
import { useDocumentPlatform } from "@/lib/document-platform-store";
import { DOCUMENT_PRINT_PROCESSES } from "@/lib/document-template";
import type { ClientRecord } from "@/lib/client";
import { exportPhase2DocumentHtml, printPhase2Document } from "@/lib/phase2-document-print";
import { useOrganization } from "@/lib/organization-store";

export function ClientConsentSchedulePanel({ client }: { client: ClientRecord }) {
  const { organization } = useOrganization();
  const { canProcess } = useAuth();
  const { listTemplatesForProcess, resolveTemplate } = useDocumentPlatform();
  const canPrint = canProcess(DOCUMENT_PRINT_PROCESSES.printConsentSchedule);
  const [printError, setPrintError] = useState("");
  const [message, setMessage] = useState("");

  const templateOptions = listTemplatesForProcess(DOCUMENT_PRINT_PROCESSES.printConsentSchedule, "client");
  const activeTemplate =
    resolveTemplate(DOCUMENT_PRINT_PROCESSES.printConsentSchedule, "client") ?? templateOptions[0] ?? null;

  const consentCount = useMemo(() => client.consents?.length ?? 0, [client.consents]);

  async function handlePrint() {
    setPrintError("");
    setMessage("");
    if (!activeTemplate) {
      setPrintError("No active consent schedule template is available.");
      return;
    }
    const ctx = { client, organization };
    const ok = printPhase2Document(ctx, activeTemplate);
    if (!ok) {
      setPrintError("Could not open the print window. Allow pop-ups for this site and try again.");
      return;
    }
    const exported = exportPhase2DocumentHtml(ctx, activeTemplate);
    if (exported) {
      try {
        await registerGeneratedDocument({
          html: exported.html,
          templateId: exported.templateId,
          documentClass: exported.documentClass,
          entityType: "client",
          entityId: client.id,
          entityLabel: `${client.searchKey} — Consent schedule`,
          fileName: `${client.searchKey.replace(/[^\w.-]+/g, "_")}-consent-schedule.html`,
        });
        setMessage("Consent schedule saved to the document registry.");
      } catch (err) {
        setPrintError(err instanceof Error ? err.message : "Could not save to the document registry.");
      }
    }
  }

  if (!canPrint) return null;

  return (
    <div className="mt-6 border-t border-slate-100 pt-5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Consent and information sharing schedule</h4>
          <p className="mt-1 text-sm text-slate-500">
            Print the participant consent schedule for audits, intake, or plan reviews.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handlePrint()}
          className="rounded-lg border border-[#d4147a] bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
        >
          Print consent schedule
        </button>
      </div>
      <p className="text-xs text-slate-500">
        {consentCount} consent line{consentCount === 1 ? "" : "s"}
        {activeTemplate ? ` · Template: ${activeTemplate.name}` : ""}
      </p>
      {printError ? (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">{printError}</p>
      ) : null}
      {message ? (
        <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">{message}</p>
      ) : null}
    </div>
  );
}
