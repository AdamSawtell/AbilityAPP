import { NextResponse } from "next/server";
import { createEnquiryFromWebLead } from "@/lib/integrations/crm-sync.server";
import {
  isWebToLeadConfigured,
  validateWebToLeadAuth,
} from "@/lib/integrations/web-to-lead";

export async function POST(request: Request) {
  if (!isWebToLeadConfigured()) {
    return NextResponse.json(
      { error: "Web-to-lead is not configured. Set WEB_TO_LEAD_SECRET on the server." },
      { status: 503 }
    );
  }

  if (!validateWebToLeadAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const enquiry = await createEnquiryFromWebLead(body);
    return NextResponse.json(
      {
        enquiryId: enquiry.id,
        documentNo: enquiry.documentNo,
        status: enquiry.status,
        enquirySource: enquiry.enquirySource,
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create enquiry.";
    const status = message.includes("required") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
