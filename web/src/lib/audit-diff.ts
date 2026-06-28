import { auditEntityLabels, type AuditEntityType } from "@/lib/audit";

const AUDIT_IGNORE_KEYS = new Set([
  "id",
  "createdAt",
  "updatedAt",
  "createdBy",
  "updatedBy",
  "createdByUserId",
  "updatedByUserId",
  "audit",
  "updates",
]);

const FIELD_LABELS: Partial<Record<AuditEntityType, Record<string, string>>> = {
  enquiry: {
    documentNo: "Document no.",
    dateReceived: "Date received",
    dateNextAction: "Next action date",
    lossReason: "Loss reason",
    ndisNumber: "NDIS number",
    planStatus: "Plan status",
    planManagementType: "Plan management",
    postcode: "Postcode",
    supportCategories: "Support categories",
    urgency: "Urgency",
    qualificationScore: "Qualification score",
    qualificationTier: "Qualification tier",
    qualificationSummary: "Qualification summary",
    status: "Status",
    firstName: "First name",
    lastName: "Last name",
    fundingBody: "Funding body",
    disability: "Disability",
    services: "Services",
    isEnquiryForSelf: "Enquiry for self",
    thirdPartyConsent: "Third party consent",
    relationshipType: "Relationship",
    phone: "Phone",
    email: "Email",
    birthday: "Birthday",
    gender: "Gender",
    preferredCommunicationMethod: "Preferred communication",
    bpName: "Business partner name",
    enquirySource: "Enquiry source",
    description: "Description",
    outcome: "Outcome",
    additionalDisabilityInformation: "Additional disability information",
    other: "Other",
    externalCrmProvider: "CRM provider",
    externalCrmId: "CRM contact id",
    externalCrmSyncedAt: "CRM last synced",
    activity: "Activity",
  },
  client: {
    searchKey: "Search key",
    name: "Name",
    status: "Status",
    lifecycleStatus: "Lifecycle",
    planReviewDueDate: "Plan review due",
    lifecycleExitReason: "Exit reason",
    planBudgets: "Plan budget lines",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    phone: "Phone",
    pictureUrl: "Photo",
    disability: "Disability",
    services: "Services",
    fundingBody: "Funding body",
    preferredCommunicationMethod: "Preferred communication",
    planManagementType: "Plan management",
    planManagerPartnerId: "Plan manager",
    invoiceDeliveryMethod: "Invoice delivery",
    statementDeliveryMethod: "Statement delivery",
    bpAssociations: "BP associations",
    alerts: "Alerts",
    activity: "Activity",
    locations: "Locations",
  },
  employee: {
    searchKey: "Search key",
    name: "Name",
    status: "Status",
    email: "Email",
    phone: "Phone",
    pictureUrl: "Photo",
    jobTitle: "Job title",
    department: "Department",
    contractedHoursPerPeriod: "Contracted hours per period",
    contractedHoursPeriod: "Contracted hours period",
    schadsClassificationLevel: "SCHADS classification level",
    schadsPayPoint: "SCHADS pay point",
    superRate: "Superannuation rate (%)",
  },
  location: {
    searchKey: "Search key",
    name: "Name",
    locationType: "Location type",
    status: "Status",
    address1: "Address line 1",
    city: "City",
    latitude: "Latitude",
    longitude: "Longitude",
    geofenceRadiusM: "Geofence radius (m)",
    accessNotes: "Access notes",
    highDemandAdvisory: "High demand advisory (My Workplace)",
    alerts: "Alerts",
    activities: "Activities",
  },
  "fleet-vehicle": {
    searchKey: "Search key",
    name: "Name",
    make: "Make",
    model: "Model",
    year: "Year",
    vin: "VIN",
    registrationNumber: "Registration number",
    regoExpiry: "Registration expiry",
    insurancePolicy: "Insurance policy",
    insuranceExpiry: "Insurance expiry",
    locationId: "Assigned location",
    assignedDriverId: "Assigned driver",
    status: "Status",
    odometerReading: "Odometer reading",
    nextServiceDue: "Next service due",
    lastServiceDate: "Last service date",
    serviceRecords: "Service records",
    inspections: "Pre-start inspections",
    fuelLogs: "Fuel and mileage logs",
  },
  contract: {
    documentNo: "Document no.",
    name: "Name",
    contractType: "Contract type",
    startDate: "Start date",
    endDate: "End date",
    audit: "Audit lines",
  },
  "business-partner": {
    searchKey: "Search key",
    name: "Name",
    partnerType: "Partner type",
    status: "Status",
    email: "Email",
    phone: "Phone",
    preferredCommunicationMethod: "Preferred communication",
    invoiceDeliveryMethod: "Invoice delivery",
    statementDeliveryMethod: "Statement delivery",
    paymentTerms: "Payment terms",
    remittanceEmail: "Remittance email",
    agencyHourlyRate: "Agency hourly rate",
    abn: "ABN",
    notes: "Notes",
  },
  product: {
    searchKey: "Search key",
    name: "Name",
    productCategory: "Category",
    ndisSupportItem: "NDIS support item",
    priceType: "Price type",
    endDatedAt: "End-dated at",
    active: "Active",
  },
  "price-list": {
    name: "Name",
    schemaName: "Schema",
    validFrom: "Valid from",
    validTo: "Valid to",
    guideYear: "Guide year",
    status: "Status",
    sourceImportBatchId: "Source import batch",
  },
  "ndis-price-import-batch": {
    sourceFileName: "Source file",
    sourceDocument: "Source document",
    guideYear: "Guide year",
    formatType: "Format",
    status: "Status",
    rowCount: "Rows",
    addCount: "New items",
    updateCount: "Updated items",
    errorCount: "Errors",
  },
  "price-update-run": {
    sourceImportBatchId: "Import batch",
    status: "Status",
    effectiveStart: "Effective start",
    guideYear: "Guide year",
    impactCount: "Impacts",
    safeCount: "Safe updates",
    reviewCount: "Review required",
    consentCount: "Consent required",
    appliedCount: "Applied",
  },
  "service-agreement": {
    searchKey: "Search key",
    name: "Name",
    status: "Status",
    term: "Term",
    contractDate: "Contract date",
    finishDate: "Finish date",
    totalPlannedAmount: "Total planned amount",
    sentAt: "Sent date",
    signedAt: "Signed date",
    activatedAt: "Activated date",
    signerName: "Signer name",
    signerRole: "Signer role",
    signatureCapturedAt: "Signature captured at",
    lines: "Schedule of supports lines",
  },
  "service-booking": {
    documentNo: "Document no.",
    description: "Description",
    targetDocumentType: "Target document type",
    readyToClaimRule: "Ready to claim rule",
    dateOrdered: "Date ordered",
    datePromised: "Date promised",
    startDate: "Start date",
    endDate: "End date",
    clientId: "Business partner",
    invoicePartner: "Invoice partner",
    bookingGeneratorRef: "Booking generator",
    documentStatus: "Document status",
    grandTotal: "Grand total",
    cancellationNoticeDays: "Cancellation notice (days)",
    cancelledAt: "Cancellation date",
    cancellationInitiatedBy: "Cancellation initiated by",
    cancellationReason: "Cancellation reason",
    cancellationNotes: "Cancellation notes",
    lines: "Service booking lines",
  },
  "roster-shift": {
    shiftRef: "Shift ref",
    clientId: "Client",
    employeeId: "Worker",
    locationId: "Location",
    serviceBookingId: "Service booking",
    shiftDate: "Shift date",
    startTime: "Start time",
    endTime: "End time",
    shiftType: "Shift type",
    status: "Status",
    notes: "Notes",
    recurrenceGroupId: "Recurrence group",
    checkedInAt: "Checked in at",
    checkedOutAt: "Checked out at",
    checkInNotes: "Check-in notes",
    checkInLatitude: "Check-in latitude",
    checkInLongitude: "Check-in longitude",
    checkOutLatitude: "Check-out latitude",
    checkOutLongitude: "Check-out longitude",
    coverageSource: "Coverage source",
    agencyWorkerId: "Agency worker",
    vendorBpId: "Agency vendor",
    agencyRequestId: "Agency request",
    trainingSessionGroupId: "Training session group",
    sessionTitle: "Session title",
    sessionCategory: "Session category",
    costAllocation: "Cost allocation",
    costCentre: "Cost centre",
    estimatedHourlyCost: "Estimated hourly cost",
    attendanceStatus: "Attendance status",
    attendanceSignedOffAt: "Attendance signed off at",
    attendanceSignedOffBy: "Attendance signed off by",
    shiftPurpose: "Shift purpose",
    billingClassification: "Billing classification",
    payStatus: "Pay status",
    primaryRosterShiftId: "Primary shift",
    buddyReason: "Buddy reason",
  },
  "agency-worker": {
    searchKey: "Search key",
    vendorBpId: "Works for (vendor)",
    firstName: "First name",
    lastName: "Last name",
    name: "Name",
    email: "Email",
    phone: "Phone",
    qualifications: "Qualifications",
    skills: "Skills",
    toolsNotes: "Tools and transport",
    active: "Active",
    notes: "Notes",
  },
  "agency-shift-request": {
    documentNo: "Document no.",
    rosterShiftId: "Roster shift",
    vendorBpId: "Agency vendor",
    agencyWorkerId: "Agency worker",
    status: "Status",
    skillsRequired: "Skills required",
    clientAdvisedAt: "Client advised at",
    sentAt: "Sent at",
    confirmedAt: "Confirmed at",
    completedAt: "Completed at",
    continuityNotes: "Continuity notes",
    vendorInvoiceRef: "Vendor invoice ref",
    vendorInvoiceStatus: "Vendor invoice status",
    notes: "Notes",
  },
  "site-orientation": {
    workerType: "Worker type",
    workerId: "Worker",
    locationId: "Location",
    orientedAt: "Oriented at",
    expiresAt: "Expires at",
    acknowledgedBy: "Acknowledged by",
    notes: "Notes",
  },
  "agency-timesheet": {
    documentNo: "Document no.",
    vendorBpId: "Agency vendor",
    periodStart: "Period start",
    periodEnd: "Period end",
    status: "Status",
    totalHours: "Total hours",
    totalVendorCost: "Total vendor cost",
    notes: "Notes",
    lines: "Shift lines",
  },
  "vendor-invoice": {
    documentNo: "Document no.",
    vendorBpId: "Agency vendor",
    agencyTimesheetId: "Agency timesheet",
    invoiceNo: "Invoice no.",
    invoiceDate: "Invoice date",
    amount: "Amount",
    status: "Status",
    notes: "Notes",
    documentFileName: "Invoice document",
  },
  "roster-of-care": {
    name: "Name",
    clientId: "Client",
    serviceAgreementId: "Service agreement",
    status: "Status",
    source: "Source",
    validFrom: "Valid from",
    validTo: "Valid to",
    lines: "Weekly lines",
  },
  "monthly-service-plan": {
    clientId: "Client",
    planMonth: "Plan month",
    status: "Status",
    notes: "Notes",
    lines: "Plan lines",
  },
  timesheet: {
    documentNo: "Document no.",
    employeeId: "Worker",
    periodStart: "Period start",
    periodEnd: "Period end",
    status: "Status",
    totalHours: "Total hours",
    notes: "Notes",
    payrollExportStatus: "Payroll export status",
    payrollExportedAt: "Payroll exported at",
    payrollExportBatchRef: "Payroll export batch ref",
    payrollPaidHours: "Payroll paid hours",
    payrollPayRunRef: "Payroll pay run ref",
    payrollReconcileStatus: "Payroll reconcile status",
    payrollReconciledAt: "Payroll reconciled at",
    lines: "Timesheet lines",
  },
  claim: {
    documentNo: "Document no.",
    clientId: "Client",
    periodStart: "Period start",
    periodEnd: "Period end",
    status: "Status",
    planManagementType: "Plan management",
    totalAmount: "Total amount",
    gatewayStatus: "Gateway status",
    gatewayRef: "Gateway ref",
    remittanceStatus: "Remittance status",
    remittancePaidAmount: "Remittance paid amount",
    remittancePaymentRef: "Remittance payment ref",
    remittanceImportedAt: "Remittance imported at",
    notes: "Notes",
    lines: "Claim lines",
  },
  "claim-remittance": {
    documentNo: "Document no.",
    sourceFilename: "Source file",
    paymentReference: "Payment reference",
    remittanceDate: "Remittance date",
    totalPaid: "Total paid",
    matchedCount: "Matched lines",
    unmatchedCount: "Unmatched lines",
    varianceCount: "Variance lines",
    lines: "Remittance lines",
  },
  invoice: {
    documentNo: "Document no.",
    clientId: "Client",
    periodStart: "Period start",
    periodEnd: "Period end",
    status: "Status",
    planManagementType: "Plan management",
    totalAmount: "Total amount",
    invoiceTo: "Invoice to",
    invoiceToEmail: "Invoice to email",
    dueDate: "Due date",
    sentAt: "Sent at",
    paymentStatus: "Payment status",
    paidAmount: "Paid amount",
    paymentReference: "Payment reference",
    notes: "Notes",
    lines: "Invoice lines",
  },
  "board-report-pack": {
    title: "Title",
    reportPeriod: "Reporting period",
    status: "Status",
    templateId: "Template",
    sections: "Report sections",
    executiveSummary: "Executive summary",
    ceoCommentary: "CEO commentary",
    keyDecisionsRequired: "Key decisions required",
    operationalIssues: "Operational issues",
    publishedAt: "Published at",
  },
  "document-template": {
    name: "Name",
    documentClass: "Document class",
    active: "Active",
    isDefault: "Default template",
    titleText: "Title text",
    footerText: "Footer text",
  },
  "generated-document": {
    documentNo: "Document number",
    templateId: "Template",
    entityType: "Entity type",
    entityId: "Entity",
    status: "Status",
  },
  "admin-message": {
    title: "Title",
    body: "Body",
    audienceType: "Audience type",
    audienceRoleIds: "Audience roles",
    requiresAcknowledgment: "Requires acknowledgment",
    displayMethod: "Display method",
    publishAt: "Publish at",
    expiresAt: "Expires at",
    status: "Status",
    closedAt: "Closed at",
    closedBy: "Closed by",
  },
  task: {
    title: "Title",
    status: "Status",
    priority: "Priority",
    description: "Description",
  },
  organization: {
    tradingName: "Trading name",
    legalName: "Legal name",
    searchKey: "Short code",
    abn: "ABN",
    ndisRegistrationNumber: "NDIS registration number",
    ndisProviderOutcomeId: "NDIS provider outcome ID",
    email: "General email",
    phone: "General phone",
    website: "Website",
    logoUrl: "Logo URL",
    registrationGroups: "Registration groups",
    primaryContactName: "Primary contact",
    primaryContactEmail: "Primary contact email",
    primaryContactPhone: "Primary contact phone",
    address1: "Address line 1",
    city: "City",
    state: "State",
    postcode: "Postcode",
    incidentInvestigationSlaDays: "Investigation SLA (days)",
    bankBsb: "Bank BSB",
    bankAccount: "Bank account",
    bankAccountName: "Bank account name",
    remittanceEmail: "Remittance email",
    documentFooterText: "Document footer",
    gstRegistered: "GST registered",
    buddyShiftPayPolicy: "Buddy shift pay policy",
    themePrimaryColour: "Theme primary colour",
    themeAccentColour: "Theme accent colour",
    themeBackgroundColour: "Theme background colour",
    themeTextColour: "Theme text colour",
  },
  incident: {
    documentNo: "Document no.",
    title: "Title",
    status: "Status",
    severity: "Severity",
    category: "Category",
    serviceType: "Service type",
    isReportable: "NDIS reportable",
    reportableType: "Reportable type",
    restrictivePracticeCausedHarm: "Restrictive practice caused harm",
    occurredAt: "Occurred at",
    awareAt: "Aware at",
    reportedAt: "Reported date",
    reportDeadlineAt: "Report deadline",
    ndisNotifiedAt: "NDIS notified at",
    ndisNotificationRef: "NDIS notification reference",
    primaryClientId: "Primary client",
    primaryEmployeeId: "Primary employee",
    primaryLocationId: "Primary location",
    linkedRestrictivePracticeId: "Linked restrictive practice",
    managerReviewedAt: "Manager reviewed at",
    managerReviewedBy: "Manager reviewed by",
    description: "Description",
    immediateActions: "Immediate actions",
    investigationSummary: "Investigation summary",
    correctiveActions: "Corrective actions",
    lessonsLearned: "Lessons learned",
    parties: "Parties",
    actions: "Actions",
    notifications: "Notifications",
    evidence: "Evidence",
  },
};

function humanizeFieldKey(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatAuditValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "(empty)";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    const count = value.length;
    return `${count} line${count === 1 ? "" : "s"}`;
  }
  const text = String(value).replace(/\s+/g, " ").trim();
  return text.length > 72 ? `${text.slice(0, 69)}…` : text;
}

function recordsEqual(before: unknown, after: unknown) {
  return JSON.stringify(before) === JSON.stringify(after);
}

export function diffRecordChanges(
  entityType: AuditEntityType,
  before: Record<string, unknown>,
  after: Record<string, unknown>
): string[] {
  const labels = FIELD_LABELS[entityType] ?? {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const lines: string[] = [];

  for (const key of keys) {
    if (AUDIT_IGNORE_KEYS.has(key)) continue;
    const prev = before[key];
    const next = after[key];
    if (recordsEqual(prev, next)) continue;

    const label = labels[key] ?? humanizeFieldKey(key);

    if (Array.isArray(prev) || Array.isArray(next)) {
      const prevLen = Array.isArray(prev) ? prev.length : 0;
      const nextLen = Array.isArray(next) ? next.length : 0;
      if (prevLen !== nextLen) {
        lines.push(`${label}: ${prevLen} lines → ${nextLen} lines`);
      } else {
        lines.push(`${label}: content changed`);
      }
      continue;
    }

    lines.push(`${label}: ${formatAuditValue(prev)} → ${formatAuditValue(next)}`);
  }

  return lines;
}

export function formatChangeDetail(
  entityType: AuditEntityType,
  before: Record<string, unknown> | undefined,
  after: Record<string, unknown>,
  maxLines = 15
): string {
  if (!before) return "";
  const lines = diffRecordChanges(entityType, before, after);
  if (!lines.length) return "";
  if (lines.length <= maxLines) return lines.join("\n");
  const shown = lines.slice(0, maxLines);
  return `${shown.join("\n")}\n+ ${lines.length - maxLines} more changes`;
}

export function recordDisplayName(entityType: AuditEntityType, record: Record<string, unknown>): string {
  if (entityType === "enquiry" || entityType === "contract") {
    const doc = record.documentNo;
    if (typeof doc === "string" && doc.trim()) return doc;
  }
  if (entityType === "client" || entityType === "employee" || entityType === "location" || entityType === "service-agreement" || entityType === "product") {
    const key = record.searchKey;
    if (typeof key === "string" && key.trim()) return key;
  }
  if (entityType === "product" || entityType === "price-list") {
    const name = record.name;
    if (typeof name === "string" && name.trim()) return name;
  }
  if (entityType === "task") {
    const title = record.title;
    if (typeof title === "string" && title.trim()) return title;
  }
  if (entityType === "organization") {
    const trading = record.tradingName;
    if (typeof trading === "string" && trading.trim()) return trading;
  }
  const id = record.id;
  return typeof id === "string" && id.trim() ? id : auditEntityLabels[entityType];
}

export function buildChangeSummary(
  entityType: AuditEntityType,
  before: Record<string, unknown> | undefined,
  after: Record<string, unknown>,
  isCreate: boolean
): string {
  const entityLabel = auditEntityLabels[entityType];
  const name = recordDisplayName(entityType, after);

  if (isCreate) return `${entityLabel} ${name} created`;

  const changes = before ? diffRecordChanges(entityType, before, after) : [];
  if (!changes.length) return `${entityLabel} ${name} updated`;

  const statusChange = changes.find((line) => line.startsWith("Status:"));
  if (statusChange) {
    const detail = statusChange.replace("Status: ", "");
    return `${entityLabel} ${name} — status ${detail}`;
  }

  if (changes.length === 1) {
    const field = changes[0].split(":")[0];
    return `${entityLabel} ${name} — ${field} changed`;
  }

  return `${entityLabel} ${name} updated (${changes.length} changes)`;
}
