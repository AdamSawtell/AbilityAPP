"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_TABS, MOBILE_APP_NAME, type MobileTabId } from "@/lib/mobile/constants";
import { RecordAuditFooter } from "@/components/record-audit-footer";

function tabActive(pathname: string, tab: MobileTabId): boolean {
  if (tab === "today") return pathname === "/m/today" || pathname === "/m";
  if (tab === "schedule") return pathname.startsWith("/m/schedule");
  if (tab === "timesheets") return pathname.startsWith("/m/timesheets");
  if (tab === "tasks") return pathname.startsWith("/m/tasks");
  return (
    pathname.startsWith("/m/more") ||
    pathname.startsWith("/m/id") ||
    pathname.startsWith("/m/install") ||
    pathname.startsWith("/m/messages") ||
    pathname.startsWith("/m/open-shifts") ||
    pathname.startsWith("/m/leave") ||
    pathname.startsWith("/m/availability") ||
    pathname.startsWith("/m/notifications") ||
    pathname.startsWith("/m/credentials") ||
    pathname.startsWith("/m/profile")
  );
}

export function MobileEmployeeShell({
  title,
  subtitle,
  children,
  hideNav,
  backHref,
  backLabel = "Back",
  floatingAction,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  hideNav?: boolean;
  backHref?: string;
  backLabel?: string;
  floatingAction?: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gradient-to-br from-slate-50 via-white to-[#fdf2f8]/30">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
        {backHref ? (
          <Link
            href={backHref}
            className="mb-2 inline-flex min-h-10 items-center gap-1 text-sm font-medium text-[#b51266]"
          >
            <span aria-hidden>←</span>
            {backLabel}
          </Link>
        ) : null}
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b51266]">{MOBILE_APP_NAME}</p>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p> : null}
      </header>

      <main className={`flex-1 px-4 py-4 ${hideNav ? "pb-6" : "pb-24"} ${floatingAction ? "pb-32" : ""}`}>
        {children}
        <footer className="mt-8 border-t border-slate-100 pt-4">
          <RecordAuditFooter moduleLabel="My Workplace mobile" />
        </footer>
      </main>

      {floatingAction ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 flex justify-center px-4">
          <div className="pointer-events-auto w-full max-w-md">{floatingAction}</div>
        </div>
      ) : null}

      {!hideNav ? (
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
          aria-label="My Workplace navigation"
        >
          <ul className="mx-auto flex max-w-lg">
            {MOBILE_TABS.map((tab) => {
              const active = tabActive(pathname, tab.id);
              return (
                <li key={tab.id} className="flex-1">
                  <Link
                    href={tab.href}
                    className={`flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium ${
                      active ? "text-[#b51266]" : "text-slate-500"
                    }`}
                  >
                    <TabIcon tab={tab.id} active={active} />
                    {tab.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}

function TabIcon({ tab, active }: { tab: MobileTabId; active: boolean }) {
  const stroke = active ? "#b51266" : "#64748b";
  const common = { width: 22, height: 22, fill: "none", stroke, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (tab) {
    case "today":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "schedule":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      );
    case "timesheets":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 14h6M9 18h4" />
        </svg>
      );
    case "tasks":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M9 11l2 2 4-4" />
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      );
    default:
      return (
        <svg {...common} viewBox="0 0 24 24">
          <circle cx="12" cy="6" r="1.5" fill={stroke} stroke="none" />
          <circle cx="12" cy="12" r="1.5" fill={stroke} stroke="none" />
          <circle cx="12" cy="18" r="1.5" fill={stroke} stroke="none" />
        </svg>
      );
  }
}
