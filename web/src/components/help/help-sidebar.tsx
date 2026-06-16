"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { HelpArticle, HelpCategory } from "@/lib/help/types";
import { HELP_CATEGORY_LABELS, HELP_CATEGORIES } from "@/lib/help/articles";

function matchArticle(article: HelpArticle, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [article.title, article.summary, article.keywords.join(" "), article.category]
    .join(" ")
    .toLowerCase();
  return q.split(/\s+/).every((term) => haystack.includes(term));
}

export function HelpSidebar({
  articles,
  activeSlug,
}: {
  articles: HelpArticle[];
  activeSlug?: string;
}) {
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const filtered = articles.filter((a) => matchArticle(a, query));
    const map = new Map<HelpCategory, HelpArticle[]>();
    for (const article of filtered) {
      const list = map.get(article.category) ?? [];
      list.push(article);
      map.set(article.category, list);
    }
    return map;
  }, [articles, query]);

  const orderedCategories = HELP_CATEGORIES.filter((c) => grouped.has(c));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor="help-sidebar-search" className="sr-only">
          Search help
        </label>
        <input
          id="help-sidebar-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search topics…"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#d4147a] focus:bg-white focus:ring-2 focus:ring-[#d4147a]/20"
        />
      </div>

      <nav className="space-y-5">
        {orderedCategories.map((category) => {
          const items = grouped.get(category) ?? [];
          return (
          <div key={category}>
            <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {HELP_CATEGORY_LABELS[category]}
            </p>
            <div className="space-y-0.5">
              {items.map((article) => {
                const active = article.slug === activeSlug;
                return (
                  <Link
                    key={article.slug}
                    href={`/help/${article.slug}`}
                    className={`block rounded-lg px-3 py-2 text-sm transition ${
                      active
                        ? "bg-[#fdf2f8] font-medium text-[#b51266] ring-1 ring-[#f9a8d4]/60"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {article.title}
                  </Link>
                );
              })}
            </div>
          </div>
          );
        })}
        {grouped.size === 0 ? (
          <p className="px-2 text-sm text-slate-500">No topics match your search.</p>
        ) : null}
      </nav>
    </div>
  );
}
