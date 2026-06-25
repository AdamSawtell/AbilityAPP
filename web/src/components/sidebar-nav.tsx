"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-store";
import { ACCESS_WINDOWS, deliverySidebarWindows, financeSidebarWindows } from "@/lib/access/catalog";
import { useData } from "@/lib/data-store";
import { incidentHomeStats } from "@/lib/incident-hub";
import { ACCESS_REPORTS } from "@/lib/reports/catalog";
import { taskCountsForSession } from "@/lib/task-access";
import { taskDashboardStats } from "@/lib/task-hub";
import { useWorkspace } from "@/lib/workspace-store";

const peopleLinks = [
  {
    href: "/employees",
    label: "Employees",
    windowKey: "employees",
    match: (path: string) => path.startsWith("/employees"),
  },
  {
    href: "/business-partners",
    label: "Business partners",
    windowKey: "business-partners",
    match: (path: string) => path.startsWith("/business-partners"),
  },
];

const myWorkplaceLinks = [
  {
    href: "/my",
    label: "My workplace",
    match: (path: string) => path.startsWith("/my"),
    canShow: (canWindow: (key: string) => boolean) => canWindow("my-workplace"),
  },
];

const workforceLinks = [
  {
    href: "/workforce-planning",
    label: "Leave calendar",
    match: (path: string) => path === "/workforce-planning",
    canShow: (canWindow: (key: string) => boolean) => canWindow("workforce-planning"),
  },
  {
    href: "/workforce-planning/organisation",
    label: "Organisation structure",
    match: (path: string) => path.startsWith("/workforce-planning/organisation"),
    canShow: (canWindow: (key: string) => boolean) =>
      canWindow("workforce-organisation") || canWindow("workforce-planning"),
  },
];

const serviceLinks = [
  { href: "/products", label: "Products", windowKey: "products", match: (path: string) => path.startsWith("/products") },
  { href: "/price-lists", label: "Price lists", windowKey: "price-lists", match: (path: string) => path.startsWith("/price-lists") },
  { href: "/contracts", label: "Contracts", windowKey: "contracts", match: (path: string) => path.startsWith("/contracts") },
];

const deliveryLinks = deliverySidebarWindows().map((w) => ({
  href: w.href!,
  label: w.label,
  windowKey: w.key,
  match: (path: string) => path === w.href || path.startsWith(`${w.href}/`),
}));

const financeLinks = financeSidebarWindows().map((w) => ({
  href: w.href!,
  label: w.label,
  windowKey: w.key,
  match: (path: string) => path === w.href || path.startsWith(`${w.href}/`),
}));

const adminLinks = ACCESS_WINDOWS.filter(
  (w) => w.group === "Admin" && w.surface !== "system" && w.showInSidebar !== false && w.href
).map((w) => ({
  href: w.href!,
  label: w.label,
  windowKey: w.key,
  match: (path: string) => path.startsWith(w.href!),
}));

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
  if (name === "client") {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.375 3.375 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    );
  }
  if (name === "incident") {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
    );
  }
  if (name === "task") {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM9 12.75 11.25 15 15 9.75"
        />
      </svg>
    );
  }
  if (name === "my-workplace") {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75V15" />
      </svg>
    );
  }
  if (name === "employee") {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    );
  }
  if (name === "workforce") {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
        />
      </svg>
    );
  }
  if (name === "location") {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>
    );
  }
  if (name === "report") {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
        />
      </svg>
    );
  }
  if (name === "help") {
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
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function SectionHeader({
  label,
  icon,
  sectionKey,
  open,
  onToggle,
  href,
  active,
  badge,
}: {
  label: string;
  icon: ReactNode;
  sectionKey: string;
  open: boolean;
  onToggle: (key: string) => void;
  href?: string;
  active?: boolean;
  badge?: number;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {href ? (
        <Link
          href={href}
          className={`flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
            active
              ? "bg-[#fdf2f8] text-[#b51266] ring-1 ring-[#f9a8d4]/60"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <span className={active ? "text-[#d4147a]" : "text-slate-400"}>{icon}</span>
          <span className="flex flex-1 items-center justify-between gap-2">
            <span>{label}</span>
            {badge && badge > 0 ? (
              <span className="rounded-full bg-[#fdf2f8] px-2 py-0.5 text-[10px] font-semibold text-[#b51266] ring-1 ring-[#f9a8d4]/50">
                {badge}
              </span>
            ) : null}
          </span>
        </Link>
      ) : (
        <span className="flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600">
          <span className="text-slate-400">{icon}</span>
          {label}
        </span>
      )}
      <button
        type="button"
        onClick={() => onToggle(sectionKey)}
        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        aria-label={`Toggle ${label} menu`}
        aria-expanded={open}
      >
        <Chevron open={open} />
      </button>
    </div>
  );
}

function TopNavLink({
  href,
  active,
  icon,
  label,
  badge,
  badgeUrgent,
}: {
  href: string;
  active: boolean;
  icon: ReactNode;
  label: string;
  badge?: number;
  badgeUrgent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-[#fdf2f8] text-[#b51266] ring-1 ring-[#f9a8d4]/60"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <span className={active ? "text-[#d4147a]" : "text-slate-400"}>{icon}</span>
      <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <span>{label}</span>
        {badge && badge > 0 ? (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
              badgeUrgent
                ? "bg-red-100 text-red-700 ring-1 ring-red-200"
                : "bg-[#fdf2f8] text-[#b51266] ring-1 ring-[#f9a8d4]/50"
            }`}
          >
            {badge}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

function sectionDividerClass(show: boolean) {
  return show ? "mt-2 border-t border-slate-200 pt-3" : "";
}

export function SidebarNav() {
  const pathname = usePathname();
  const { tabs } = useWorkspace();
  const { session, canWindow, canReport } = useAuth();
  const { tasks, incidents } = useData();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const showHome = canWindow("home");
  const taskCounts = useMemo(
    () => (session ? taskCountsForSession(tasks, session) : { assignedToMe: 0, myRole: 0, all: 0, past: 0 }),
    [tasks, session]
  );
  const showTasks =
    canWindow("tasks-assigned-to-me") ||
    canWindow("tasks-for-my-role") ||
    canWindow("tasks-all") ||
    canWindow("tasks-past");
  const taskStats = useMemo(
    () => (session ? taskDashboardStats(tasks, session) : null),
    [tasks, session]
  );
  const openTaskCount = taskCounts.assignedToMe + taskCounts.myRole;
  const taskBadge = taskStats?.overdue ? taskStats.overdue : openTaskCount > 0 ? openTaskCount : 0;
  const incidentStats = useMemo(() => incidentHomeStats(incidents), [incidents]);
  const incidentBadge = incidentStats.overdue;
  const showEnquiries = canWindow("enquiries");
  const showClients = canWindow("clients");
  const showIncidents = canWindow("incidents");
  const showLocations = canWindow("locations");
  const visiblePeopleLinks = peopleLinks.filter((l) => canWindow(l.windowKey));
  const visibleMyWorkplaceLinks = myWorkplaceLinks.filter((l) => l.canShow(canWindow));
  const visibleWorkforceLinks = workforceLinks.filter((l) => l.canShow(canWindow));
  const visibleServiceLinks = serviceLinks.filter((l) => canWindow(l.windowKey));
  const visibleDeliveryLinks = deliveryLinks.filter((l) => canWindow(l.windowKey));
  const visibleFinanceLinks = financeLinks.filter((l) => canWindow(l.windowKey));
  const visibleAdminLinks = adminLinks.filter((l) => canWindow(l.windowKey));
  const visibleReports = useMemo(() => {
    if (!session) return [];
    return ACCESS_REPORTS.filter((r) => canReport(r.id));
  }, [session, canReport]);
  const reportsByModule = useMemo(() => {
    const map = new Map<string, typeof ACCESS_REPORTS>();
    for (const report of visibleReports) {
      const list = map.get(report.moduleGroup) ?? [];
      list.push(report);
      map.set(report.moduleGroup, list);
    }
    return map;
  }, [visibleReports]);
  const showReports = canWindow("reports") && visibleReports.length > 0;
  const showMyWorkplace = visibleMyWorkplaceLinks.length > 0;
  const hasCoreNav = showHome || showMyWorkplace || showTasks;
  const hasAnyNav =
    hasCoreNav ||
    showEnquiries ||
    showClients ||
    showIncidents ||
    showLocations ||
    visiblePeopleLinks.length > 0 ||
    visibleMyWorkplaceLinks.length > 0 ||
    visibleWorkforceLinks.length > 0 ||
    visibleServiceLinks.length > 0 ||
    visibleDeliveryLinks.length > 0 ||
    visibleFinanceLinks.length > 0 ||
    showReports ||
    visibleAdminLinks.length > 0;

  const openClients = useMemo(() => tabs.filter((t) => t.kind === "client"), [tabs]);
  const openLocations = useMemo(() => tabs.filter((t) => t.kind === "location"), [tabs]);
  const openEnquiries = useMemo(() => tabs.filter((t) => t.kind === "enquiry"), [tabs]);
  const openEmployees = useMemo(() => tabs.filter((t) => t.kind === "employee"), [tabs]);

  function toggleSection(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function isOpen(key: string) {
    if (key === "admin" && pathname.startsWith("/admin")) return true;
    if (key === "enquiries" && pathname.startsWith("/enquiries")) return true;
    if (key === "clients" && (pathname.startsWith("/clients") || pathname.startsWith("/service-agreements")))
      return true;
    if (key === "locations" && pathname.startsWith("/locations")) return true;
    if (key === "people" && pathname.startsWith("/employees")) return true;
    if (key === "workforce" && pathname.startsWith("/workforce-planning")) return true;
    if (key === "incidents" && pathname.startsWith("/incidents")) return true;
    if (key === "services" && (pathname.startsWith("/products") || pathname.startsWith("/price-lists") || pathname.startsWith("/contracts"))) return true;
    if (key === "delivery" && deliveryLinks.some((l) => l.match(pathname))) return true;
    if (key === "finance" && financeLinks.some((l) => l.match(pathname))) return true;
    if (key === "reports" && pathname.startsWith("/reports")) return true;
    return expanded[key] === true;
  }

  const tasksActive =
    pathname === "/tasks" || (pathname.startsWith("/tasks") && pathname !== "/tasks/new");

  const subLinkClass = (active: boolean) =>
    `block rounded-md px-2 py-1.5 text-xs font-medium ${
      active ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
    }`;

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
      {showHome ? (
        <TopNavLink href="/" active={pathname === "/"} icon={<NavIcon name="home" />} label="Home" />
      ) : null}
      {showMyWorkplace ? (
        <div className={sectionDividerClass(showHome)}>
          {visibleMyWorkplaceLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                link.match(pathname)
                  ? "bg-[#fdf2f8] text-[#b51266] ring-1 ring-[#f9a8d4]/40"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <NavIcon name="my-workplace" />
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
      {showTasks ? (
        <div className={sectionDividerClass(showHome || showMyWorkplace)}>
          <TopNavLink
            href="/tasks"
            active={tasksActive}
            icon={<NavIcon name="task" />}
            label="Tasks"
            badge={taskBadge > 0 ? taskBadge : undefined}
            badgeUrgent={Boolean(taskStats?.overdue)}
          />
        </div>
      ) : null}

      {showEnquiries ? (
        <div className={sectionDividerClass(hasCoreNav)}>
          <SectionHeader
            label="Enquiries"
            icon={<NavIcon name="enquiry" />}
            sectionKey="enquiries"
            open={isOpen("enquiries")}
            onToggle={toggleSection}
            href="/enquiries"
            active={pathname.startsWith("/enquiries")}
          />
          {isOpen("enquiries") ? (
            <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-200 pl-3">
              <Link href="/enquiries" className={subLinkClass(pathname === "/enquiries")}>
                Active enquiries
              </Link>

              {openEnquiries.length > 0 ? (
                <div className="pt-1">
                  <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Open</p>
                  {openEnquiries.map((tab) => {
                    const href = `/enquiries/${tab.recordId}`;
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
            </div>
          ) : null}
        </div>
      ) : null}

      {showClients ? (
        <div className={sectionDividerClass(hasCoreNav || showEnquiries)}>
          <SectionHeader
            label="Clients"
            icon={<NavIcon name="client" />}
            sectionKey="clients"
            open={isOpen("clients")}
            onToggle={toggleSection}
            href="/clients"
            active={pathname.startsWith("/clients")}
          />
          {isOpen("clients") ? (
            <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-200 pl-3">
              <Link href="/clients" className={subLinkClass(pathname === "/clients")}>
                All clients
              </Link>
              {canWindow("service-agreements") ? (
                <Link
                  href="/service-agreements"
                  className={subLinkClass(pathname.startsWith("/service-agreements"))}
                >
                  All service agreements
                </Link>
              ) : null}

              {openClients.length > 0 ? (
                <div className="pt-1">
                  <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Open clients</p>
                  {openClients.map((tab) => {
                    const href = `/clients/${tab.recordId}`;
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
            </div>
          ) : null}
        </div>
      ) : null}

      {showLocations ? (
        <div
          className={sectionDividerClass(
            hasCoreNav || showEnquiries || showClients
          )}
        >
          <SectionHeader
            label="Locations"
            icon={<NavIcon name="location" />}
            sectionKey="locations"
            open={isOpen("locations")}
            onToggle={toggleSection}
            href="/locations"
            active={pathname.startsWith("/locations")}
          />
          {isOpen("locations") ? (
            <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-200 pl-3">
              <Link href="/locations" className={subLinkClass(pathname === "/locations")}>
                All locations
              </Link>
              {openLocations.length > 0 ? (
                <div className="pt-1">
                  <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Open</p>
                  {openLocations.map((tab) => {
                    const href = `/locations/${tab.recordId}`;
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
            </div>
          ) : null}
        </div>
      ) : null}

      {visiblePeopleLinks.length > 0 ? (
        <div
          className={sectionDividerClass(
            hasCoreNav || showEnquiries || showClients || showLocations
          )}
        >
          <SectionHeader
            label="People"
            icon={<NavIcon name="employee" />}
            sectionKey="people"
            open={isOpen("people")}
            onToggle={toggleSection}
          />
          {isOpen("people") ? (
            <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-200 pl-3">
              {visiblePeopleLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block rounded-md px-2 py-1.5 text-xs font-medium ${
                    link.match(pathname)
                      ? "bg-indigo-50 text-indigo-900 ring-1 ring-indigo-200/60"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {openEmployees.length > 0 ? (
                <div className="pt-1">
                  <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Open</p>
                  {openEmployees.map((tab) => {
                    const href = `/employees/${tab.recordId}`;
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
            </div>
          ) : null}
        </div>
      ) : null}

      {visibleWorkforceLinks.length > 0 ? (
        <div
          className={sectionDividerClass(
            hasCoreNav || showEnquiries || showClients || showLocations || visiblePeopleLinks.length > 0
          )}
        >
          <SectionHeader
            label="Workforce planning"
            icon={<NavIcon name="workforce" />}
            sectionKey="workforce"
            open={isOpen("workforce")}
            onToggle={toggleSection}
            href={visibleWorkforceLinks[0]?.href ?? "/workforce-planning"}
            active={pathname.startsWith("/workforce-planning")}
          />
          {isOpen("workforce") ? (
            <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-200 pl-3">
              {visibleWorkforceLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block rounded-md px-2 py-1.5 text-xs font-medium ${
                    link.match(pathname)
                      ? "bg-indigo-50 text-indigo-900 ring-1 ring-indigo-200/60"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {showIncidents ? (
        <div
          className={sectionDividerClass(
            hasCoreNav ||
              showEnquiries ||
              showClients ||
              showLocations ||
              visiblePeopleLinks.length > 0 ||
              visibleWorkforceLinks.length > 0
          )}
        >
          <SectionHeader
            label="Incident reports"
            icon={<NavIcon name="incident" />}
            sectionKey="incidents"
            open={isOpen("incidents")}
            onToggle={toggleSection}
            href="/incidents"
            active={pathname.startsWith("/incidents")}
            badge={incidentBadge > 0 ? incidentBadge : undefined}
          />
          {isOpen("incidents") ? (
            <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-200 pl-3">
              <Link href="/incidents" className={subLinkClass(pathname === "/incidents")}>
                All incidents
              </Link>
              {canWindow("incidents-dashboard") ? (
                <Link
                  href="/incidents/dashboard"
                  className={subLinkClass(pathname.startsWith("/incidents/dashboard"))}
                >
                  Dashboard & analytics
                </Link>
              ) : null}
              {canWindow("incidents-compliance") ? (
                <Link
                  href="/incidents/compliance"
                  className={subLinkClass(pathname.startsWith("/incidents/compliance"))}
                >
                  NDIS compliance
                  {incidentBadge > 0 ? ` (${incidentBadge} overdue)` : ""}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {visibleServiceLinks.length > 0 ? (
        <div
          className={sectionDividerClass(
            hasCoreNav ||
              showEnquiries ||
              showClients ||
              showLocations ||
              visiblePeopleLinks.length > 0 ||
              showIncidents
          )}
        >
          <SectionHeader
            label="Services"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5a1.125 1.125 0 00-1.125-1.125H3.375a1.125 1.125 0 00-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                />
              </svg>
            }
            sectionKey="services"
            open={isOpen("services")}
            onToggle={toggleSection}
          />
          {isOpen("services") ? (
            <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-200 pl-3">
              {visibleServiceLinks.map((link) => (
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
      ) : null}

      {visibleDeliveryLinks.length > 0 ? (
        <div
          className={sectionDividerClass(
            hasCoreNav ||
              showEnquiries ||
              showClients ||
              showLocations ||
              visiblePeopleLinks.length > 0 ||
              showIncidents ||
              visibleServiceLinks.length > 0
          )}
        >
          <SectionHeader
            label="Service delivery"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                />
              </svg>
            }
            sectionKey="delivery"
            open={isOpen("delivery")}
            onToggle={toggleSection}
            href={visibleDeliveryLinks[0]?.href ?? "/service-bookings"}
            active={visibleDeliveryLinks.some((l) => l.match(pathname))}
          />
          {isOpen("delivery") ? (
            <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-200 pl-3">
              {visibleDeliveryLinks.map((link) => (
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
      ) : null}

      {visibleFinanceLinks.length > 0 ? (
        <div
          className={sectionDividerClass(
            hasCoreNav ||
              showEnquiries ||
              showClients ||
              showLocations ||
              visiblePeopleLinks.length > 0 ||
              showIncidents ||
              visibleServiceLinks.length > 0 ||
              visibleDeliveryLinks.length > 0
          )}
        >
          <SectionHeader
            label="Finance"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125h17.25c.621 0 1.125.504 1.125 1.125V6m-19.5 0h19.5m0 0v.75a.75.75 0 0 1-.75.75h-.75m-16.5 0h16.5m-16.5 0A2.25 2.25 0 0 0 6 9.75v6A2.25 2.25 0 0 0 8.25 18h7.5A2.25 2.25 0 0 0 18 15.75v-6A2.25 2.25 0 0 0 15.75 7.5m-7.5 0v.75A2.25 2.25 0 0 0 10.5 10.5h3A2.25 2.25 0 0 0 15.75 8.25V7.5"
                />
              </svg>
            }
            sectionKey="finance"
            open={isOpen("finance")}
            onToggle={toggleSection}
            href={visibleFinanceLinks[0]?.href ?? "/claims"}
            active={visibleFinanceLinks.some((l) => l.match(pathname))}
          />
          {isOpen("finance") ? (
            <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-200 pl-3">
              {visibleFinanceLinks.map((link) => (
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
      ) : null}

      {showReports ? (
        <div
          className={sectionDividerClass(
            hasCoreNav ||
              showEnquiries ||
              showClients ||
              showLocations ||
              visiblePeopleLinks.length > 0 ||
              visibleServiceLinks.length > 0 ||
              visibleDeliveryLinks.length > 0 ||
              visibleFinanceLinks.length > 0 ||
              showIncidents
          )}
        >
          <SectionHeader
            label="Reports"
            icon={<NavIcon name="report" />}
            sectionKey="reports"
            open={isOpen("reports")}
            onToggle={toggleSection}
            href="/reports"
            active={pathname.startsWith("/reports")}
          />
          {isOpen("reports") ? (
            <div className="ml-4 mt-1 space-y-2 border-l border-slate-200 pl-3">
              <Link href="/reports" className={subLinkClass(pathname === "/reports")}>
                All reports
              </Link>
              {(["Core", "Clients", "Enquiries", "Locations", "People", "Services"] as const).map((module) => {
                const moduleReports = reportsByModule.get(module);
                if (!moduleReports?.length) return null;
                return (
                  <div key={module}>
                    <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {module}
                    </p>
                    {moduleReports.map((report) => {
                      const href = `/reports/${report.id}`;
                      return (
                        <Link
                          key={report.id}
                          href={href}
                          className={`block rounded-md px-2 py-1.5 text-xs font-medium ${
                            pathname === href
                              ? "bg-[#fdf2f8] text-[#b51266] ring-1 ring-[#f9a8d4]/50"
                              : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                          }`}
                        >
                          {report.label}
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
      {visibleAdminLinks.length > 0 ? (
        <div
          className={sectionDividerClass(
            hasCoreNav ||
              showEnquiries ||
              showClients ||
              showLocations ||
              visiblePeopleLinks.length > 0 ||
              visibleServiceLinks.length > 0 ||
              visibleDeliveryLinks.length > 0 ||
              visibleFinanceLinks.length > 0 ||
              showReports
          )}
        >
          <SectionHeader
            label="Admin"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            }
            sectionKey="admin"
            open={isOpen("admin")}
            onToggle={toggleSection}
          />
          {isOpen("admin") ? (
            <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-200 pl-3">
              {visibleAdminLinks.map((link) => (
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
      ) : null}

      <div className={`mt-auto ${sectionDividerClass(hasAnyNav)}`}>
        <TopNavLink
          href="/help"
          active={pathname.startsWith("/help")}
          icon={<NavIcon name="help" />}
          label="How-to guide"
        />
      </div>
    </nav>
  );
}
