"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth-store";
import { filterArticlesForSession } from "@/lib/help";
import { HELP_ARTICLES } from "@/lib/help/articles";
import { HelpIndex } from "@/components/help/help-index";
import { HelpLayout } from "@/components/help/help-layout";
import { HelpSidebar } from "@/components/help/help-sidebar";

export function HelpHomePage() {
  const { session } = useAuth();
  const articles = useMemo(
    () => filterArticlesForSession(HELP_ARTICLES, session?.windowKeys ?? []),
    [session?.windowKeys]
  );

  return (
    <HelpLayout sidebar={<HelpSidebar articles={articles} />}>
      <HelpIndex articles={articles} />
    </HelpLayout>
  );
}
