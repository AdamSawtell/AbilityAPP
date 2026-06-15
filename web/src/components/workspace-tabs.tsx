"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useWorkspace } from "@/lib/workspace-store";

export function WorkspaceTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const { tabs, closeTab } = useWorkspace();

  if (tabs.length === 0) return null;

  function tabHref(tab: (typeof tabs)[number]) {
    if (tab.kind === "client") return `/clients/${tab.recordId}`;
    if (tab.kind === "employee") return `/employees/${tab.recordId}`;
    return `/enquiries/${tab.recordId}`;
  }

  function isActive(tab: (typeof tabs)[number]) {
    const href = tabHref(tab);
    return pathname === href || pathname.startsWith(`${href}?`);
  }

  function onClose(e: React.MouseEvent, key: string) {
    e.preventDefault();
    e.stopPropagation();
    const next = closeTab(key);
    const closingActive = tabs.find((t) => t.key === key && isActive(t));
    if (closingActive) {
      router.push(next);
    }
  }

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex items-center gap-1 overflow-x-auto px-4 py-2 lg:px-6">
        <span className="mr-2 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Open
        </span>
        {tabs.map((tab) => {
          const href = tabHref(tab);
          const active = isActive(tab);
          const activeStyles =
            tab.kind === "client"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900 shadow-sm"
              : tab.kind === "employee"
                ? "border-indigo-200 bg-indigo-50 text-indigo-900 shadow-sm"
                : "border-[#f9a8d4] bg-[#fdf2f8] text-[#b51266] shadow-sm";
          const dotColor =
            tab.kind === "client" ? "bg-emerald-500" : tab.kind === "employee" ? "bg-indigo-500" : "bg-[#d4147a]";
          return (
            <Link
              key={tab.key}
              href={href}
              className={`group inline-flex max-w-[200px] shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition ${
                active
                  ? activeStyles
                  : "border-transparent bg-slate-50 text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-900"
              }`}
            >
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
              <span className="min-w-0 truncate font-medium">{tab.label}</span>
              {tab.dirty ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" title="Unsaved" /> : null}
              <button
                type="button"
                onClick={(e) => onClose(e, tab.key)}
                className="ml-0.5 shrink-0 rounded p-0.5 text-slate-400 opacity-0 transition hover:bg-black/5 hover:text-slate-700 group-hover:opacity-100"
                aria-label={`Close ${tab.label}`}
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
