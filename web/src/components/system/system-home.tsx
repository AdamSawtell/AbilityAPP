"use client";

import Link from "next/link";
import { SystemShell } from "@/components/system/system-shell";
import { SYSTEM_HOME_LINKS, SYSTEM_NAV_SECTIONS } from "@/lib/system/nav";

export function SystemHomeView() {
  const sectionsWithContent = SYSTEM_NAV_SECTIONS.filter((section) => {
    const cards = SYSTEM_HOME_LINKS.filter((c) => c.sectionKey === section.key);
    return cards.length > 0;
  });

  return (
    <SystemShell
      title="System setup"
      subtitle="Configure this tenant before and during go-live. The sidebar mirrors the workspace — each area holds setup for that module when it is ready."
      audit={{ moduleLabel: "System setup" }}
    >
      <div className="space-y-8">
        {sectionsWithContent.map((section) => {
          const cards = SYSTEM_HOME_LINKS.filter((c) => c.sectionKey === section.key);
          return (
            <section key={section.key}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{section.label}</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {cards.map((card) =>
                  card.comingSoon || !card.href ? (
                    <div
                      key={card.title}
                      className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <h3 className="text-base font-semibold text-slate-500">{card.title}</h3>
                      <p className="mt-2 text-sm text-slate-500">{card.description}</p>
                      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-400">Coming soon</p>
                    </div>
                  ) : (
                    <Link
                      key={card.href}
                      href={card.href}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#f9a8d4]/60 hover:shadow-md"
                    >
                      <h3 className="text-base font-semibold text-slate-900">{card.title}</h3>
                      <p className="mt-2 text-sm text-slate-500">{card.description}</p>
                    </Link>
                  )
                )}
              </div>
            </section>
          );
        })}
      </div>
      <p className="mt-8 text-sm text-slate-500">
        System is only reachable from the workspace sign-in screen. Day-to-day work stays in the workspace. Roles and
        workspace logins are managed under Admin there.
      </p>
    </SystemShell>
  );
}
