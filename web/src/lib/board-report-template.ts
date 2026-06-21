/** Default NDIS board report template — mirrors seeded `brt-ndis-default`. */

export type BoardReportTemplateSectionDef = {
  id: string;
  sectionCode: string;
  label: string;
  description: string;
  defaultIncluded: boolean;
  sortOrder: number;
};

export type BoardReportTemplateRecord = {
  id: string;
  name: string;
  description: string;
  active: boolean;
  isDefault: boolean;
  sections: BoardReportTemplateSectionDef[];
  createdBy: string;
  updatedBy: string;
};

export const DEFAULT_BOARD_REPORT_TEMPLATE_ID = "brt-ndis-default";

export const DEFAULT_BOARD_TEMPLATE_SECTIONS: BoardReportTemplateSectionDef[] = [
  { id: "brts-exec-summary", sectionCode: "executive-summary", label: "Executive Summary", description: "High-level performance overview for the board.", defaultIncluded: true, sortOrder: 1 },
  { id: "brts-org-performance", sectionCode: "organisational-performance", label: "Organisational Performance", description: "Service volume, growth, and operational KPIs.", defaultIncluded: true, sortOrder: 2 },
  { id: "brts-participant-overview", sectionCode: "participant-overview", label: "Participant / Client Overview", description: "Active participants, intake, and exits.", defaultIncluded: true, sortOrder: 3 },
  { id: "brts-ndis-revenue", sectionCode: "ndis-revenue-claims", label: "NDIS Revenue and Claims", description: "Claims submitted, remittance, and billing.", defaultIncluded: true, sortOrder: 4 },
  { id: "brts-service-delivery", sectionCode: "service-delivery", label: "Service Delivery Performance", description: "Bookings, timesheets, and delivery against plan.", defaultIncluded: true, sortOrder: 5 },
  { id: "brts-rostering-workforce", sectionCode: "rostering-workforce", label: "Rostering and Workforce Metrics", description: "Shifts, coverage, leave, and credentials.", defaultIncluded: true, sortOrder: 6 },
  { id: "brts-incidents-risk", sectionCode: "incidents-risk", label: "Incidents and Risk", description: "Incident trends, NDIS reportable events, and open investigations.", defaultIncluded: true, sortOrder: 7 },
  { id: "brts-complaints-feedback", sectionCode: "complaints-feedback", label: "Complaints and Feedback", description: "Complaints register and participant feedback summary.", defaultIncluded: true, sortOrder: 8 },
  { id: "brts-restrictive-practices", sectionCode: "restrictive-practices", label: "Restrictive Practices", description: "Authorised restrictive practices and alerts.", defaultIncluded: true, sortOrder: 9 },
  { id: "brts-compliance-quality", sectionCode: "compliance-quality", label: "Compliance and Quality Indicators", description: "NDIS compliance, audit readiness, and quality metrics.", defaultIncluded: true, sortOrder: 10 },
  { id: "brts-plan-utilisation", sectionCode: "plan-utilisation", label: "Plan Utilisation", description: "Plan budget utilisation and variance.", defaultIncluded: true, sortOrder: 11 },
  { id: "brts-financial-summary", sectionCode: "financial-summary", label: "Financial Summary", description: "Month-end close, invoices, and payroll reconciliation.", defaultIncluded: true, sortOrder: 12 },
  { id: "brts-operational-issues", sectionCode: "operational-issues", label: "Operational Issues", description: "Current operational issues requiring board awareness.", defaultIncluded: true, sortOrder: 13 },
  { id: "brts-strategic-projects", sectionCode: "strategic-projects", label: "Strategic Projects", description: "Major projects and transformation initiatives.", defaultIncluded: true, sortOrder: 14 },
  { id: "brts-ceo-commentary", sectionCode: "ceo-commentary", label: "CEO Commentary", description: "Chief executive narrative and context.", defaultIncluded: true, sortOrder: 15 },
  { id: "brts-key-decisions", sectionCode: "key-decisions", label: "Key Decisions Required", description: "Decisions requiring board resolution.", defaultIncluded: true, sortOrder: 16 },
  { id: "brts-appendices", sectionCode: "appendices", label: "Appendices", description: "Supporting tables and reference material.", defaultIncluded: false, sortOrder: 17 },
];

export function defaultBoardReportTemplate(): BoardReportTemplateRecord {
  return {
    id: DEFAULT_BOARD_REPORT_TEMPLATE_ID,
    name: "NDIS Board Report Pack",
    description: "Standard monthly board report pack for Australian NDIS disability service providers.",
    active: true,
    isDefault: true,
    sections: DEFAULT_BOARD_TEMPLATE_SECTIONS,
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
  };
}

export function templateSectionByCode(
  template: BoardReportTemplateRecord,
  sectionCode: string
): BoardReportTemplateSectionDef | undefined {
  return template.sections.find((s) => s.sectionCode === sectionCode);
}
