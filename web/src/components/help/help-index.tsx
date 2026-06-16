"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { HelpArticle } from "@/lib/help/types";
import { HELP_CATEGORY_LABELS, HELP_CATEGORIES } from "@/lib/help/articles";

export function HelpIndex({
  articles,
}: {
  articles: HelpArticle[];
}) {
  const quickTasks = useMemo(
    () => articles.filter((a) => a.category === "Quick tasks"),
    [articles]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, HelpArticle[]>();
    for (const article of articles) {
      const list = map.get(article.category) ?? [];
      list.push(article);
      map.set(article.category, list);
    }
    return map;
  }, [articles]);

  const orderedCategories = HELP_CATEGORIES.filter((c) => grouped.has(c));

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">AbilityAPP how-to guide</h1>
        <p className="mt-3 max-w-2xl text-base text-slate-600">
          Step-by-step help for every window, tab, and workflow. Use the sidebar to browse or search. This
          content also powers the future in-app AI assistant.
        </p>
      </header>

      <div className="mb-10 rounded-xl border border-[#f9a8d4]/40 bg-[#fdf2f8]/50 p-5">
        <p className="text-sm font-medium text-[#b51266]">New to AbilityAPP?</p>
        <p className="mt-1 text-sm text-slate-600">
          Start with{" "}
          <Link href="/help/getting-started" className="font-medium text-[#b51266] hover:underline">
            Getting started
          </Link>{" "}
          and{" "}
          <Link href="/help/navigation-and-workspace" className="font-medium text-[#b51266] hover:underline">
            Navigation and workspace
          </Link>
          .
        </p>
      </div>

      {quickTasks.length > 0 ? (
        <div className="mb-10 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Common questions</h2>
          <ul className="mt-3 space-y-2">
            {quickTasks.map((article) => (
              <li key={article.slug}>
                <Link href={`/help/${article.slug}`} className="text-sm font-medium text-[#b51266] hover:underline">
                  {article.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-8">
        {orderedCategories.map((category) => {
          const items = grouped.get(category) ?? [];
          return (
          <section key={category}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              {HELP_CATEGORY_LABELS[category as keyof typeof HELP_CATEGORY_LABELS] ?? category}
            </h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {items.map((article) => (
                <Link
                  key={article.slug}
                  href={`/help/${article.slug}`}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#f9a8d4]/60 hover:shadow-md"
                >
                  <h3 className="font-semibold text-slate-900">{article.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{article.summary}</p>
                </Link>
              ))}
            </div>
          </section>
          );
        })}
      </div>
    </div>
  );
}
