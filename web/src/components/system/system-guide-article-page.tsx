"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { HelpArticleView } from "@/components/help/help-article-view";
import { SystemShell } from "@/components/system/system-shell";
import { HELP_ARTICLES } from "@/lib/help/articles";

export function SystemGuideArticlePage({ slug }: { slug: string }) {
  const article = HELP_ARTICLES.find((a) => a.slug === slug && a.category === "System setup");
  if (!article) notFound();

  return (
    <SystemShell
      title="How-to guide"
      breadcrumbs={[
        { label: "System", href: "/system" },
        { label: "How-to guide", href: "/system/guides" },
        { label: article.title },
      ]}
      audit={{ moduleLabel: `System guide — ${article.title}` }}
    >
      <p className="mb-6">
        <Link href="/system/guides" className="text-sm font-medium text-[#b51266] hover:underline">
          ← Back to setup guides
        </Link>
      </p>
      <HelpArticleView
        title={article.title}
        summary={article.summary}
        lastUpdated={article.lastUpdated}
        sections={article.sections}
      />
    </SystemShell>
  );
}
