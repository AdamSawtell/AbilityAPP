"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { AppShellAuditProps } from "@/lib/audit";
import { RecordAuditFooter } from "@/components/record-audit-footer";
import { HowToGuideFooter } from "@/components/how-to-guide-footer";
import { SystemHeaderBrand, SystemNav } from "@/components/system/system-nav";

type Breadcrumb = { label: string; href?: string };

export function SystemShell({
  title,
  subtitle,
  breadcrumbs,
  actions,
  audit,
  children,
}: {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
  audit?: AppShellAuditProps;
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f6f8] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200 bg-white">
        <div className="flex h-16 shrink-0 items-center border-b border-slate-100 px-5">
          <SystemHeaderBrand />
        </div>
        <div className="flex min-h-0 flex-1 flex-col py-4">
          <SystemNav />
        </div>
      </aside>

      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden pl-64">
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-6 py-8 pb-24 lg:px-10">
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
          <HowToGuideFooter />
          {audit ? <RecordAuditFooter {...audit} /> : null}
        </main>
      </div>
    </div>
  );
}
