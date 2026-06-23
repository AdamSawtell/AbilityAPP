/** How-to guide links for print, PDF, and send actions (section anchors). */
const PROCESS_HELP_HREF: Record<string, string> = {
  "print-support-plan": "/help/clients-locations#support-plan-print-send",
  "send-support-plan": "/help/clients-locations#support-plan-print-send",
  "print-consent-schedule": "/help/document-templates#print-from-workspace",
  "print-participant-statement": "/help/document-templates#print-from-workspace",
  "print-enquiry-acknowledgement": "/help/document-templates#print-from-workspace",
  "print-invoice": "/help/document-templates#print-from-workspace",
  "send-invoice": "/help/document-templates#print-from-workspace",
  "batch-print-invoices": "/help/document-templates#print-from-workspace",
  "print-service-agreement": "/help/document-templates#print-from-workspace",
  "print-service-agreement-variation": "/help/document-templates#print-from-workspace",
  "print-incident-notification": "/help/document-templates#print-from-workspace",
  "print-claim-batch": "/help/document-templates#print-from-workspace",
  "print-audit-pack": "/help/document-templates#print-from-workspace",
  "print-board-report": "/help/document-templates#print-from-workspace",
  "print-remittance-cover": "/help/document-templates#print-from-workspace",
  "print-employee-contract": "/help/document-templates#print-from-workspace",
  "print-employee-offer": "/help/document-templates#print-from-workspace",
  "print-employee-separation": "/help/document-templates#print-from-workspace",
};

export function recordDocumentHelpHref(processIds: string[]): string {
  for (const id of processIds) {
    const href = PROCESS_HELP_HREF[id];
    if (href) return href;
  }
  return "/help/document-templates#document-registry";
}

/** Window key required to view entity document history (read access). */
export const ENTITY_DOCUMENT_WINDOW: Record<string, string> = {
  client: "clients",
  enquiry: "enquiries",
  invoice: "invoices",
  "invoice-reconciliation": "invoice-reconciliation",
  "service-agreement": "service-agreements",
  incident: "incidents",
  employee: "employees",
  claim: "claims",
  "audit-pack": "ndis-audit-pack",
  "board-report": "board-reporting",
  "board-report-pack": "board-reporting",
};
