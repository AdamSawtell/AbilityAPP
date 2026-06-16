"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/lib/auth-store";
import { filterArticlesForSession, helpArticleBySlug } from "@/lib/help";
import { HELP_ARTICLES } from "@/lib/help/articles";
import { HelpArticleView } from "@/components/help/help-article-view";
import { HelpLayout } from "@/components/help/help-layout";
import { HelpSidebar } from "@/components/help/help-sidebar";

export function HelpArticlePage({ slug }: { slug: string }) {
  const { session } = useAuth();
  const articles = useMemo(
    () => filterArticlesForSession(HELP_ARTICLES, session?.windowKeys ?? []),
    [session?.windowKeys]
  );
  const article = helpArticleBySlug(articles, slug);

  if (!article) {
    return (
      <HelpLayout sidebar={<HelpSidebar articles={articles} activeSlug={slug} />}>
        <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Topic not found</h1>
          <p className="mt-2 text-sm text-slate-600">
            This article does not exist or your role cannot access it.
          </p>
          <Link
            href="/help"
            className="mt-6 inline-flex rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
          >
            Back to guide home
          </Link>
        </div>
      </HelpLayout>
    );
  }

  return (
    <HelpLayout sidebar={<HelpSidebar articles={articles} activeSlug={slug} />}>
      <HelpArticleView
        title={article.title}
        summary={article.summary}
        lastUpdated={article.lastUpdated}
        sections={article.sections}
      />
    </HelpLayout>
  );
}
