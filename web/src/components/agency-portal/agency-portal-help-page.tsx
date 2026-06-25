"use client";

import { HelpArticleView } from "@/components/help/help-article-view";
import {
  AgencyPortalGuard,
  AgencyPortalLogoutButton,
} from "@/components/agency-portal/agency-portal-hub-page";
import { AgencyPortalNav, AgencyPortalShell } from "@/components/agency-portal/agency-portal-shell";
import { agencyVendorPortalArticle } from "@/lib/help/articles/agency-vendor-portal";

export function AgencyPortalHelpPage() {
  return (
    <AgencyPortalGuard>
      {() => (
        <AgencyPortalShell
          title="How to use this portal"
          subtitle="Shift requests, timesheets, invoices, and support escalation"
          actions={<AgencyPortalLogoutButton />}
        >
          <AgencyPortalNav active="help" />
          <HelpArticleView
            title={agencyVendorPortalArticle.title}
            summary={agencyVendorPortalArticle.summary}
            lastUpdated={agencyVendorPortalArticle.lastUpdated}
            sections={agencyVendorPortalArticle.sections}
          />
        </AgencyPortalShell>
      )}
    </AgencyPortalGuard>
  );
}
