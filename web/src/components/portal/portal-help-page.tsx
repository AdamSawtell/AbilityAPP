"use client";

import { HelpArticleView } from "@/components/help/help-article-view";
import { PortalGuard, PortalLogoutButton } from "@/components/portal/portal-hub-page";
import { PortalNav, PortalShell } from "@/components/portal/portal-shell";
import { participantPortalGuideArticle } from "@/lib/help/articles/participant-portal-guide";

export function PortalHelpPage() {
  return (
    <PortalGuard>
      {() => (
        <PortalShell
          title="How to use your portal"
          subtitle="Services, funding, requests, and who to contact for help"
          actions={<PortalLogoutButton />}
        >
          <PortalNav active="help" />
          <HelpArticleView
            title={participantPortalGuideArticle.title}
            summary={participantPortalGuideArticle.summary}
            lastUpdated={participantPortalGuideArticle.lastUpdated}
            sections={participantPortalGuideArticle.sections}
          />
        </PortalShell>
      )}
    </PortalGuard>
  );
}
