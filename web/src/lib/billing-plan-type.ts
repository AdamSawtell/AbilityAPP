import type { ClientRecord } from "@/lib/client";
import type { ClaimRecord } from "@/lib/claim";
import type { InvoiceRecord } from "@/lib/invoice";

export type PlanManagementType = "Agency managed" | "Plan managed" | "Self managed";

export function planManagementForClient(client: ClientRecord | undefined): PlanManagementType {
  const funding = client?.fundingBody?.trim().toLowerCase() ?? "";
  if (funding.includes("self")) return "Self managed";
  if (funding.includes("plan")) return "Plan managed";
  return "Agency managed";
}

export function isAgencyManagedClient(client: ClientRecord | undefined): boolean {
  return planManagementForClient(client) === "Agency managed";
}

export function isInvoiceManagedClient(client: ClientRecord | undefined): boolean {
  const type = planManagementForClient(client);
  return type === "Plan managed" || type === "Self managed";
}

export function billingLinkedTimesheetLineIds(
  claims: ClaimRecord[],
  invoices: InvoiceRecord[]
): Set<string> {
  const ids = new Set<string>();
  for (const claim of claims) {
    for (const line of claim.lines) {
      if (line.timesheetLineId?.trim()) ids.add(line.timesheetLineId);
    }
  }
  for (const invoice of invoices) {
    for (const line of invoice.lines) {
      if (line.timesheetLineId?.trim()) ids.add(line.timesheetLineId);
    }
  }
  return ids;
}

export function defaultInvoiceRecipient(
  client: ClientRecord | undefined,
  planType: PlanManagementType
): { invoiceTo: string; invoiceToEmail: string } {
  if (!client) return { invoiceTo: "", invoiceToEmail: "" };
  if (planType === "Self managed") {
    return {
      invoiceTo: client.name?.trim() || client.searchKey,
      invoiceToEmail: client.email?.trim() ?? "",
    };
  }
  return {
    invoiceTo: `Plan manager — ${client.name?.trim() || client.searchKey}`,
    invoiceToEmail: client.email?.trim() ?? "",
  };
}
