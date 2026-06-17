"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-store";

const tabs = [
  { href: "/workforce-planning", label: "Leave calendar", windowKey: "workforce-planning", exact: true },
  {
    href: "/workforce-planning/organisation",
    label: "Organisation structure",
    windowKey: "workforce-organisation",
    exact: false,
  },
] as const;

export function WorkforcePlanningSubnav() {
  const pathname = usePathname();
  const { canWindow } = useAuth();

  const visible = tabs.filter((t) => canWindow(t.windowKey));
  if (visible.length <= 1) return null;

  return (
    <nav className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
      {visible.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              active
                ? "bg-indigo-50 text-indigo-900 ring-1 ring-indigo-200/70"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
