import type { ClientRecord } from "@/lib/client";
import { sumInvoiceLineAmount, type InvoiceRecord } from "@/lib/invoice";

export const INVOICE_RECONCILE_STATUSES = ["Unpaid", "Partial", "Paid", "Overdue", "Draft"] as const;
export type InvoiceReconcileStatus = (typeof INVOICE_RECONCILE_STATUSES)[number];

export type InvoiceReconcileRow = {
  invoiceId: string;
  documentNo: string;
  clientId: string;
  periodStart: string;
  periodEnd: string;
  invoiceStatus: string;
  paymentStatus: string;
  invoicedAmount: number;
  paidAmount: number;
  amountVariance: number;
  dueDate: string;
  sentAt: string;
  paymentReference: string;
  reconcileStatus: InvoiceReconcileStatus;
  reconcileMessage: string;
};

export type InvoiceReconcileDigest = {
  invoiceCount: number;
  unpaidCount: number;
  partialCount: number;
  paidCount: number;
  overdueCount: number;
  draftCount: number;
  totalInvoicedAmount: number;
  totalPaidAmount: number;
  totalOutstandingAmount: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function periodOverlapsMonth(periodStart: string, periodEnd: string, month: string): boolean {
  if (!month?.trim()) return true;
  const startMonth = periodStart?.slice(0, 7) ?? "";
  const endMonth = periodEnd?.slice(0, 7) ?? startMonth;
  if (startMonth === month || endMonth === month) return true;
  if (!startMonth || !endMonth) return false;
  return startMonth <= month && endMonth >= month;
}

function isOverdue(invoice: InvoiceRecord, today = new Date().toISOString().slice(0, 10)): boolean {
  if (invoice.paymentStatus === "Paid" || invoice.status === "Void" || invoice.status === "Draft") return false;
  return Boolean(invoice.dueDate && invoice.dueDate < today && invoice.status === "Sent");
}

export function invoicesEligibleForReconciliation(invoices: InvoiceRecord[]): InvoiceRecord[] {
  return invoices.filter((invoice) => invoice.status === "Sent" || invoice.status === "Paid");
}

export function buildInvoiceReconcileRow(invoice: InvoiceRecord, periodMonth = ""): InvoiceReconcileRow {
  const invoicedAmount = round2(invoice.totalAmount || sumInvoiceLineAmount(invoice.lines));
  const paidAmount = round2(invoice.paidAmount || (invoice.paymentStatus === "Paid" ? invoicedAmount : 0));
  const amountVariance = round2(paidAmount - invoicedAmount);
  const overdue = isOverdue(invoice);

  let reconcileStatus: InvoiceReconcileStatus;
  let reconcileMessage: string;

  if (invoice.status === "Draft") {
    reconcileStatus = "Draft";
    reconcileMessage = "Invoice is still draft — send before reconciliation.";
  } else if (overdue && invoice.paymentStatus !== "Paid") {
    reconcileStatus = "Overdue";
    reconcileMessage = `Payment overdue since ${invoice.dueDate}.`;
  } else if (invoice.paymentStatus === "Paid" || invoice.status === "Paid") {
    reconcileStatus = "Paid";
    reconcileMessage = "Invoice paid in full.";
  } else if (invoice.paymentStatus === "Partial") {
    reconcileStatus = "Partial";
    reconcileMessage = `Partial payment recorded — $${paidAmount.toFixed(2)} of $${invoicedAmount.toFixed(2)}.`;
  } else {
    reconcileStatus = "Unpaid";
    reconcileMessage = invoice.sentAt
      ? "Sent to participant — awaiting payment."
      : "Sent status without sent date — confirm delivery.";
  }

  if (periodMonth && !periodOverlapsMonth(invoice.periodStart, invoice.periodEnd, periodMonth)) {
    return {
      invoiceId: invoice.id,
      documentNo: invoice.documentNo,
      clientId: invoice.clientId,
      periodStart: invoice.periodStart,
      periodEnd: invoice.periodEnd,
      invoiceStatus: invoice.status,
      paymentStatus: invoice.paymentStatus,
      invoicedAmount: 0,
      paidAmount: 0,
      amountVariance: 0,
      dueDate: invoice.dueDate,
      sentAt: invoice.sentAt,
      paymentReference: invoice.paymentReference,
      reconcileStatus,
      reconcileMessage: "Outside selected month filter.",
    };
  }

  return {
    invoiceId: invoice.id,
    documentNo: invoice.documentNo,
    clientId: invoice.clientId,
    periodStart: invoice.periodStart,
    periodEnd: invoice.periodEnd,
    invoiceStatus: invoice.status,
    paymentStatus: invoice.paymentStatus,
    invoicedAmount,
    paidAmount,
    amountVariance,
    dueDate: invoice.dueDate,
    sentAt: invoice.sentAt,
    paymentReference: invoice.paymentReference,
    reconcileStatus,
    reconcileMessage,
  };
}

export function buildInvoiceReconcileRows(
  invoices: InvoiceRecord[],
  periodMonth = ""
): InvoiceReconcileRow[] {
  return invoicesEligibleForReconciliation(invoices)
    .map((invoice) => buildInvoiceReconcileRow(invoice, periodMonth))
    .filter((row) => !periodMonth || row.invoicedAmount > 0 || row.reconcileMessage.includes("Outside"))
    .sort((a, b) => b.periodStart.localeCompare(a.periodStart) || a.documentNo.localeCompare(b.documentNo));
}

export function summarizeInvoiceReconciliation(rows: InvoiceReconcileRow[]): InvoiceReconcileDigest {
  const active = rows.filter((row) => row.invoicedAmount > 0);
  return {
    invoiceCount: active.length,
    unpaidCount: active.filter((row) => row.reconcileStatus === "Unpaid").length,
    partialCount: active.filter((row) => row.reconcileStatus === "Partial").length,
    paidCount: active.filter((row) => row.reconcileStatus === "Paid").length,
    overdueCount: active.filter((row) => row.reconcileStatus === "Overdue").length,
    draftCount: active.filter((row) => row.reconcileStatus === "Draft").length,
    totalInvoicedAmount: round2(active.reduce((sum, row) => sum + row.invoicedAmount, 0)),
    totalPaidAmount: round2(active.reduce((sum, row) => sum + row.paidAmount, 0)),
    totalOutstandingAmount: round2(
      active.reduce((sum, row) => sum + Math.max(0, row.invoicedAmount - row.paidAmount), 0)
    ),
  };
}

export function invoiceReconcileStatusClass(status: InvoiceReconcileStatus): string {
  switch (status) {
    case "Paid":
      return "bg-emerald-100 text-emerald-950";
    case "Partial":
      return "bg-sky-100 text-sky-950";
    case "Overdue":
      return "bg-rose-100 text-rose-950";
    case "Draft":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-amber-100 text-amber-950";
  }
}

export function invoiceReconcileCsv(rows: InvoiceReconcileRow[], clients: ClientRecord[]): string {
  const header =
    "DocumentNo,Client,PeriodStart,PeriodEnd,Status,PaymentStatus,Invoiced,Paid,Variance,DueDate,ReconcileStatus,Message";
  const lines = rows.map((row) => {
    const client = clients.find((c) => c.id === row.clientId);
    const cells = [
      row.documentNo,
      client?.searchKey ?? row.clientId,
      row.periodStart,
      row.periodEnd,
      row.invoiceStatus,
      row.paymentStatus,
      row.invoicedAmount.toFixed(2),
      row.paidAmount.toFixed(2),
      row.amountVariance.toFixed(2),
      row.dueDate,
      row.reconcileStatus,
      row.reconcileMessage,
    ];
    return cells.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",");
  });
  return [header, ...lines].join("\r\n");
}
