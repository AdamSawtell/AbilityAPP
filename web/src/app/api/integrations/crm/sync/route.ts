import { NextResponse } from "next/server";
import { syncEnquiryToExternalCrm } from "@/lib/integrations/crm-sync.server";
import { getAuthSessionFromRequest, sessionCanWriteWindow } from "@/lib/auth/session.server";

type SyncBody = {
  enquiryId?: string;
};

export async function POST(request: Request) {
  const session = await getAuthSessionFromRequest();
  if (!session || !sessionCanWriteWindow(session, "enquiries")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: SyncBody;
  try {
    body = (await request.json()) as SyncBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const enquiryId = body.enquiryId?.trim();
  if (!enquiryId) {
    return NextResponse.json({ error: "enquiryId is required." }, { status: 400 });
  }

  try {
    const { enquiry, result } = await syncEnquiryToExternalCrm(enquiryId, session.displayName);
    return NextResponse.json({
      enquiryId: enquiry.id,
      contactId: result.ok ? result.contactId : "",
      dryRun: result.ok ? result.dryRun : false,
      provider: result.ok ? result.provider : "hubspot",
      updatedEnquiry: enquiry,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "CRM sync failed.";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
