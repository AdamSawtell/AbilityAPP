import type { EnquiryRecord } from "@/lib/enquiry";

export type WebToLeadPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  postcode: string;
  services: string;
  description: string;
  enquirySource: string;
  ndisNumber: string;
  planStatus: string;
  planManagementType: string;
  urgency: string;
  supportCategories: string;
  websiteForm: string;
};

export function webToLeadSecret(): string {
  return process.env.WEB_TO_LEAD_SECRET?.trim() ?? "";
}

export function isWebToLeadConfigured(): boolean {
  return Boolean(webToLeadSecret());
}

export function validateWebToLeadAuth(request: Request): boolean {
  const secret = webToLeadSecret();
  if (!secret) return false;

  const header = request.headers.get("x-abilityvua-webhook-secret")?.trim()
    ?? request.headers.get("x-abilityapp-webhook-secret")?.trim()
    ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim()
    ?? "";

  return header.length > 0 && header === secret;
}

export function mapWebToLeadBody(body: Record<string, unknown>): WebToLeadPayload {
  return {
    firstName: String(body.firstName ?? body.first_name ?? "").trim(),
    lastName: String(body.lastName ?? body.last_name ?? "").trim(),
    email: String(body.email ?? "").trim(),
    phone: String(body.phone ?? "").trim(),
    postcode: String(body.postcode ?? "").trim(),
    services: String(body.services ?? body.serviceType ?? "").trim(),
    description: String(body.description ?? body.message ?? "").trim(),
    enquirySource: String(body.enquirySource ?? body.source ?? "Website form").trim() || "Website form",
    ndisNumber: String(body.ndisNumber ?? body.ndis_number ?? "").trim(),
    planStatus: String(body.planStatus ?? body.plan_status ?? "").trim(),
    planManagementType: String(body.planManagementType ?? body.plan_management_type ?? "").trim(),
    urgency: String(body.urgency ?? "").trim(),
    supportCategories: String(body.supportCategories ?? body.support_categories ?? "").trim(),
    websiteForm: String(body.websiteForm ?? body.formName ?? body.form_name ?? "").trim(),
  };
}

export function validateWebToLeadPayload(payload: WebToLeadPayload): string | null {
  if (!payload.firstName && !payload.lastName) return "First name or last name is required.";
  if (!payload.email && !payload.phone) return "Email or phone is required.";
  return null;
}

export function webToLeadToEnquiryPartial(payload: WebToLeadPayload): Partial<EnquiryRecord> {
  const formNote = payload.websiteForm ? `Form: ${payload.websiteForm}` : "Website intake form";
  return {
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    phone: payload.phone,
    postcode: payload.postcode,
    services: payload.services,
    description: payload.description || formNote,
    enquirySource: payload.enquirySource,
    ndisNumber: payload.ndisNumber,
    planStatus: payload.planStatus,
    planManagementType: payload.planManagementType,
    urgency: payload.urgency,
    supportCategories: payload.supportCategories,
    status: "1_Enquiry received",
    fundingBody: "NDIS",
    isEnquiryForSelf: "Yes",
    thirdPartyConsent: "Requested",
    preferredCommunicationMethod: payload.email ? "Email" : "Phone",
    createdBy: "Web to lead",
    updatedBy: "Web to lead",
    activity: [
      {
        id: `act-wtl-${Date.now()}`,
        lineNo: 1,
        date: new Date().toISOString().slice(0, 10),
        activityType: "Intake",
        subject: "Website enquiry received",
        description: formNote,
        createdBy: "Web to lead",
      },
    ],
  };
}
