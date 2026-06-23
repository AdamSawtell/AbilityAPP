"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ClaimValidationPanel } from "@/components/claim-validation-panel";
import { LineItemTable } from "@/components/line-item-table";
import { ClientRecordLink } from "@/components/record-link";
import { UnsavedChangesBar } from "@/components/unsaved-changes-bar";
import { useAuth } from "@/lib/auth-store";
import { auditMetaFrom } from "@/lib/audit";
import type { ClaimLine } from "@/lib/claim";
import {
  revalidateClaimRecord,
  type ClaimValidationContext,
} from "@/lib/claim-papl-validation";
import { invoiceLineTableConfig } from "@/lib/invoice-line-tables";
import {
  generateInvoicesFromTimesheets,
  previewInvoiceGeneration,
  type InvoiceGenerationContext,
} from "@/lib/invoice-generation";
import {
  formatInvoicePeriod,
  invoiceDropdowns,
  invoiceRecordIsLocked,
  normalizeInvoice,
  type InvoiceRecord,
} from "@/lib/invoice";
import { useData } from "@/lib/data-store";
import { DOCUMENT_PRINT_PROCESSES } from "@/lib/document-template";
import { useDocumentPlatform } from "@/lib/document-platform-store";
import { downloadDocumentHtml } from "@/lib/document-render";
import { RecordDocumentsSection } from "@/components/record-documents-section";
import { auditDocumentProcess, registerDocumentWithAudit } from "@/lib/document-print-audit";
import { downloadDocumentPdf } from "@/lib/document-pdf.client";
import { batchPrintInvoices } from "@/lib/invoice-batch-print";
import { exportClientInvoiceHtml, printClientInvoice } from "@/lib/invoice-print";
import { emailHandoffMessage, launchEmailWithPdfAttachment } from "@/lib/document-email-handoff";
import { organizationDisplayName } from "@/lib/organization";
import { useOrganization } from "@/lib/organization-store";
import { weekStartFromDate } from "@/lib/roster-shift";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

const statusTone: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-700",
  Sent: "bg-sky-100 text-sky-950",
  Paid: "bg-emerald-100 text-emerald-800",
  Void: "bg-rose-100 text-rose-950",
};

function clientLabel(clients: { id: string; searchKey: string; name: string }[], id: string): string {
  const match = clients.find((c) => c.id === id);
  return match ? `${match.searchKey} — ${match.name}` : id || "—";
}

function buildInvoiceContext(data: ReturnType<typeof useData>): InvoiceGenerationContext {
  return {
    timesheets: data.timesheets,
    claims: data.claims,
    invoices: data.invoices,
    rosterShifts: data.rosterShifts,
    locations: data.locations,
    clients: data.clients,
    businessPartners: data.businessPartners,
    serviceBookings: data.serviceBookings,
    products: data.products,
    priceLists: data.priceLists,
  };
}

function validationContext(data: ReturnType<typeof useData>): ClaimValidationContext {
  return {
    clients: data.clients,
    serviceBookings: data.serviceBookings,
    products: data.products,
    priceLists: data.priceLists,
  };
}

function invoiceLinesAsClaimLines(record: InvoiceRecord): ClaimLine[] {
  return record.lines.map((line) => ({
    id: line.id,
    lineNo: line.lineNo,
    timesheetId: line.timesheetId,
    timesheetLineId: line.timesheetLineId,
    rosterShiftId: line.rosterShiftId,
    clientId: line.clientId,
    employeeId: line.employeeId,
    serviceBookingId: line.serviceBookingId,
    productId: line.productId,
    ndisSupportItem: line.ndisSupportItem,
    supportCategory: line.supportCategory,
    serviceDate: line.serviceDate,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    lineAmount: line.lineAmount,
    claimType: "Standard",
    validationStatus: line.validationStatus,
    validationMessage: line.validationMessage,
  }));
}

function revalidateInvoiceLines(record: InvoiceRecord, data: ReturnType<typeof useData>): InvoiceRecord {
  const asClaim = {
    id: record.id,
    documentNo: record.documentNo,
    clientId: record.clientId,
    periodStart: record.periodStart,
    periodEnd: record.periodEnd,
    status: record.status,
    planManagementType: record.planManagementType,
    totalAmount: record.totalAmount,
    gatewayStatus: "Not submitted",
    gatewayRef: "",
    remittanceStatus: "Not imported",
    remittancePaidAmount: 0,
    remittancePaymentRef: "",
    remittanceImportedAt: "",
    notes: record.notes,
    lines: invoiceLinesAsClaimLines(record),
    createdBy: record.createdBy,
    updatedBy: record.updatedBy,
  };
  const validated = revalidateClaimRecord(asClaim, validationContext(data), "save");
  return normalizeInvoice({
    ...record,
    lines: record.lines.map((line) => {
      const match = validated.lines.find((l) => l.id === line.id);
      return match
        ? { ...line, validationStatus: match.validationStatus, validationMessage: match.validationMessage }
        : line;
    }),
  });
}

function invoiceSaveBlocked(record: InvoiceRecord): string | null {
  const errors = record.lines.filter((l) => l.validationStatus === "error");
  if (errors.length) {
    return `Fix ${errors.length} line validation error${errors.length === 1 ? "" : "s"} before saving.`;
  }
  if (record.status === "Sent" && !record.invoiceTo?.trim()) {
    return "Enter an invoice recipient before marking as Sent.";
  }
  return null;
}

export function InvoiceListView() {
  const { invoices, clients } = useData();
  const { organization } = useOrganization();
  const { canProcess } = useAuth();
  const { listTemplatesForProcess, resolveTemplate } = useDocumentPlatform();
  const canBatchPrint = canProcess(DOCUMENT_PRINT_PROCESSES.batchPrintInvoices);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [templateId, setTemplateId] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [batchMessage, setBatchMessage] = useState("");
  const [batchError, setBatchError] = useState("");

  const templateOptions = listTemplatesForProcess(DOCUMENT_PRINT_PROCESSES.batchPrintInvoices, "invoice");
  const activeTemplateId =
    templateId ||
    resolveTemplate(DOCUMENT_PRINT_PROCESSES.batchPrintInvoices, "invoice")?.id ||
    templateOptions[0]?.id ||
    "";
  const activeTemplate =
    templateOptions.find((t) => t.id === activeTemplateId) ??
    resolveTemplate(DOCUMENT_PRINT_PROCESSES.batchPrintInvoices, "invoice", activeTemplateId) ??
    templateOptions[0] ??
    null;

  const rows = useMemo(() => {
    let sorted = [...invoices].sort((a, b) => (b.periodStart || "").localeCompare(a.periodStart || ""));
    if (statusFilter) sorted = sorted.filter((r) => r.status === statusFilter);
    return sorted;
  }, [invoices, statusFilter]);

  const allSelected = rows.length > 0 && rows.every((row) => selectedIds.has(row.id));

  const toggleAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(rows.map((row) => row.id)));
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBatchPrint = async (format: "html" | "pdf" = "html") => {
    setBatchError("");
    setBatchMessage("");
    if (!canBatchPrint) {
      setBatchError("You do not have permission to batch print invoices.");
      return;
    }
    if (!activeTemplate) {
      setBatchError("No active invoice template is available.");
      return;
    }
    const selected = rows.filter((row) => selectedIds.has(row.id));
    if (!selected.length) {
      setBatchError("Select at least one invoice.");
      return;
    }
    setBusy(true);
    setProgress(`Preparing 0 of ${selected.length}…`);
    try {
      const result = await batchPrintInvoices({
        invoices: selected,
        clients,
        organization,
        template: activeTemplate,
        format,
        onProgress: ({ current, total, documentNo }) => {
          setProgress(`Generating ${current} of ${total} — ${documentNo}`);
        },
      });
      if (!result.ok) {
        setBatchError(result.message);
        return;
      }
      setBatchMessage(result.message);
      setSelectedIds(new Set());
    } catch (err) {
      setBatchError(err instanceof Error ? err.message : "Batch print failed.");
    } finally {
      setBusy(false);
      setProgress("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3">
        <p className="text-sm text-slate-600">
          Follow up unpaid or overdue participant invoices on the invoice reconciliation dashboard before financial close.
        </p>
        <Link
          href="/invoice-reconciliation"
          className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Invoice reconciliation
        </Link>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Participant invoices for plan-managed and self-managed NDIS billing — generated from verified timesheet lines.
        </p>
        <Link
          href="/generate-invoices"
          className="inline-flex shrink-0 rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
        >
          Generate invoices
        </Link>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="text-sm text-slate-600">
          Status{" "}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="ml-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          >
            <option value="">All</option>
            {invoiceDropdowns.status.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
      {progress ? <p className="text-sm text-slate-600">{progress}</p> : null}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              {canBatchPrint ? (
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all invoices"
                    disabled={!rows.length || busy}
                  />
                </th>
              ) : null}
              <th className="px-4 py-3">Document</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Plan type</th>
              <th className="px-4 py-3">Invoice to</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Payment</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                {canBatchPrint ? (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(row.id)}
                      onChange={() => toggleOne(row.id)}
                      aria-label={`Select ${row.documentNo}`}
                      disabled={busy}
                    />
                  </td>
                ) : null}
                <td className="px-4 py-3">
                  <Link href={`/invoices/${row.id}`} className="font-medium text-[#b51266] hover:underline">
                    {row.documentNo}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <ClientRecordLink
                    id={row.clientId}
                    searchKey={clients.find((c) => c.id === row.clientId)?.searchKey ?? row.clientId}
                    name={clients.find((c) => c.id === row.clientId)?.name ?? ""}
                  />
                </td>
                <td className="px-4 py-3 text-slate-700">{formatInvoicePeriod(row)}</td>
                <td className="px-4 py-3 text-slate-700">{row.planManagementType}</td>
                <td className="px-4 py-3 text-slate-700">{row.invoiceTo || "—"}</td>
                <td className="px-4 py-3 text-slate-700">${row.totalAmount.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusTone[row.status] ?? ""}`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{row.paymentStatus}</td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={canBatchPrint ? 9 : 8} className="px-4 py-8 text-center text-slate-500">
                  No invoices yet — generate from approved timesheets for plan-managed participants.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {canBatchPrint ? (
        <RecordDocumentsSection
          entityType="invoice"
          entityId="batch"
          error={batchError || undefined}
          message={batchMessage || undefined}
          extras={
            <div className="space-y-2">
              <p className="text-sm text-slate-600">
                Select invoices in the table above, then batch print or save PDFs. {selectedIds.size} selected.
              </p>
              {templateOptions.length > 1 ? (
                <label className="block text-sm">
                  <span className="mb-1 block text-xs font-medium text-slate-600">Template</span>
                  <select
                    className={inputClass}
                    value={activeTemplateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                  >
                    {templateOptions.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : activeTemplate ? (
                <p className="text-xs text-slate-500">Template: {activeTemplate.name}</p>
              ) : null}
            </div>
          }
          actions={[
            {
              processId: DOCUMENT_PRINT_PROCESSES.batchPrintInvoices,
              label: "Batch PDF",
              onClick: () => void handleBatchPrint("pdf"),
              disabled: !selectedIds.size || !activeTemplate,
              busy,
              variant: "primary",
            },
            {
              processId: DOCUMENT_PRINT_PROCESSES.batchPrintInvoices,
              label: "Batch HTML",
              onClick: () => void handleBatchPrint("html"),
              disabled: !selectedIds.size || !activeTemplate,
              busy,
            },
          ]}
        />
      ) : null}
    </div>
  );
}

export function GenerateInvoicesView() {
  const data = useData();
  const { session, canWriteWindow } = useAuth();
  const canGenerate = canWriteWindow("generate-invoices");
  const router = useRouter();
  const defaultWeekStart = weekStartFromDate("2025-10-06");
  const defaultWeekEnd = useMemo(() => {
    const d = new Date(`${defaultWeekStart}T12:00:00`);
    d.setDate(d.getDate() + 6);
    return d.toISOString().slice(0, 10);
  }, [defaultWeekStart]);

  const [periodStart, setPeriodStart] = useState(defaultWeekStart);
  const [periodEnd, setPeriodEnd] = useState(defaultWeekEnd);
  const [message, setMessage] = useState("");
  const [generating, setGenerating] = useState(false);

  const ctx = useMemo(() => buildInvoiceContext(data), [data]);
  const preview = useMemo(
    () => previewInvoiceGeneration(ctx, periodStart, periodEnd),
    [ctx, periodStart, periodEnd]
  );

  const handleGenerate = () => {
    if (!canGenerate) {
      setMessage("You do not have permission to generate invoices.");
      return;
    }
    if (!preview.eligibleLineCount) {
      setMessage(
        "No eligible lines — use plan-managed or self-managed participants with approved, verified timesheets not already billed."
      );
      return;
    }
    setGenerating(true);
    const actor = session?.displayName || "SuperUser";
    const result = generateInvoicesFromTimesheets(ctx, periodStart, periodEnd, actor);
    const all = [...result.created, ...result.updated];
    data.bulkUpsertInvoices(all);
    setGenerating(false);
    const parts = [];
    if (result.created.length) parts.push(`${result.created.length} created`);
    if (result.updated.length) parts.push(`${result.updated.length} updated`);
    setMessage(
      `Generated invoices: ${parts.join(", ") || "none"}.${result.skippedAlreadyBilled ? ` ${result.skippedAlreadyBilled} lines already billed.` : ""}${result.skippedUnverified ? ` ${result.skippedUnverified} lines skipped — not verified.` : ""}${result.skippedLockedInvoice ? ` ${result.skippedLockedInvoice} lines skipped — sent invoice exists for participant.` : ""}${result.skippedAgencyManaged ? ` ${result.skippedAgencyManaged} agency-managed lines skipped — use Generate claims.` : ""}`
    );
    if (result.created.length === 1) {
      router.push(`/invoices/${result.created[0].id}`);
    } else if (all.length) {
      router.push("/invoices");
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Bulk-create draft invoices from approved timesheet lines for plan-managed and self-managed participants. Agency
        managed participants are billed via NDIS claims instead.
      </p>
      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:max-w-xl">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Invoice period start</span>
          <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Invoice period end</span>
          <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className={inputClass} />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Eligible lines</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{preview.eligibleLineCount}</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Already billed</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{preview.alreadyBilledCount}</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Unverified skipped</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{preview.unverifiedSkippedCount}</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Sent invoice skipped</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{preview.lockedInvoiceSkippedCount}</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Agency managed skipped</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{preview.agencyManagedSkippedCount}</p>
        </div>
      </div>
      {preview.rows.length ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Plan type</th>
                <th className="px-4 py-3">Lines</th>
                <th className="px-4 py-3">Est. amount</th>
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((row) => (
                <tr key={row.clientId} className="border-b border-slate-100">
                  <td className="px-4 py-3">{clientLabel(data.clients, row.clientId)}</td>
                  <td className="px-4 py-3">{row.planManagementType}</td>
                  <td className="px-4 py-3">{row.lineCount}</td>
                  <td className="px-4 py-3">${row.totalAmount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={generating || !preview.eligibleLineCount || !canGenerate}
          onClick={handleGenerate}
          className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generating ? "Generating…" : "Generate invoices"}
        </button>
        <Link href="/invoices" className="text-sm font-medium text-[#b51266] hover:underline">
          View invoices
        </Link>
      </div>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}

export function InvoiceDetailView({ id }: { id: string }) {
  const data = useData();
  const { organization } = useOrganization();
  const { session, canWriteWindow, canProcess } = useAuth();
  const { listTemplatesForProcess, resolveTemplate } = useDocumentPlatform();
  const canEdit = canWriteWindow("invoices");
  const canPrint = canProcess(DOCUMENT_PRINT_PROCESSES.printInvoice);
  const canSend = canProcess(DOCUMENT_PRINT_PROCESSES.sendInvoice);
  const stored = data.invoices.find((inv) => inv.id === id);
  const [draft, setDraft] = useState<InvoiceRecord | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [printError, setPrintError] = useState("");
  const [printMessage, setPrintMessage] = useState("");
  const [sendError, setSendError] = useState("");
  const [sendMessage, setSendMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [registryDocumentNo, setRegistryDocumentNo] = useState("");
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [templateId, setTemplateId] = useState("");

  const templateOptions = listTemplatesForProcess(DOCUMENT_PRINT_PROCESSES.printInvoice, "invoice");
  const activeTemplateId = templateId || resolveTemplate(DOCUMENT_PRINT_PROCESSES.printInvoice, "invoice")?.id || templateOptions[0]?.id || "";
  const activeTemplate =
    templateOptions.find((t) => t.id === activeTemplateId) ??
    resolveTemplate(DOCUMENT_PRINT_PROCESSES.printInvoice, "invoice", activeTemplateId) ??
    templateOptions[0] ??
    null;

  const record = draft ?? stored;
  const client = data.clients.find((c) => c.id === record?.clientId);

  if (!record) {
    return (
      <AppShell
        title="Invoice not found"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Invoices", href: "/invoices" },
          { label: "Not found" },
        ]}
        audit={{ moduleLabel: "Invoices" }}
      >
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center">
          <p className="text-sm text-slate-600">Invoice not found.</p>
          <Link href="/invoices" className="mt-3 inline-flex text-sm font-medium text-[#b51266] hover:underline">
            Back to invoices
          </Link>
        </div>
      </AppShell>
    );
  }

  const update = (patch: Partial<InvoiceRecord>) => {
    setSaveError("");
    setDraft((prev) => normalizeInvoice({ ...(prev ?? stored!), ...patch }));
    setDirty(true);
  };

  const handleSave = () => {
    if (!record || !canEdit) return;
    const actor = session?.displayName || "SuperUser";
    const validated = revalidateInvoiceLines(record, data);
    const block = invoiceSaveBlocked(validated);
    if (block) {
      setSaveError(block);
      return;
    }
    data.upsertInvoice({ ...validated, updatedBy: actor });
    setDraft(null);
    setDirty(false);
    setSaveError("");
  };

  const handleDiscard = () => {
    setDraft(null);
    setDirty(false);
  };

  const handleMarkSent = () => {
    if (!record || !canEdit || invoiceRecordIsLocked(stored ?? record)) return;
    const actor = session?.displayName || "SuperUser";
    const validated = revalidateInvoiceLines(record, data);
    const next = normalizeInvoice({
      ...validated,
      status: "Sent",
      sentAt: new Date().toISOString(),
      updatedBy: actor,
    });
    const block = invoiceSaveBlocked(next);
    if (block) {
      setSaveError(block);
      return;
    }
    data.upsertInvoice(next);
    setDraft(null);
    setDirty(false);
    setSaveError("");
  };

  const locked = invoiceRecordIsLocked(stored ?? record);

  const handlePrint = async () => {
    setPrintError("");
    setPrintMessage("");
    if (!activeTemplate) {
      setPrintError("No active invoice template is available.");
      return;
    }
    const ok = printClientInvoice(
      {
        invoice: record,
        client,
        organization,
      },
      activeTemplate
    );
    if (!ok) {
      setPrintError("Could not open the print window. Allow pop-ups for this site and try again.");
      auditDocumentProcess({
        processId: DOCUMENT_PRINT_PROCESSES.printInvoice,
        entityType: "invoice",
        entityId: record.id,
        entityLabel: record.documentNo,
        outcome: "failed",
        failureReason: "Print window blocked",
      });
      return;
    }
    const exported = exportClientInvoiceHtml({ invoice: record, client, organization }, activeTemplate);
    if (exported) {
      try {
        await registerDocumentWithAudit({
          processId: DOCUMENT_PRINT_PROCESSES.printInvoice,
          html: exported.html,
          templateId: exported.templateId,
          documentClass: activeTemplate.documentClass,
          entityType: "invoice",
          entityId: record.id,
          entityLabel: record.documentNo,
          fileName: `${record.documentNo}.html`,
        });
        setPrintMessage("Invoice saved to the document registry.");
        setHistoryRefresh((n) => n + 1);
      } catch (err) {
        setPrintError(err instanceof Error ? err.message : "Could not save to the document registry.");
      }
    }
  };

  const handleDownload = async () => {
    setPrintError("");
    setPrintMessage("");
    if (!activeTemplate) {
      setPrintError("No active invoice template is available.");
      return;
    }
    const exported = exportClientInvoiceHtml({ invoice: record, client, organization }, activeTemplate);
    if (!exported) {
      setPrintError("Could not generate the document. Check invoice fields and organisation profile.");
      return;
    }
    downloadDocumentHtml(exported.html, record.documentNo);
    try {
      await registerDocumentWithAudit({
        processId: DOCUMENT_PRINT_PROCESSES.printInvoice,
        html: exported.html,
        templateId: exported.templateId,
        documentClass: activeTemplate.documentClass,
        entityType: "invoice",
        entityId: record.id,
        entityLabel: record.documentNo,
        fileName: `${record.documentNo}.html`,
      });
      setPrintMessage("Invoice HTML saved to the document registry.");
      setHistoryRefresh((n) => n + 1);
    } catch (err) {
      setPrintError(err instanceof Error ? err.message : "Could not save to the document registry.");
    }
  };

  const handleDownloadPdf = async () => {
    setPrintError("");
    setPrintMessage("");
    if (!activeTemplate) {
      setPrintError("No active invoice template is available.");
      return;
    }
    const exported = exportClientInvoiceHtml({ invoice: record, client, organization }, activeTemplate);
    if (!exported) {
      setPrintError("Could not generate the document. Check invoice fields and organisation profile.");
      return;
    }
    setPdfBusy(true);
    try {
      const registered = await downloadDocumentPdf({
        html: exported.html,
        templateId: exported.templateId,
        documentClass: activeTemplate.documentClass,
        entityType: "invoice",
        entityId: record.id,
        entityLabel: record.documentNo,
        fileName: `${record.documentNo}.pdf`,
      });
      if (registered?.documentNo) setRegistryDocumentNo(registered.documentNo);
      auditDocumentProcess({
        processId: DOCUMENT_PRINT_PROCESSES.printInvoice,
        entityType: "invoice",
        entityId: record.id,
        entityLabel: record.documentNo,
        detail: registered?.documentNo ? `PDF ${registered.documentNo}` : "PDF download",
      });
      setPrintMessage("Invoice PDF saved to the document registry.");
      setHistoryRefresh((n) => n + 1);
    } catch (err) {
      setPrintError(err instanceof Error ? err.message : "PDF generation failed.");
    } finally {
      setPdfBusy(false);
    }
  };

  const handleIssue = async () => {
    setSendError("");
    setSendMessage("");
    if (!activeTemplate) {
      setSendError("No active invoice template is available.");
      return;
    }
    const exported = exportClientInvoiceHtml({ invoice: record, client, organization }, activeTemplate);
    if (!exported) {
      setSendError("Could not generate the document. Check invoice fields and organisation profile.");
      return;
    }
    setSending(true);
    try {
      const orgName = organizationDisplayName(organization);
      const res = await fetch("/api/documents/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: exported.html,
          templateId: exported.templateId,
          documentClass: activeTemplate.documentClass,
          entityId: record.id,
          entityLabel: record.documentNo,
          fileName: `${record.documentNo}.html`,
          pdfFileName: `${record.documentNo}.pdf`,
          recipientEmail: record.invoiceToEmail,
          recipientName: record.invoiceTo,
          emailPlaceholders: {
            orgName,
            recipientName: record.invoiceTo?.trim() || "Plan manager",
            recipientEmail: record.invoiceToEmail?.trim() || "",
            invoiceDocumentNo: record.documentNo,
            documentNo: registryDocumentNo || record.documentNo,
            entityLabel: record.documentNo,
            periodStart: record.periodStart,
            periodEnd: record.periodEnd,
            amount: `$${record.totalAmount.toFixed(2)}`,
          },
        }),
      });
      const payload = (await res.json()) as {
        error?: string;
        message?: string;
        documentNo?: string;
        registryId?: string;
        pdfBase64?: string;
        attachmentFileName?: string;
        mailtoUrl?: string | null;
        subject?: string;
        body?: string;
      };
      if (!res.ok) {
        setSendError(payload.error ?? "Could not issue the invoice.");
        return;
      }
      if (payload.documentNo) setRegistryDocumentNo(payload.documentNo);
      if (payload.pdfBase64 && payload.attachmentFileName) {
        const handoff = await launchEmailWithPdfAttachment({
          pdfBase64: payload.pdfBase64,
          fileName: payload.attachmentFileName,
          mailtoUrl: payload.mailtoUrl ?? null,
          subject: payload.subject ?? "",
          body: payload.body ?? "",
        });
        setSendMessage(`${payload.message ?? "Invoice issued."} ${emailHandoffMessage(handoff)}`);
      } else {
        const registryNote = payload.documentNo ? ` Registry reference ${payload.documentNo}.` : "";
        setSendMessage(`${payload.message ?? "Invoice issued in-system."}${registryNote}`);
      }
      auditDocumentProcess({
        processId: DOCUMENT_PRINT_PROCESSES.sendInvoice,
        entityType: "invoice",
        entityId: record.id,
        entityLabel: record.documentNo,
        detail: payload.documentNo ? `Registry ${payload.documentNo}` : undefined,
      });
      setHistoryRefresh((n) => n + 1);
      if (canEdit && record.status !== "Sent") {
        handleMarkSent();
      }
    } catch {
      setSendError("Could not issue the invoice. Try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <AppShell
        title={record.documentNo}
        subtitle={client ? `${client.searchKey} — ${client.name}` : "Participant invoice"}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Invoices", href: "/invoices" },
          { label: record.documentNo },
        ]}
        audit={{
          entityType: "invoice",
          entityId: record.id,
          meta: auditMetaFrom(stored ?? record),
        }}
      >
        <div className="space-y-6">
          <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Client</span>
              {client ? (
                <ClientRecordLink id={client.id} searchKey={client.searchKey} name={client.name} />
              ) : (
                <span className="text-slate-600">{record.clientId || "—"}</span>
              )}
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Period</span>
              <span className="text-slate-900">{formatInvoicePeriod(record)}</span>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Total amount</span>
              <span className="text-lg font-semibold text-slate-900">${record.totalAmount.toFixed(2)}</span>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Status</span>
              <select
                value={record.status}
                disabled={!canEdit || locked}
                onChange={(e) => update({ status: e.target.value })}
                className={inputClass}
              >
                {invoiceDropdowns.status.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Plan management</span>
              <span className="block text-sm text-slate-900">{record.planManagementType}</span>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Payment status</span>
              <select
                value={record.paymentStatus}
                disabled={!canEdit || locked}
                onChange={(e) => update({ paymentStatus: e.target.value })}
                className={inputClass}
              >
                {invoiceDropdowns.paymentStatus.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm lg:col-span-2">
              <span className="mb-1 block font-medium text-slate-700">Invoice to</span>
              <input
                value={record.invoiceTo}
                disabled={!canEdit || locked}
                onChange={(e) => update({ invoiceTo: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Invoice to email</span>
              <input
                type="email"
                value={record.invoiceToEmail}
                disabled={!canEdit || locked}
                onChange={(e) => update({ invoiceToEmail: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Due date</span>
              <input
                type="date"
                value={record.dueDate}
                disabled={!canEdit || locked}
                onChange={(e) => update({ dueDate: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Paid amount</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={record.paidAmount}
                disabled={!canEdit || locked}
                onChange={(e) => update({ paidAmount: Number.parseFloat(e.target.value) || 0 })}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Payment reference</span>
              <input
                value={record.paymentReference}
                disabled={!canEdit || locked}
                onChange={(e) => update({ paymentReference: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="block text-sm lg:col-span-3">
              <span className="mb-1 block font-medium text-slate-700">Notes</span>
              <textarea
                value={record.notes}
                disabled={!canEdit || locked}
                onChange={(e) => update({ notes: e.target.value })}
                rows={2}
                className={inputClass}
              />
            </label>
          </div>

          {!locked && canEdit ? (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleMarkSent}
                className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
              >
                Mark as sent
              </button>
              {record.sentAt ? (
                <span className="self-center text-sm text-slate-500">Sent {new Date(record.sentAt).toLocaleString()}</span>
              ) : null}
            </div>
          ) : record.sentAt ? (
            <p className="text-sm text-slate-600">Sent {new Date(record.sentAt).toLocaleString()}</p>
          ) : null}

          <ClaimValidationPanel lines={invoiceLinesAsClaimLines(record)} claimStatus={record.status} />

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Invoice lines</h2>
            <div className="mt-4">
              <LineItemTable config={invoiceLineTableConfig} rows={record.lines} onChange={() => {}} readOnly />
            </div>
          </div>

          {saveError ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">{saveError}</p>
          ) : null}

          {canPrint || canSend ? (
            <RecordDocumentsSection
              entityType="invoice"
              entityId={record.id}
              refreshKey={historyRefresh}
              error={printError || sendError || undefined}
              message={printMessage || sendMessage || undefined}
              extras={
                templateOptions.length > 1 ? (
                  <label className="block text-sm">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Template</span>
                    <select
                      className={inputClass}
                      value={activeTemplateId}
                      onChange={(e) => setTemplateId(e.target.value)}
                    >
                      {templateOptions.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : activeTemplate ? (
                  <p className="text-xs text-slate-500">Template: {activeTemplate.name}</p>
                ) : null
              }
              actions={[
                ...(canPrint
                  ? [
                      {
                        processId: DOCUMENT_PRINT_PROCESSES.printInvoice,
                        label: "Print",
                        onClick: () => void handlePrint(),
                      },
                      {
                        processId: DOCUMENT_PRINT_PROCESSES.printInvoice,
                        label: "PDF",
                        onClick: () => void handleDownloadPdf(),
                        busy: pdfBusy,
                      },
                      {
                        processId: DOCUMENT_PRINT_PROCESSES.printInvoice,
                        label: "HTML",
                        onClick: () => void handleDownload(),
                      },
                    ]
                  : []),
                ...(canSend
                  ? [
                      {
                        processId: DOCUMENT_PRINT_PROCESSES.sendInvoice,
                        label: "Issue",
                        onClick: () => void handleIssue(),
                        busy: sending,
                        variant: "primary" as const,
                      },
                    ]
                  : []),
              ]}
            />
          ) : null}
        </div>
      </AppShell>
      <UnsavedChangesBar visible={dirty && canEdit} onSave={handleSave} onDiscard={handleDiscard} />
    </>
  );
}
