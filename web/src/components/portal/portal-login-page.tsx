"use client";

import { PortalAuthLanding } from "@/components/portal/portal-auth-landing";

export function PortalLoginPage() {
  return (
    <PortalAuthLanding
      config={{
        portalLabel: "Participant portal",
        intro: "View your upcoming supports, check your plan funding, and request new or changed services.",
        requestUrl: "/api/portal/auth/request",
        helpHref: "/portal/help",
        recordHint: "the email address on your participant record",
        openLinkLabel: "Open portal",
        emailPlaceholder: "you@example.com",
      }}
    />
  );
}
