import type { ClientRecord } from "@/lib/client";
import { escapeDocumentHtml, wrapDocumentHtml } from "@/lib/document-brand";
import { formatContractDate } from "@/lib/contract";
import type { DocumentTemplateRecord } from "@/lib/document-template";
import type { OrganizationRecord } from "@/lib/organization";
import type { RosterShiftRecord } from "@/lib/roster-shift";
import type { ServiceBookingRecord } from "@/lib/service-booking";
import type { PlanAssessmentDocument, SupportPlanRecord } from "@/lib/support-plan";

export type SupportPlanDocumentContext = {
  client: ClientRecord;
  plan: SupportPlanRecord;
  organization: OrganizationRecord;
  serviceBookings: ServiceBookingRecord[];
  rosterShifts: RosterShiftRecord[];
  planDocuments: PlanAssessmentDocument[];
  resolvePartnerName?: (partnerId: string) => string | undefined;
  resolveEmployeeName?: (employeeId: string) => string | undefined;
};

function supportPlanPrintStyles(): string {
  return `
  .panel { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; background: #f8fafc; margin-bottom: 16px; }
  .section { margin-bottom: 28px; page-break-inside: avoid; }
  .section h3 {
    margin: 0 0 10px;
    font-size: 14px;
    font-weight: 700;
    color: #be185d;
    border-bottom: 1px solid #fbcfe8;
    padding-bottom: 6px;
  }
  .section h4 { margin: 14px 0 8px; font-size: 12px; font-weight: 600; color: #334155; }
  .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; margin-bottom: 12px; }
  .field-grid .field { margin: 0; }
  .field .label { display: block; font-size: 10px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 2px; }
  .field .value { color: #0f172a; white-space: pre-wrap; }
  .field.full { grid-column: 1 / -1; }
  .muted { color: #64748b; font-style: italic; }
  .intro { margin-bottom: 20px; color: #475569; }
  table.lines { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  table.lines th, table.lines td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; vertical-align: top; }
  table.lines th { background: #f1f5f9; font-size: 10px; text-transform: uppercase; color: #475569; }
  .doc-meta .doc-no { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 8px; }
  @media print {
    .section { page-break-inside: avoid; }
    .section-major { page-break-before: always; }
    .section-major:first-of-type { page-break-before: auto; }
  }
`;
}

function display(value: string | boolean | undefined | null, fallback = "Not recorded"): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  const trimmed = String(value ?? "").trim();
  return trimmed ? escapeDocumentHtml(trimmed) : `<span class="muted">${escapeDocumentHtml(fallback)}</span>`;
}

function displayDate(value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) return `<span class="muted">Not recorded</span>`;
  return escapeDocumentHtml(formatContractDate(trimmed));
}

function field(label: string, value: string | boolean | undefined, full = false): string {
  return `<div class="field${full ? " full" : ""}"><span class="label">${escapeDocumentHtml(label)}</span><div class="value">${display(value)}</div></div>`;
}

function textBlock(label: string, value: string | undefined): string {
  return `<h4>${escapeDocumentHtml(label)}</h4><div class="field full"><div class="value">${display(value)}</div></div>`;
}

function section(title: string, body: string, major = false): string {
  return `<div class="section${major ? " section-major" : ""}"><h3>${escapeDocumentHtml(title)}</h3>${body}</div>`;
}

function formatClientAddress(client: ClientRecord): string {
  const locations = client.locations ?? [];
  const preferred =
    locations.find((l) => l.serviceDeliveryAddress === "Yes") ??
    locations.find((l) => l.addressType === "Home") ??
    locations[0];
  if (!preferred) return "";
  return [
    preferred.address1,
    preferred.address2,
    preferred.address3,
    [preferred.city, preferred.state, preferred.postcode].filter(Boolean).join(" "),
    preferred.country,
  ]
    .filter(Boolean)
    .join(", ");
}

function bpAssociationsMatching(
  client: ClientRecord,
  matcher: (type: string, relationship: string) => boolean
): string {
  const rows = (client.bpAssociations ?? []).filter((row) =>
    matcher(row.associationType.toLowerCase(), row.relationship.toLowerCase())
  );
  if (!rows.length) return "";
  return rows
    .map((row) => {
      const contact = [row.associatedBpName, row.relationship, row.mobile || row.phone, row.email]
        .filter(Boolean)
        .join(" · ");
      return contact;
    })
    .join("; ");
}

function primaryContactSummary(client: ClientRecord): string {
  const rows = (client.bpAssociations ?? []).filter((row) => row.primaryContact === "Yes");
  if (!rows.length) return bpAssociationsMatching(client, () => true) || "";
  return rows
    .map((row) => [row.associatedBpName, row.relationship, row.mobile || row.phone].filter(Boolean).join(" · "))
    .join("; ");
}

function guardianSummary(client: ClientRecord): string {
  return bpAssociationsMatching(
    client,
    (type, rel) => type.includes("guardian") || type.includes("nominee") || rel.includes("guardian")
  );
}

function planManagerSummary(client: ClientRecord, resolvePartnerName?: (id: string) => string | undefined): string {
  if (client.planManagerPartnerId?.trim()) {
    const resolved = resolvePartnerName?.(client.planManagerPartnerId.trim());
    if (resolved?.trim()) return resolved.trim();
  }
  return bpAssociationsMatching(
    client,
    (type) => type.includes("plan manager") || type.includes("plan-managed")
  );
}

function supportRequirementRows(plan: SupportPlanRecord): string {
  const structured = plan.supportRequirements ?? [];
  if (structured.length) {
    return `<table class="lines">
      <thead><tr><th>Support area</th><th>Requirement</th><th>Level</th><th>Frequency</th><th>Special instructions</th></tr></thead>
      <tbody>${structured
        .map(
          (row) => `<tr>
          <td>${display(row.supportArea)}</td>
          <td>${display(row.supportRequirement)}</td>
          <td>${display(row.levelOfAssistance)}</td>
          <td>${display(row.frequency)}</td>
          <td>${display(row.specialInstructions)}</td>
        </tr>`
        )
        .join("")}</tbody>
    </table>`;
  }

  const items: { area: string; requirement: string }[] = [
    { area: "Personal care — showering", requirement: plan.showering },
    { area: "Personal care — grooming / hair", requirement: plan.hairCare },
    { area: "Personal care — dressing", requirement: plan.dressing },
    { area: "Personal care — continence / toileting", requirement: plan.toiletUse },
    { area: "Personal care — oral hygiene", requirement: plan.oralHygiene },
    { area: "Daily living — cleaning", requirement: plan.cleaning },
    { area: "Daily living — shopping / grocery", requirement: plan.grocery },
    { area: "Daily living — meal preparation", requirement: plan.cooking },
    { area: "Meals — eating and drinking support", requirement: plan.eatingDrinkingSupport },
    { area: "Meals — dietary notes", requirement: plan.dietaryAllergies },
    { area: "Community access — transport", requirement: plan.transportArrangements },
    { area: "Community access — activities", requirement: plan.activityDetails },
    { area: "Mobility", requirement: plan.mobilityDetail },
    { area: "Household — laundry / bed", requirement: [plan.laundry, plan.makeBed].filter(Boolean).join("; ") },
    { area: "Finance", requirement: plan.financialArrangementDetails || plan.financialArrangement },
  ].filter((item) => item.requirement?.trim());

  if (!items.length) {
    return `<p class="muted">No structured support requirements recorded on the support plan tabs.</p>`;
  }

  return `<table class="lines">
    <thead><tr><th>Support area</th><th>Requirement / level / instructions</th></tr></thead>
    <tbody>${items
      .map(
        (item) => `<tr><td>${escapeDocumentHtml(item.area)}</td><td>${display(item.requirement)}</td></tr>`
      )
      .join("")}</tbody>
  </table>`;
}

export function buildSupportPlanDocumentHtml(
  template: DocumentTemplateRecord,
  ctx: SupportPlanDocumentContext,
  options?: { autoPrint?: boolean }
): string {
  const { client, plan, organization, serviceBookings, rosterShifts, planDocuments, resolvePartnerName, resolveEmployeeName } =
    ctx;
  const address = formatClientAddress(client);
  const phone = client.phone?.trim() || client.locations?.find((l) => l.phone || l.mobile)?.mobile || client.locations?.find((l) => l.phone)?.phone || "";

  const headerMetaHtml = `<div class="doc-meta">
    <h2>${escapeDocumentHtml((template.titleText || "Participant support plan").toUpperCase())}</h2>
    <p class="doc-no">${escapeDocumentHtml(client.searchKey)} · Plan ${escapeDocumentHtml(plan.documentNo)}</p>
    <p>Generated ${escapeDocumentHtml(new Date().toLocaleDateString("en-AU"))}</p>
  </div>`;

  const section1 = section(
    "Section 1 — Participant details",
    `<div class="field-grid">
      ${field("Participant name", client.name)}
      ${field("Preferred name", client.preferredName)}
      ${field("NDIS number", client.fundingBodyNumber)}
      ${field("Date of birth", client.birthday ? formatContractDate(client.birthday) : "")}
      ${field("Address", address, true)}
      ${field("Phone", phone)}
      ${field("Email", client.email)}
      ${field("Primary contact", primaryContactSummary(client))}
      ${field("Guardian / nominee", guardianSummary(client))}
      ${field("Plan start date", client.dateSupportCommencement ? formatContractDate(client.dateSupportCommencement) : "")}
      ${field("Plan end / review due", client.planReviewDueDate ? formatContractDate(client.planReviewDueDate) : "")}
      ${field("Funding management type", client.planManagementType)}
      ${field("Support coordinator", client.salesRepresentative)}
      ${field("Plan manager", planManagerSummary(client, resolvePartnerName))}
    </div>`
  );

  const section2 = section(
    "Section 2 — About me",
    `${textBlock("My story", plan.myStory || client.additionalDisabilityInformation || client.disability)}
    ${textBlock("What is important to me", plan.importantToMe)}
    ${textBlock("What is important for me", plan.importantForMe)}
    ${textBlock("Cultural requirements", [plan.culturalNeeds, client.culturalAffiliation].filter(Boolean).join("\n") || undefined)}
    ${textBlock("Religious requirements", plan.religiousRequirements)}
    ${textBlock("Language preferences", plan.primaryLanguage)}
    ${textBlock("Family information", plan.familyInformation || bpAssociationsMatching(client, (type) => type.includes("family") || type.includes("friend")))}
    ${textBlock("Pets", plan.pets)}
    ${textBlock("Hobbies", plan.hobbies)}
    ${textBlock("Strengths", plan.strengths)}
    ${textBlock("Skills", plan.skills)}
    ${textBlock("Aspirations", plan.aspirations || plan.goals?.map((g) => g.goal).filter(Boolean).join("; "))}
    ${textBlock("Things I enjoy", plan.likes)}
    ${textBlock("Things I don't like", plan.dislikes)}`
  );

  const goalRows = (plan.goals ?? []).length
    ? (plan.goals ?? [])
        .map((goal) => {
          const reviews = (plan.progressReviews ?? []).filter((r) => r.goalId === goal.id);
          const progressLink = reviews.length
            ? reviews.map((r) => `${formatContractDate(r.reviewDate)}: ${r.progressTaken || r.goalProgress}`).join("; ")
            : "";
          return `<tr>
            <td>${display(goal.goal || goal.name)}</td>
            <td>${display(goal.ndisCategory || goal.goalType)}</td>
            <td>${display(goal.supportRequired)}</td>
            <td>${display(goal.successMeasures || goal.goalTerm)}</td>
          </tr>
          <tr><td colspan="4"><strong>Why it matters:</strong> ${display(goal.whyItMatters)} · <strong>Progress:</strong> ${display(progressLink)} · <strong>Review:</strong> ${displayDate(goal.endDate)}</td></tr>`;
        })
        .join("")
    : `<tr><td colspan="4">No goals recorded on this support plan.</td></tr>`;

  const section3 = section(
    "Section 3 — NDIS goals",
    `<table class="lines">
      <thead><tr><th>Goal</th><th>NDIS category</th><th>Actions / support</th><th>Success measures</th></tr></thead>
      <tbody>${goalRows}</tbody>
    </table>`
  );

  const commNeeds = (client.needsAndRules ?? [])
    .filter((row) => /communication|behaviour|worker/i.test(row.category + row.name))
    .map((row) => `${row.name}: ${row.ruleText}`)
    .join("\n");

  const section4 = section(
    "Section 4 — Communication profile",
    `<div class="field-grid">
      ${field("Preferred communication method", client.preferredCommunicationMethod || plan.communicationMethod)}
      ${field("Verbal communication level", plan.verbalCommunicationLevel)}
      ${field("Non-verbal communication", plan.nonVerbalCommunication)}
      ${field("Communication aids", plan.communicationAids)}
      ${field("Interpreter required", plan.interpreterRequired)}
    </div>
    ${textBlock("Triggers", plan.communicationTriggers || plan.stressCause)}
    ${textBlock("Calming strategies", plan.calmingStrategies || plan.relaxation || plan.strategies)}
    ${textBlock("Worker guidance", plan.workerGuidance || commNeeds || plan.howSupported)}`
  );

  const diagnosisRows = (plan.diagnoses ?? []).length
    ? (plan.diagnoses ?? [])
        .map(
          (d) => `<tr><td>${display(d.diagnosis)}</td><td>${display(d.condition)}</td><td>${display(d.treatingPractitioner)}</td><td>${display(d.impactOnDailyLiving)}</td></tr>`
        )
        .join("")
    : `<tr><td colspan="4">${display([client.disability, client.additionalDisabilityInformation, plan.medicalHistory].filter(Boolean).join(" · ") || undefined)}</td></tr>`;

  const medicationRows = (plan.medications ?? []).length
    ? (plan.medications ?? [])
        .map(
          (m) => `<tr><td>${display(m.medicationName)}</td><td>${display(m.dosage)}</td><td>${display(m.purpose)}</td><td>${display(m.administrationRequirements)}</td></tr>`
        )
        .join("")
    : `<tr><td colspan="4">${display(plan.medicationRequired === "No" ? "No medication required" : plan.medicationDetails)}</td></tr>`;

  const healthPlanRows = (plan.healthPlans ?? []).length
    ? (plan.healthPlans ?? [])
        .map(
          (h) => `<tr><td>${display(h.planType)}</td><td>${display(h.attachmentReference)}</td><td>${display(h.notes)}</td></tr>`
        )
        .join("")
    : `<tr><td colspan="3">No health plan attachments recorded.</td></tr>`;

  const allergyRows = (client.risks ?? [])
    .filter((r) => /allerg/i.test(r.riskType + r.name))
    .map(
      (r) => `<tr><td>${display(r.name || r.riskType)}</td><td>${display(r.description)}</td><td>${display("See description")}</td></tr>`
    )
    .join("");

  const section5 = section(
    "Section 5 — Health information",
    `<h4>Diagnoses and medical conditions</h4>
    <table class="lines">
      <thead><tr><th>Diagnosis</th><th>Condition</th><th>Treating practitioner</th><th>Impact on daily living</th></tr></thead>
      <tbody>${diagnosisRows}</tbody>
    </table>
    <h4>Medications</h4>
    <table class="lines">
      <thead><tr><th>Medication</th><th>Dosage</th><th>Purpose</th><th>Administration requirements</th></tr></thead>
      <tbody>${medicationRows}</tbody>
    </table>
    <h4>Allergies</h4>
    <table class="lines">
      <thead><tr><th>Allergy</th><th>Severity / impact</th><th>Action required</th></tr></thead>
      <tbody>${allergyRows || `<tr><td colspan="3">${plan.knownAllergies === "Yes" ? display(plan.dietaryAllergies || client.riskAlerts) : "Not recorded"}</td></tr>`}</tbody>
    </table>
    <h4>Health plans</h4>
    <table class="lines">
      <thead><tr><th>Plan type</th><th>Attachment / reference</th><th>Notes</th></tr></thead>
      <tbody>${healthPlanRows}</tbody>
    </table>`
  );

  const riskRows = (client.risks ?? []).length
    ? (client.risks ?? [])
        .map(
          (r) => `<tr>
          <td>${display(r.name || r.riskType)}</td>
          <td>${display(r.likelihood)}</td>
          <td>${display(r.consequence)}</td>
          <td>${display(r.controls || r.description)}</td>
        </tr>
        <tr><td colspan="4"><strong>Emergency response:</strong> ${display(r.emergencyResponse)} · <strong>Escalation:</strong> ${display(r.escalationProcess)} · <strong>Review:</strong> ${displayDate(r.reviewDate || r.validTo)}</td></tr>`
        )
        .join("")
    : `<tr><td colspan="4">No individual risks recorded.</td></tr>`;

  const section6 = section(
    "Section 6 — Risk management",
    `<table class="lines">
      <thead><tr><th>Risk</th><th>Likelihood</th><th>Consequence</th><th>Controls</th></tr></thead>
      <tbody>${riskRows}</tbody>
    </table>
    ${textBlock("Risk alert summary", client.riskAlerts)}`
  );

  const restrictiveRows = (client.restrictivePractices ?? []).length
    ? (client.restrictivePractices ?? [])
        .map(
          (r) => `<tr><td>${display(r.name)}</td><td>${display(r.practiceType)}</td><td>${display(r.validFrom ? `From ${formatContractDate(r.validFrom)}` : "")}</td><td>${display(r.description)}</td></tr>`
        )
        .join("")
    : `<tr><td colspan="4">No restrictive practices recorded.</td></tr>`;

  const section7 = section(
    "Section 7 — Behaviour support",
    `<div class="field-grid">
      ${field("Behaviour support plan exists?", plan.behaviourSupportRequired)}
      ${field("Practitioner", plan.behaviourPractitioner)}
      ${field("Authorisations", plan.behaviourAuthorisations, true)}
    </div>
    <h4>Restrictive practices and authorisations</h4>
    <table class="lines">
      <thead><tr><th>Practice</th><th>Type</th><th>Authorisation</th><th>Notes</th></tr></thead>
      <tbody>${restrictiveRows}</tbody>
    </table>
    ${textBlock("Positive behaviour supports", plan.strategies)}
    ${textBlock("Triggers", plan.stressCause)}
    ${textBlock("De-escalation strategies", plan.relaxation || plan.strategies)}
    ${textBlock("Behaviour description", plan.behaviourDescription)}`
  );

  const needRuleRows = (client.needsAndRules ?? []).length
    ? (client.needsAndRules ?? [])
        .map(
          (row) => `<tr><td>${display(row.category)}</td><td>${display(row.name)}</td><td colspan="2">${display(row.ruleText)}</td></tr>`
        )
        .join("")
    : "";

  const section8 = section(
    "Section 8 — Support requirements",
    `${supportRequirementRows(plan)}
    ${needRuleRows ? `<h4>Needs and rules</h4><table class="lines"><thead><tr><th>Category</th><th>Name</th><th colspan="2">Instructions</th></tr></thead><tbody>${needRuleRows}</tbody></table>` : ""}
    <h4>Daily routine</h4>
    <div class="field-grid">
      ${field("Morning", plan.morning, true)}
      ${field("Daytime", plan.daytime, true)}
      ${field("Afternoon", plan.afternoon, true)}
      ${field("Evening / night", plan.eveningNight, true)}
      ${field("Weekly", plan.weekly, true)}
    </div>`
  );

  const consentSummary = (client.consents ?? [])
    .map((c) => `${c.consentType}: ${c.consentStatus}${c.validTo ? ` (to ${formatContractDate(c.validTo)})` : ""}`)
    .join("; ");

  const section9 = section(
    "Section 9 — Decision making and consent",
    `<div class="field-grid">
      ${field("Decision-making capacity", client.decisionMaking)}
      ${field("Guardian details", guardianSummary(client))}
      ${field("Consent obtained", consentSummary, true)}
      ${field("Information sharing consent", (client.consents ?? []).find((c) => /information/i.test(c.consentType))?.consentStatus)}
      ${field("Photo consent", (client.consents ?? []).find((c) => /photo|video/i.test(c.consentType))?.consentStatus)}
      ${field("Social media consent", (client.consents ?? []).find((c) => /social/i.test(c.consentType))?.consentStatus)}
    </div>`
  );

  const emergencyContacts = (client.bpAssociations ?? [])
    .map(
      (row) =>
        `<tr><td>${display(row.associationType)}</td><td>${display(row.associatedBpName)}</td><td>${display(row.mobile || row.phone)}</td><td>${display(row.email)}</td></tr>`
    )
    .join("");

  const section10 = section(
    "Section 10 — Emergency information",
    `<h4>Emergency contacts</h4>
    <table class="lines">
      <thead><tr><th>Type</th><th>Name</th><th>Phone</th><th>Email</th></tr></thead>
      <tbody>${emergencyContacts || `<tr><td colspan="4">No emergency contacts recorded.</td></tr>`}</tbody>
    </table>
    ${textBlock("Provider after-hours contact", [organization.phone, organization.email].filter(Boolean).join(" · "))}
    <div class="field-grid">
      ${field("Medical emergency", plan.emergencyMedicalProcedure, true)}
      ${field("Missing person", plan.emergencyMissingPersonProcedure, true)}
      ${field("Behavioural crisis", plan.emergencyBehaviouralCrisisProcedure || (plan.behaviourSupportRequired === "Yes" ? plan.strategies : undefined), true)}
      ${field("Fire evacuation", plan.emergencyFireEvacuationProcedure, true)}
    </div>`
  );

  const section11 = section(
    "Section 11 — Worker instructions",
    `${textBlock("What works best", plan.whatWorksBest || plan.howSupported)}
    ${textBlock("Worker approaches", plan.workerApproaches || plan.howSupported)}
    ${textBlock("Communication tips", plan.workerGuidance || plan.communicationMethod || client.preferredCommunicationMethod)}
    ${textBlock("Environmental considerations", plan.environmentalConsiderations || client.locations?.map((l) => l.accessNotes).filter(Boolean).join("\n"))}
    ${textBlock("Avoid", plan.avoidList || plan.dislikes)}
    ${textBlock("Known triggers", plan.communicationTriggers || plan.stressCause)}
    ${textBlock("Unsafe practices", plan.unsafePractices)}
    ${textBlock("Shift expectations", plan.morning ? `Morning: ${plan.morning}` : undefined)}
    ${textBlock("Arrival process", plan.shiftArrivalProcess)}
    ${textBlock("Departure process", plan.shiftDepartureProcess)}
    ${textBlock("Documentation requirements", plan.documentationRequirements)}`
  );

  const assistiveRows = (plan.assistiveTechnology ?? []).length
    ? (plan.assistiveTechnology ?? [])
        .map(
          (a) => `<tr><td>${display(a.equipment)}</td><td>${display(a.serialNumber)}</td><td>${display(a.maintenanceSchedule)}</td><td>${display(a.trainingRequired)}</td></tr>`
        )
        .join("")
    : `<tr><td colspan="4">No assistive technology recorded.</td></tr>`;

  const section12 = section(
    "Section 12 — Assistive technology",
    `<table class="lines">
      <thead><tr><th>Equipment</th><th>Serial number</th><th>Maintenance schedule</th><th>Training required</th></tr></thead>
      <tbody>${assistiveRows}</tbody>
    </table>`
  );

  const bookingRows = serviceBookings.length
    ? serviceBookings
        .flatMap((booking) =>
          (booking.lines ?? []).map(
            (line) => `<tr>
            <td>${display(booking.description || booking.documentNo)}</td>
            <td>${display(line.startDate && line.endDate ? `${formatContractDate(line.startDate)} – ${formatContractDate(line.endDate)}` : booking.startDate ? formatContractDate(booking.startDate) : "")}</td>
            <td>${display(line.productId || line.claimType)}</td>
            <td>${display(line.orderedQuantity ? `${line.orderedQuantity} ${line.uom}` : "")}</td>
          </tr>`
          )
        )
        .join("")
    : `<tr><td colspan="4">No active service bookings for this participant.</td></tr>`;

  const rosterRows = rosterShifts.length
    ? rosterShifts
        .slice(0, 40)
        .map(
          (shift) => `<tr>
          <td>${displayDate(shift.shiftDate)}</td>
          <td>${display(`${shift.startTime} – ${shift.endTime}`)}</td>
          <td>${display(resolveEmployeeName?.(shift.employeeId) || shift.employeeId)}</td>
          <td>${display(shift.shiftType)}</td>
        </tr>`
        )
        .join("")
    : `<tr><td colspan="4">No roster shifts linked to this participant.</td></tr>`;

  const section13 = section(
    "Section 13 — Service delivery schedule",
    `<h4>Service bookings</h4>
    <table class="lines">
      <thead><tr><th>Support</th><th>Period</th><th>Funding / product</th><th>Frequency / quantity</th></tr></thead>
      <tbody>${bookingRows}</tbody>
    </table>
    <h4>Roster of care (recent shifts)</h4>
    <table class="lines">
      <thead><tr><th>Date</th><th>Time</th><th>Worker</th><th>Shift type</th></tr></thead>
      <tbody>${rosterRows}</tbody>
    </table>`
  );

  const reviewRows = [
    ...(plan.progressReviews ?? []).map(
      (r) => `<tr>
        <td>${displayDate(r.reviewDate)}</td>
        <td>${display(r.createdBy)}</td>
        <td>${display(r.receiverFeeling ? "Participant feedback recorded" : "")}</td>
        <td>${display(r.progressTaken || r.nextSteps)}</td>
        <td>${displayDate(r.reviewDate)}</td>
      </tr>`
    ),
    ...planDocuments.map(
      (doc) => `<tr>
        <td>${displayDate(doc.reviewDate)}</td>
        <td>${display(doc.documentDeveloper)}</td>
        <td class="muted">—</td>
        <td>${display(`${doc.planType} (${doc.documentStatus})`)}</td>
        <td class="muted">—</td>
      </tr>`
    ),
  ].join("");

  const section14 = section(
    "Section 14 — Review history",
    `<table class="lines">
      <thead><tr><th>Review date</th><th>Reviewer</th><th>Participant involved</th><th>Changes made</th><th>Next review</th></tr></thead>
      <tbody>${reviewRows || `<tr><td colspan="5">No review history recorded.</td></tr>`}</tbody>
    </table>
    <p class="muted">Support plan document ${escapeDocumentHtml(plan.documentNo)} · Last provided ${displayDate(plan.providedToReceiver)} · ${plan.active ? "Active" : "Inactive"}</p>`
  );

  const bodyHtml = `<style>${supportPlanPrintStyles()}</style>
  <div class="intro panel">
    <p><strong>${escapeDocumentHtml(client.name)}</strong>${client.preferredName?.trim() ? ` (${escapeDocumentHtml(client.preferredName.trim())})` : ""}</p>
    <p>This printable combines the participant profile, support plan tabs, goals, health records, risks, consents, bookings, and roster data.</p>
  </div>
  ${section1}
  ${section2}
  ${section3}
  ${section4}
  ${section5}
  ${section6}
  ${section7}
  ${section8}
  ${section9}
  ${section10}
  ${section11}
  ${section12}
  ${section13}
  ${section14}`;

  return wrapDocumentHtml({
    title: `${client.searchKey} — Support plan`,
    org: organization,
    headerMetaHtml,
    bodyHtml,
    footerOverride: template.footerText,
    autoPrint: options?.autoPrint,
  });
}
