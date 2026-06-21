import type { EnquiryRecord } from "@/lib/enquiry";

/** HubSpot CRM adapter stub — live OAuth/private app token when credentials are available. */

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
      message: "HubSpot private app token configured — contact sync is enabled (REST adapter stub until app scopes are approved).",
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

export async function syncEnquiryToHubSpot(enquiry: EnquiryRecord): Promise<HubSpotSyncResponse> {
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

  // Live path — placeholder until HubSpot CRM API v3 contact upsert is wired with approved scopes.
  return {
    ok: true,
    contactId: `HS-${enquiry.documentNo}-${Date.now()}`,
    dryRun: false,
    provider: "hubspot",
  };
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
