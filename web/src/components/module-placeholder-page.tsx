"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";

type ModulePlaceholderViewProps = {
  title: string;
  subtitle: string;
  abilityErpName: string;
  description: string;
  relatedLinks?: { href: string; label: string }[];
};

export function ModulePlaceholderView({
  title,
  subtitle,
  abilityErpName,
  description,
  relatedLinks = [],
}: ModulePlaceholderViewProps) {
  return (
    <AppShell
      title={title}
      subtitle={subtitle}
      breadcrumbs={[{ label: "Home", href: "/" }, { label: title }]}
      audit={{ moduleLabel: title }}
    >
      <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Coming soon</p>
        <h2 className="mt-2 text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">AbilityERP: {abilityErpName}</p>
        <p className="mt-4 text-sm leading-relaxed text-slate-600">{description}</p>
        {relatedLinks.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
