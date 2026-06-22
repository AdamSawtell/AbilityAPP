/**
 * Smoke test: all document platform render paths produce HTML without blocking errors.
 * Run: npx tsx scripts/document-render-smoke.mjs
 */
import {
  defaultAgreementTemplate,
  defaultAuditPackTemplate,
  defaultBoardReportTemplate,
  defaultClaimBatchTemplate,
  defaultConsentScheduleTemplate,
  defaultEnquiryAckTemplate,
  defaultHrContractCasualTemplate,
  defaultHrOfferTemplate,
  defaultHrSeparationTemplate,
  defaultIncidentNotificationTemplate,
  defaultInvoiceTemplate,
  defaultParticipantStatementTemplate,
  defaultRemittanceCoverTemplate,
} from "../src/lib/document-template.ts";
import { renderDocument } from "../src/lib/document-render.ts";
import { defaultOrganization } from "../src/lib/organization.ts";
import { initialInvoices } from "../src/lib/invoice.ts";
import { initialRecords as seedEnquiries } from "../src/lib/enquiry.ts";
import { initialServiceAgreements } from "../src/lib/service-agreement.ts";
import { initialClients as seedClients } from "../src/lib/client.ts";
import { buildInvoiceReconcileRows } from "../src/lib/invoice-reconciliation.ts";
import { createBoardReportPack } from "../src/lib/board-report-pack.ts";
import { evaluateAuditPack } from "../src/lib/ndis-audit-pack.ts";

const org = { ...defaultOrganization(), abn: "12 345 678 901" };
const client = seedClients[0];
const invoice = {
  id: "inv-smoke",
  documentNo: "INV-70001",
  clientId: client?.id ?? "",
  status: "Draft",
  paymentStatus: "Unpaid",
  invoiceTo: client?.name ?? "Test Client",
  invoiceToEmail: client?.email ?? "",
  periodStart: "2026-06-01",
  periodEnd: "2026-06-30",
  sentAt: "",
  lines: [
    {
      id: "inl-1",
      lineNo: 10,
      ndisSupportItem: "01_011_0107_1_1",
      serviceDate: "2026-06-15",
      description: "Support",
      quantity: 2,
      unitPrice: 65,
      lineAmount: 130,
      gstAmount: 0,
    },
  ],
  totalAmount: 130,
  gstAmount: 0,
  notes: "",
  createdBy: "SuperUser",
  updatedBy: "SuperUser",
};
const agreement = initialServiceAgreements[0];
const enquiry = seedEnquiries[0];
const employee = {
  id: "emp-smoke",
  searchKey: "SMOKE_Employee",
  name: "Smoke Test",
  firstName: "Smoke",
  lastName: "Test",
  email: "smoke@test.local",
  employeeNumber: "E999",
  jobTitle: "Support Worker",
  employmentType: "Casual",
  department: "Operations",
  startDate: "2026-07-01",
  standardHoursPerWeek: "38",
  documents: [],
  locations: [],
  activity: [],
  alerts: [],
  credentials: [],
  leaveEntitlements: [],
  leaveRequests: [],
  createdBy: "SuperUser",
  updatedBy: "SuperUser",
};
const pack = createBoardReportPack({
  title: "Smoke board pack",
  reportPeriod: "2026-06",
  createdBy: "SuperUser",
  updatedBy: "SuperUser",
});
const claim = {
  id: "clm-smoke",
  documentNo: "CLM-SMOKE-01",
  clientId: client?.id ?? "",
  periodStart: "2026-06-01",
  periodEnd: "2026-06-30",
  status: "Draft",
  planManagementType: "Plan managed",
  totalAmount: 130,
  gatewayStatus: "Not submitted",
  gatewayRef: "",
  remittanceStatus: "Not imported",
  remittancePaidAmount: 0,
  remittancePaymentRef: "",
  remittanceImportedAt: "",
  notes: "",
  lines: [
    {
      id: "cll-1",
      lineNo: 1,
      timesheetId: "",
      timesheetLineId: "",
      rosterShiftId: "",
      clientId: client?.id ?? "",
      employeeId: "",
      serviceBookingId: "",
      productId: "",
      ndisSupportItem: "01_011_0107_1_1",
      supportCategory: "Core",
      serviceDate: "2026-06-15",
      quantity: 2,
      unitPrice: 65,
      lineAmount: 130,
      claimType: "Standard",
      validationStatus: "pass",
      validationMessage: "",
    },
  ],
  createdBy: "SuperUser",
  updatedBy: "SuperUser",
};
const incident = {
  id: "inc-smoke",
  documentNo: "INC-SMOKE-01",
  title: "Smoke incident",
  status: "Submitted",
  severity: "Medium",
  category: "Behaviour",
  serviceType: "SIL",
  isReportable: true,
  reportableType: "Serious injury",
  restrictivePracticeCausedHarm: false,
  occurredAt: "2026-06-15T10:00:00",
  awareAt: "2026-06-15T10:30:00",
  reportedAt: "2026-06-15T11:00:00",
  reportDeadlineAt: "2026-06-16T10:30:00",
  ndisNotifiedAt: "",
  ndisNotificationRef: "",
  primaryClientId: client?.id ?? "",
  primaryEmployeeId: "",
  primaryLocationId: "",
  linkedRestrictivePracticeId: "",
  managerReviewedAt: "",
  managerReviewedBy: "",
  description: "Smoke test incident description.",
  immediateActions: "First aid applied.",
  investigationSummary: "",
  correctiveActions: "",
  lessonsLearned: "",
  createdBy: "SuperUser",
  updatedBy: "SuperUser",
  parties: [],
  actions: [],
  notifications: [
    {
      id: "not-1",
      lineNo: 1,
      notifiedAt: "2026-06-15",
      notifyTarget: "Participant nominee",
      method: "Phone",
      notifiedBy: "SuperUser",
      reference: "REF-1",
      notes: "",
    },
  ],
  evidence: [],
};
const auditEvaluation = evaluateAuditPack(
  {
    clients: seedClients,
    employees: [],
    serviceAgreements: initialServiceAgreements,
    incidents: [incident],
    monthlyServicePlans: [],
    timesheets: [],
    rosterShifts: [],
    locations: [],
    claims: [claim],
    invoices: [invoice],
    payrollClosedPeriods: [],
    financialClosedMonths: [],
  },
  "2026-06"
);

const cases = [
  {
    name: "tax-invoice",
    template: defaultInvoiceTemplate(),
    ctx: { invoice, client, organization: org },
  },
  {
    name: "service-agreement",
    template: defaultAgreementTemplate(),
    ctx: { agreement, client, organization: org },
  },
  {
    name: "hr-contract",
    template: defaultHrContractCasualTemplate(),
    ctx: { employee, managerName: "Manager", organization: org },
  },
  {
    name: "hr-letter-offer",
    template: defaultHrOfferTemplate(),
    ctx: { employee, managerName: "Manager", organization: org },
  },
  {
    name: "enquiry-letter",
    template: defaultEnquiryAckTemplate(),
    ctx: { enquiry, organization: org },
  },
  {
    name: "remittance-cover",
    template: defaultRemittanceCoverTemplate(),
    ctx: {
      rows: buildInvoiceReconcileRows([invoice], "2026-06"),
      periodLabel: "2026-06",
      organization: org,
    },
  },
  {
    name: "participant-statement",
    template: defaultParticipantStatementTemplate(),
    ctx: { client: client ?? { name: "Test" }, invoices: [invoice], periodLabel: "2026-06", organization: org },
  },
  {
    name: "board-report",
    template: defaultBoardReportTemplate(),
    ctx: { pack, organization: org },
  },
  {
    name: "claim-batch-summary",
    template: defaultClaimBatchTemplate(),
    ctx: { claim, client, organization: org },
  },
  {
    name: "incident-notification-letter",
    template: defaultIncidentNotificationTemplate(),
    ctx: { incident, client, organization: org },
  },
  {
    name: "audit-pack-report",
    template: defaultAuditPackTemplate(),
    ctx: { evaluation: auditEvaluation, organization: org },
  },
  {
    name: "consent-schedule",
    template: defaultConsentScheduleTemplate(),
    ctx: { client: client ?? { name: "Test", consents: [] }, organization: org },
  },
  {
    name: "hr-letter-separation",
    template: defaultHrSeparationTemplate(),
    ctx: { employee: { ...employee, endDate: "2026-07-31" }, managerName: "Manager", organization: org },
  },
];

let failed = 0;
for (const test of cases) {
  const result = renderDocument(test.template, test.ctx, { skipValidation: false });
  const ok = !result.blocked && result.html.includes("<html");
  console.log(`${ok ? "PASS" : "FAIL"} ${test.name}${result.blocked ? ` — ${result.blocked}` : ""}`);
  if (!ok) failed += 1;
}

if (failed) {
  process.exit(1);
}
console.log(`document-render-smoke: ${cases.length}/${cases.length} passed`);
