"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { clientTabGroups } from "@/lib/client";
import { useWorkspace } from "@/lib/workspace-store";

const mainLinks = [
  {
    href: "/",
    label: "Home",
    icon: "home",
    match: (path: string) => path === "/",
  },
  {
    href: "/enquiries",
    label: "Enquiries",
    icon: "enquiry",
    match: (path: string) => path.startsWith("/enquiries"),
    kind: "enquiry" as const,
  },
  {
    href: "/clients",
    label: "Clients",
    icon: "client",
    match: (path: string) => path.startsWith("/clients"),
    kind: "client" as const,
  },
];

const serviceLinks = [
  { href: "/products", label: "Products", match: (path: string) => path.startsWith("/products") },
  { href: "/price-lists", label: "Price lists", match: (path: string) => path.startsWith("/price-lists") },
  {
    href: "/service-agreements",
    label: "Service agreements",
    match: (path: string) => path.startsWith("/service-agreements"),
  },
];

const adminLinks = [
  {
    href: "/admin/reference-data",
    label: "Reference data",
    match: (path: string) => path.startsWith("/admin"),
  },
];

function NavIcon({ name }: { name: string }) {
  if (name === "home") {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    );
  }
  if (name === "enquiry") {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

export function SidebarNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { tabs } = useWorkspace();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    enquiries: true,
    clients: true,
    services: true,
    admin: false,
  });

  const clientMatch = pathname.match(/^\/clients\/([^/]+)/);
  const activeClientId = clientMatch?.[1];
  const activeClientTab = searchParams.get("tab") ?? "Overview";

  const openClients = useMemo(() => tabs.filter((t) => t.kind === "client"), [tabs]);
  const openEnquiries = useMemo(() => tabs.filter((t) => t.kind === "enquiry"), [tabs]);

  function toggleSection(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
      {mainLinks.map((link) => {
        const active = link.match(pathname);
        const sectionKey = link.kind;
        const isExpandable = Boolean(sectionKey);
        const isOpen = sectionKey ? expanded[sectionKey] !== false : false;
        const openItems = sectionKey === "client" ? openClients : sectionKey === "enquiry" ? openEnquiries : [];

        return (
          <div key={link.href}>
            <div className="flex items-center gap-0.5">
              <Link
                href={link.href}
                className={`flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-[#fdf2f8] text-[#b51266] ring-1 ring-[#f9a8d4]/60"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className={active ? "text-[#d4147a]" : "text-slate-400"}>
                  <NavIcon name={link.icon} />
                </span>
                {link.label}
              </Link>
              {isExpandable ? (
                <button
                  type="button"
                  onClick={() => toggleSection(sectionKey!)}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label={`Toggle ${link.label} menu`}
                >
                  <svg
                    className={`h-4 w-4 transition ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
              ) : null}
            </div>

            {isExpandable && isOpen ? (
              <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-200 pl-3">
                <Link
                  href={link.href}
                  className={`block rounded-md px-2 py-1.5 text-xs font-medium ${
                    pathname === link.href
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  All {link.label.toLowerCase()}
                </Link>
                {sectionKey === "client" ? (
                  <Link
                    href="/service-agreements"
                    className={`block rounded-md px-2 py-1.5 text-xs font-medium ${
                      pathname.startsWith("/service-agreements")
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    All service agreements
                  </Link>
                ) : null}

                {openItems.length > 0 ? (
                  <div className="pt-1">
                    <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Open
                    </p>
                    {openItems.map((tab) => {
                      const href =
                        tab.kind === "client"
                          ? `/clients/${tab.recordId}`
                          : `/enquiries/${tab.recordId}`;
                      const tabActive = pathname === href || pathname.startsWith(`${href}?`);
                      return (
                        <Link
                          key={tab.key}
                          href={href}
                          className={`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs ${
                            tabActive
                              ? "bg-white font-medium text-slate-900 shadow-sm ring-1 ring-slate-200"
                              : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                          }`}
                        >
                          <span className="truncate">{tab.label}</span>
                          {tab.dirty ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" /> : null}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}

                {sectionKey === "client" && activeClientId ? (
                  <div className="border-t border-slate-100 pt-2">
                    <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      This client
                    </p>
                    {clientTabGroups.flatMap((g) => g.tabs).map((tab) => {
                      const href = `/clients/${activeClientId}?tab=${encodeURIComponent(tab)}`;
                      const tabActive = activeClientTab === tab;
                      return (
                        <Link
                          key={tab}
                          href={href}
                          className={`block truncate rounded-md px-2 py-1.5 text-xs ${
                            tabActive
                              ? "bg-[#fdf2f8] font-medium text-[#b51266]"
                              : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                          }`}
                        >
                          {tab}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}

      <div className="mt-2 border-t border-slate-200 pt-3">
        <div className="flex items-center gap-0.5">
          <span className="flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600">
            <span className="text-slate-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5a1.125 1.125 0 00-1.125-1.125H3.375a1.125 1.125 0 00-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </span>
            Services
          </span>
          <button
            type="button"
            onClick={() => toggleSection("services")}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Toggle Services menu"
          >
            <svg
              className={`h-4 w-4 transition ${expanded.services !== false ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>
        {expanded.services !== false ? (
          <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-200 pl-3">
            {serviceLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block rounded-md px-2 py-1.5 text-xs font-medium ${
                  link.match(pathname)
                    ? "bg-[#fdf2f8] text-[#b51266]"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-2 border-t border-slate-200 pt-3">
        <div className="flex items-center gap-0.5">
          <span className="flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600">
            <span className="text-slate-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </span>
            Admin
          </span>
          <button
            type="button"
            onClick={() => toggleSection("admin")}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Toggle Admin menu"
          >
            <svg
              className={`h-4 w-4 transition ${expanded.admin ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>
        {expanded.admin ? (
          <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-200 pl-3">
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block rounded-md px-2 py-1.5 text-xs font-medium ${
                  link.match(pathname)
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </nav>
  );
}
