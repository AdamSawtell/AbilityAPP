"use client";

import { PortalAuthLanding } from "@/components/portal/portal-auth-landing";

export function AgencyPortalLoginPage() {
  return (
    <PortalAuthLanding
      config={{
        portalLabel: "Agency vendor portal",
        intro: "Confirm shift coverage, review approved timesheets, and submit invoices to the provider.",
        requestUrl: "/api/agency-portal/auth/request",
        helpHref: "/agency-portal/help",
        recordHint: "the email on your vendor business partner record",
        openLinkLabel: "Open agency portal",
        defaultEmail: "roster@staffplus.example",
        emailPlaceholder: "roster@staffplus.example",
      }}
    />
  );
}
