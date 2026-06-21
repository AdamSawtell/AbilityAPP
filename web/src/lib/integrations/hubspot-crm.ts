import type { EnquiryRecord } from "@/lib/enquiry";

/** HubSpot CRM adapter — dry-run locally, live contact upsert when a private app token is set. */

export type HubSpotPublicStatus = {
  available: boolean;
  mode: "live" | "dry-run" | "disabled";
  provider: "hubspot";
  portalId: string;
  message: string;
};

export type HubSpotContactPayload = {
  email: string;
  firstname: string;
  lastname: string;
  phone: string;
  company: string;
  enquiry_id: string;
  enquiry_document_no: string;
  enquiry_status: string;
  enquiry_source: string;
  ndis_number: string;
  postcode: string;
  description: string;
};

export type HubSpotSyncResponse =
  | {
      ok: true;
      contactId: string;
      dryRun: boolean;
      provider: "hubspot";
    }
  | { ok: false; message: string };

type HubSpotObjectResponse = {
  id?: string;
  properties?: Record<string, string>;
};

type HubSpotBatchUpsertResponse = {
  results?: Array<{ id: string }>;
  status?: string;
  message?: string;
};

type HubSpotErrorResponse = {
  status?: string;
  message?: string;
  category?: string;
  errors?: Array<{ message?: string }>;
};

function envFlag(name: string): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

export function hubspotAccessToken(): string {
  return process.env.HUBSPOT_ACCESS_TOKEN?.trim() ?? "";
}

export function hubspotPortalId(): string {
  return process.env.HUBSPOT_PORTAL_ID?.trim() ?? "";
}

const ALLOWED_HUBSPOT_API_HOSTS = new Set([
  "api.hubapi.com",
  "api-eu1.hubapi.com",
  "api-na1.hubapi.com",
]);

function resolveHubSpotApiBase(): string | null {
  const raw = process.env.HUBSPOT_API_BASE?.trim().replace(/\/$/, "");
  if (!raw) return "https://api.hubapi.com";

  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || !ALLOWED_HUBSPOT_API_HOSTS.has(url.host)) {
      return null;
    }
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

export function hubspotApiBase(): string {
  return resolveHubSpotApiBase() ?? "https://api.hubapi.com";
}

export function hubspotApiBaseError(): string | null {
  const raw = process.env.HUBSPOT_API_BASE?.trim();
  if (!raw) return null;
  return resolveHubSpotApiBase() ? null : "HUBSPOT_API_BASE must be an https://api*.hubapi.com endpoint.";
}

export function hubspotDryRunEnabled(): boolean {
  return envFlag("HUBSPOT_DRY_RUN");
}

export function hubspotLiveConfigured(): boolean {
  return Boolean(hubspotAccessToken());
}

export function getHubSpotPublicStatus(): HubSpotPublicStatus {
  if (hubspotDryRunEnabled()) {
    return {
      available: true,
      mode: "dry-run",
      provider: "hubspot",
      portalId: hubspotPortalId(),
      message: hubspotLiveConfigured()
        ? "Dry run — enquiry payload validated but not sent to HubSpot (HUBSPOT_DRY_RUN overrides live credentials)."
        : "Dry run — enquiry payload validated but not sent to HubSpot. Set HUBSPOT_DRY_RUN=true for local testing.",
    };
  }
  if (hubspotLiveConfigured()) {
    return {
      available: true,
      mode: "live",
      provider: "hubspot",
      portalId: hubspotPortalId(),
      message:
        "HubSpot private app token configured — enquiries upsert as CRM contacts via the v3 REST API (email match, or update by stored contact id).",
    };
  }
  return {
    available: false,
    mode: "disabled",
    provider: "hubspot",
    portalId: "",
    message:
      "Set HUBSPOT_DRY_RUN=true for testing, or HUBSPOT_ACCESS_TOKEN when your HubSpot private app is ready.",
  };
}

export function buildHubSpotContactPayload(enquiry: EnquiryRecord): HubSpotContactPayload {
  return {
    email: enquiry.email.trim(),
    firstname: enquiry.firstName.trim(),
    lastname: enquiry.lastName.trim(),
    phone: enquiry.phone.trim(),
    company: enquiry.bpName.trim(),
    enquiry_id: enquiry.id,
    enquiry_document_no: enquiry.documentNo,
    enquiry_status: enquiry.status,
    enquiry_source: enquiry.enquirySource,
    ndis_number: enquiry.ndisNumber,
    postcode: enquiry.postcode,
    description: enquiry.description.trim(),
  };
}

export function buildHubSpotApiProperties(payload: HubSpotContactPayload): Record<string, string> {
  const props: Record<string, string> = {};

  if (payload.firstname) props.firstname = payload.firstname;
  if (payload.lastname) props.lastname = payload.lastname;
  if (payload.email) props.email = payload.email;
  if (payload.phone) props.phone = payload.phone;

  if (payload.company) {
    props.company = payload.company;
  } else if (payload.enquiry_document_no) {
    props.company = `Enquiry ${payload.enquiry_document_no}`;
  }

  if (payload.postcode) props.zip = payload.postcode;

  const optionalMappings: Array<[string | undefined, string | undefined]> = [
    [process.env.HUBSPOT_PROPERTY_ENQUIRY_ID?.trim(), payload.enquiry_id],
    [process.env.HUBSPOT_PROPERTY_ENQUIRY_DOC?.trim(), payload.enquiry_document_no],
    [process.env.HUBSPOT_PROPERTY_ENQUIRY_STATUS?.trim(), payload.enquiry_status],
    [process.env.HUBSPOT_PROPERTY_ENQUIRY_SOURCE?.trim(), payload.enquiry_source],
    [process.env.HUBSPOT_PROPERTY_NDIS_NUMBER?.trim(), payload.ndis_number],
    [process.env.HUBSPOT_PROPERTY_DESCRIPTION?.trim(), payload.description],
  ];

  for (const [propertyName, value] of optionalMappings) {
    if (propertyName && value?.trim()) {
      props[propertyName] = value.trim();
    }
  }

  return props;
}

function isStoredHubSpotContactId(contactId: string): boolean {
  const trimmed = contactId.trim();
  return /^\d+$/.test(trimmed);
}

function hubSpotErrorMessage(body: HubSpotErrorResponse, fallback: string): string {
  const detail = body.errors?.map((entry) => entry.message).filter(Boolean).join("; ");
  return body.message || detail || fallback;
}

async function hubspotRequest<T>(
  path: string,
  init: RequestInit
): Promise<{ ok: true; data: T } | { ok: false; message: string; status?: number }> {
  const token = hubspotAccessToken();
  if (!token) {
    return { ok: false, message: "HubSpot access token is not configured." };
  }

  const baseError = hubspotApiBaseError();
  if (baseError) {
    return { ok: false, message: baseError };
  }

  let response: Response;
  try {
    response = await fetch(`${hubspotApiBase()}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
  } catch {
    return { ok: false, message: "Could not reach HubSpot. Check network connectivity and HUBSPOT_API_BASE." };
  }

  const text = await response.text();
  let body: T | HubSpotErrorResponse | null = null;
  if (text) {
    try {
      body = JSON.parse(text) as T | HubSpotErrorResponse;
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const errorBody = (body ?? {}) as HubSpotErrorResponse;
    return {
      ok: false,
      status: response.status,
      message: hubSpotErrorMessage(errorBody, `HubSpot API returned ${response.status}.`),
    };
  }

  return { ok: true, data: (body ?? {}) as T };
}

async function createHubSpotContact(properties: Record<string, string>): Promise<HubSpotSyncResponse> {
  const result = await hubspotRequest<HubSpotObjectResponse>("/crm/v3/objects/contacts", {
    method: "POST",
    body: JSON.stringify({ properties }),
  });
  if (!result.ok) return result;

  const contactId = result.data.id?.trim();
  if (!contactId) {
    return { ok: false, message: "HubSpot created a contact but did not return an id." };
  }

  return { ok: true, contactId, dryRun: false, provider: "hubspot" };
}

async function updateHubSpotContact(
  contactId: string,
  properties: Record<string, string>
): Promise<HubSpotSyncResponse & { status?: number }> {
  const result = await hubspotRequest<HubSpotObjectResponse>(`/crm/v3/objects/contacts/${contactId}`, {
    method: "PATCH",
    body: JSON.stringify({ properties }),
  });
  if (!result.ok) return { ok: false, message: result.message, status: result.status };

  return { ok: true, contactId, dryRun: false, provider: "hubspot" };
}

async function upsertHubSpotContactByEmail(
  email: string,
  properties: Record<string, string>
): Promise<HubSpotSyncResponse> {
  const result = await hubspotRequest<HubSpotBatchUpsertResponse>("/crm/v3/objects/contacts/batch/upsert", {
    method: "POST",
    body: JSON.stringify({
      inputs: [
        {
          id: email,
          idProperty: "email",
          properties,
        },
      ],
    }),
  });
  if (!result.ok) return result;

  const contactId = result.data.results?.[0]?.id?.trim();
  if (!contactId) {
    return { ok: false, message: "HubSpot upsert succeeded but did not return a contact id." };
  }

  return { ok: true, contactId, dryRun: false, provider: "hubspot" };
}

export async function upsertHubSpotContactLive(
  payload: HubSpotContactPayload,
  existingContactId?: string
): Promise<HubSpotSyncResponse> {
  const properties = buildHubSpotApiProperties(payload);
  if (!Object.keys(properties).length) {
    return { ok: false, message: "Enquiry has no HubSpot contact fields to sync." };
  }

  if (existingContactId && isStoredHubSpotContactId(existingContactId)) {
    const updated = await updateHubSpotContact(existingContactId, properties);
    if (updated.ok) return updated;
    if (updated.status !== 404) {
      return { ok: false, message: updated.message };
    }
  }

  if (payload.email) {
    return upsertHubSpotContactByEmail(payload.email, properties);
  }

  return createHubSpotContact(properties);
}

export async function syncEnquiryToHubSpot(
  enquiry: EnquiryRecord,
  options?: { existingContactId?: string }
): Promise<HubSpotSyncResponse> {
  const status = getHubSpotPublicStatus();
  if (!status.available) {
    return { ok: false, message: status.message };
  }

  const payload = buildHubSpotContactPayload(enquiry);
  if (!payload.email && !payload.phone) {
    return { ok: false, message: "Enquiry needs an email or phone before CRM sync." };
  }

  if (status.mode === "dry-run") {
    const contactId = `DRY-HS-${enquiry.documentNo}`;
    return { ok: true, contactId, dryRun: true, provider: "hubspot" };
  }

  if (!hubspotAccessToken()) {
    return { ok: false, message: "HubSpot access token is not configured." };
  }

  const existingContactId = options?.existingContactId ?? enquiry.externalCrmId;
  return upsertHubSpotContactLive(payload, existingContactId);
}

export function enquiryAfterHubSpotSync(
  enquiry: EnquiryRecord,
  result: Extract<HubSpotSyncResponse, { ok: true }>,
  actorName: string
): EnquiryRecord {
  return {
    ...enquiry,
    externalCrmProvider: result.provider,
    externalCrmId: result.contactId,
    externalCrmSyncedAt: new Date().toISOString(),
    updatedBy: actorName,
    activity: [
      {
        id: `act-crm-${Date.now()}`,
        lineNo: (enquiry.activity?.length ?? 0) + 1,
        date: new Date().toISOString().slice(0, 10),
        activityType: "CRM sync",
        subject: result.dryRun ? "HubSpot dry-run sync" : "HubSpot contact synced",
        description: `CRM contact ${result.contactId}${result.dryRun ? " (dry run — not sent)" : ""}.`,
        createdBy: actorName,
      },
      ...(enquiry.activity ?? []),
    ],
  };
}

export function getCrmPublicStatus() {
  const hubspot = getHubSpotPublicStatus();
  return {
    hubspot,
    webToLeadConfigured: Boolean(process.env.WEB_TO_LEAD_SECRET?.trim()),
  };
}
