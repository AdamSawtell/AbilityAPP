"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { canAccessWindow } from "@/lib/access/catalog";

const tabs = [
  { href: "/my", label: "Overview", windowKey: "my-workplace", exact: true },
  { href: "/my/leave", label: "Leave", windowKey: "my-leave" },
  { href: "/my/profile", label: "About me", windowKey: "my-profile" },
  { href: "/my/availability", label: "Availability", windowKey: "my-availability" },
  { href: "/my/contracts", label: "Contracts", windowKey: "my-contracts" },
  { href: "/my/credentials", label: "Credentials", windowKey: "my-credentials" },
] as const;

export function MyWorkplaceSubnav() {
  const pathname = usePathname();
  const { session } = useAuth();
  const keys = session?.windowKeys ?? [];
  const visible = tabs.filter((tab) => canAccessWindow(keys, tab.windowKey));
  if (visible.length <= 1) return null;

  return (
    <nav className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
      {visible.map((tab) => {
        const active = "exact" in tab && tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              active
                ? "bg-[#fdf2f8] text-[#b51266] ring-1 ring-[#f9a8d4]/50"
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
