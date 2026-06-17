"use client";

import Link from "next/link";
import type { HelpSection } from "@/lib/help/types";

function renderInlineLinks(text: string) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, index) => {
    const match = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (!match) return <span key={index}>{part}</span>;
    const [, label, href] = match;
    if (href.startsWith("/help/") || href.startsWith("/system/guides/")) {
      return (
        <Link key={index} href={href} className="font-medium text-[#b51266] hover:underline">
          {label}
        </Link>
      );
    }
    return (
      <Link key={index} href={href} className="font-medium text-[#b51266] hover:underline">
        {label}
      </Link>
    );
  });
}

function HelpParagraph({ text }: { text: string }) {
  return <p className="text-sm leading-relaxed text-slate-600">{renderInlineLinks(text)}</p>;
}

function HelpSectionBlock({ section }: { section: HelpSection }) {
  const paragraphs = (section.body ?? "").split(/\n\n+/).filter(Boolean);

  return (
    <section id={section.id} className="scroll-mt-8 border-b border-slate-100 pb-8 last:border-0">
      <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
      <div className="mt-3 space-y-3">
        {paragraphs.map((paragraph, index) => (
          <HelpParagraph key={index} text={paragraph} />
        ))}
      </div>
      {section.steps?.length ? (
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-600">
          {section.steps.map((step, index) => (
            <li key={index} className="leading-relaxed">
              {renderInlineLinks(step)}
            </li>
          ))}
        </ol>
      ) : null}
      {section.bullets?.length ? (
        <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-slate-600">
          {section.bullets.map((bullet, index) => (
            <li key={index} className="leading-relaxed">
              {renderInlineLinks(bullet)}
            </li>
          ))}
        </ul>
      ) : null}
      {section.relatedRoutes?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {section.relatedRoutes.map((route) => (
            <Link
              key={route}
              href={route}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-[#fdf2f8] hover:text-[#b51266]"
            >
              Open {route}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function HelpArticleView({
  title,
  summary,
  lastUpdated,
  sections,
}: {
  title: string;
  summary: string;
  lastUpdated: string;
  sections: HelpSection[];
}) {
  return (
    <article className="mx-auto max-w-3xl">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-3 text-base text-slate-600">{summary}</p>
        <p className="mt-2 text-xs text-slate-400">Last updated {lastUpdated}</p>
      </header>

      {sections.length > 1 ? (
        <nav className="mb-10 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">On this page</p>
          <ul className="mt-2 space-y-1">
            {sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="text-sm text-[#b51266] hover:underline">
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="space-y-8">
          {sections.map((section) => (
            <HelpSectionBlock key={section.id} section={section} />
          ))}
        </div>
      </div>
    </article>
  );
}
