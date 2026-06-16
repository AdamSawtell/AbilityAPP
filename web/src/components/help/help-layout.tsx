"use client";

import Link from "next/link";
import type { ReactNode } from "react";

function HelpNavIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
      />
    </svg>
  );
}

export function HelpLayout({
  children,
  sidebar,
}: {
  children: ReactNode;
  sidebar: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#f4f6f8] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-slate-200 bg-white">
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-slate-100 px-5">
          <Link href="/help" className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-sm">
              <HelpNavIcon />
            </span>
            <span className="truncate text-lg font-semibold tracking-tight">
              How-to <span className="text-[#d4147a]">guide</span>
            </span>
          </Link>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4">{sidebar}</div>

        <div className="shrink-0 border-t border-slate-100 p-4">
          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back to AbilityAPP
          </Link>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col pl-72">
        <main className="flex-1 px-6 py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
