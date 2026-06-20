import type { GenericTableConfig } from "@/components/line-item-table";
import { emptyInvoiceLine, type InvoiceLine } from "@/lib/invoice";

export const invoiceLineTableConfig: GenericTableConfig<InvoiceLine> = {
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "serviceDate", label: "Service date", type: "date", className: "w-32" },
    { key: "ndisSupportItem", label: "NDIS item", type: "text", className: "w-36" },
    { key: "supportCategory", label: "Category", type: "text", className: "w-28" },
    { key: "quantity", label: "Qty (hrs)", type: "text", className: "w-20" },
    { key: "unitPrice", label: "Unit price", type: "text", className: "w-24" },
    { key: "lineAmount", label: "Amount", type: "text", className: "w-24" },
    { key: "lineDescription", label: "Description", type: "text" },
    { key: "validationStatus", label: "Validation", type: "text", className: "w-24" },
    { key: "validationMessage", label: "Validation detail", type: "text" },
  ],
  emptyRow: emptyInvoiceLine,
};
