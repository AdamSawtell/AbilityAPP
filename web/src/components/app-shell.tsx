"use client";

import Link from "next/link";
import { Suspense } from "react";
import { SidebarNav } from "@/components/sidebar-nav";
import { WorkspaceTabs } from "@/components/workspace-tabs";

export type Breadcrumb = {
  label: string;
  href?: string;
};

function SidebarNavFallback() {
  return <div className="px-3 py-4 text-sm text-slate-400">Loading menu…</div>;
}

export function AppShell({
  title,
  subtitle,
  breadcrumbs,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#f4f6f8] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200 bg-white">
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-slate-100 px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4147a] to-[#b51266] text-sm font-bold text-white shadow-sm">
              a
            </span>
            <span className="text-lg font-semibold tracking-tight">
              Ability<span className="text-[#d4147a]">ERP</span>
            </span>
          </Link>
        </div>

        <div className="flex min-h-0 flex-1 flex-col py-4">
          <Suspense fallback={<SidebarNavFallback />}>
            <SidebarNav />
          </Suspense>
        </div>

        <div className="shrink-0 border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d4147a]/10 text-sm font-semibold text-[#b51266]">
              SU
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">SuperUser</p>
              <p className="truncate text-xs text-slate-500">AbilityERP Admin</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col pl-64">
        <WorkspaceTabs />
        <main className="flex-1 px-6 py-8 pb-24 lg:px-10">
          {breadcrumbs?.length ? (
            <nav className="mb-3 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
              {breadcrumbs.map((crumb, index) => (
                <span key={`${crumb.label}-${index}`} className="inline-flex items-center gap-1.5">
                  {index > 0 ? <span className="text-slate-300">/</span> : null}
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-[#b51266]">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-slate-700">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          ) : null}

          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
              {subtitle ? <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p> : null}
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
