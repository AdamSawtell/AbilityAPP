"use client";

import Link from "next/link";
import { useMemo } from "react";
import { SystemShell } from "@/components/system/system-shell";
import { HELP_ARTICLES } from "@/lib/help/articles";

export function SystemGuidesIndexView() {
  const articles = useMemo(
    () =>
      HELP_ARTICLES.filter((a) => a.category === "System setup").sort((a, b) =>
        a.title.localeCompare(b.title)
      ),
    []
  );

  const featured = articles.find((a) => a.slug === "core-system-setup");

  return (
    <SystemShell
      title="How-to guide"
      subtitle="Setup and configuration guides for System administrators. Start with the go-live checklist, then open the guide for each area you are configuring."
      breadcrumbs={[{ label: "System", href: "/system" }, { label: "How-to guide" }]}
      audit={{ moduleLabel: "System how-to guide" }}
    >
      {featured ? (
        <div className="mb-8 rounded-xl border border-[#f9a8d4]/40 bg-[#fdf2f8]/50 p-5">
          <p className="text-sm font-medium text-[#b51266]">Start here</p>
          <p className="mt-1 text-sm text-slate-600">{featured.summary}</p>
          <Link
            href={`/system/guides/${featured.slug}`}
            className="mt-3 inline-block text-sm font-medium text-[#b51266] hover:underline"
          >
            {featured.title} →
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={`/system/guides/${article.slug}`}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#f9a8d4]/60 hover:shadow-md"
          >
            <h2 className="font-semibold text-slate-900">{article.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{article.summary}</p>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-sm text-slate-500">
        Day-to-day workspace guides (navigation, creating clients, running reports) are in the{" "}
        <Link href="/help" className="font-medium text-[#b51266] hover:underline">
          workspace how-to guide
        </Link>
        .
      </p>
    </SystemShell>
  );
}
