"use client";

import Link from "next/link";
import { SystemShell } from "@/components/system/system-shell";
import {
  isSystemReferenceSectionKey,
  type SystemReferenceSectionKey,
} from "@/lib/system/reference-data-sections";
import { moduleSetupConfig, type ModuleSetupConfig } from "@/lib/system/module-setup";
import { systemNavSectionLabel } from "@/lib/system/nav";

function LinkGrid({ title, links }: { title: string; links: ModuleSetupConfig["setupLinks"] }) {
  if (!links.length) return null;
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">{title}</h2>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="group block rounded-lg border border-slate-100 px-3 py-2.5 hover:bg-slate-50">
              <span className="text-sm font-medium text-[#b51266] group-hover:underline">{link.label}</span>
              <p className="mt-0.5 text-xs text-slate-500">{link.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SystemModuleSetupView({ sectionKey }: { sectionKey: SystemReferenceSectionKey }) {
  const config = moduleSetupConfig(sectionKey);
  if (!config) {
    return (
      <SystemShell title="Module setup" audit={{ moduleLabel: "System module setup" }}>
        <p className="text-sm text-slate-600">Unknown setup area.</p>
      </SystemShell>
    );
  }

  const sectionLabel = systemNavSectionLabel(sectionKey);
  const guideHref = config.guideSlug ? `/system/guides/${config.guideSlug}` : null;

  return (
    <SystemShell
      title={config.title}
      subtitle={config.summary}
      breadcrumbs={[
        { label: "System", href: "/system" },
        { label: sectionLabel },
        { label: "Module setup" },
      ]}
      audit={{ moduleLabel: `Module setup — ${sectionLabel}` }}
      actions={
        guideHref ? (
          <Link
            href={guideHref}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Read setup guide
          </Link>
        ) : null
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Checklist</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
            {config.checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>
        <LinkGrid title="System configuration" links={config.setupLinks} />
        <LinkGrid title="Workspace (day-to-day)" links={config.workspaceLinks} />
      </div>
    </SystemShell>
  );
}

export function resolveSystemSetupSection(section: string): SystemReferenceSectionKey | null {
  return isSystemReferenceSectionKey(section) ? section : null;
}
