"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
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
];

const serviceLinks = [
  { href: "/products", label: "Products", windowKey: "products", match: (path: string) => path.startsWith("/products") },
  { href: "/price-lists", label: "Price lists", windowKey: "price-lists", match: (path: string) => path.startsWith("/price-lists") },
];

const adminLinks = [
  {
    href: "/admin/reference-data",
    label: "Reference data",
    windowKey: "admin-reference-data",
    match: (path: string) => path.startsWith("/admin/reference-data"),
  },
  {
    href: "/admin/users",
    label: "Users",
    windowKey: "admin-users",
    match: (path: string) => path.startsWith("/admin/users"),
  },
  {
    href: "/admin/roles",
    label: "Roles",
    windowKey: "admin-roles",
    match: (path: string) => path.startsWith("/admin/roles"),
  },
  {
    href: "/admin/task-management",
    label: "Task management",
    windowKey: "admin-task-management",
    match: (path: string) => path.startsWith("/admin/task-management"),
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
  if (name === "employee") {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
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

export function SidebarNav() {
  const pathname = usePathname();
  const { tabs } = useWorkspace();
  const { session, canWindow } = useAuth();
  const { tasks } = useData();
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
  const showEnquiries = canWindow("enquiries");
  const showClients = canWindow("clients");
  const visiblePeopleLinks = peopleLinks.filter((l) => canWindow(l.windowKey));
  const visibleServiceLinks = serviceLinks.filter((l) => canWindow(l.windowKey));
  const visibleAdminLinks = adminLinks.filter((l) => canWindow(l.windowKey));

  const openClients = useMemo(() => tabs.filter((t) => t.kind === "client"), [tabs]);
  const openEnquiries = useMemo(() => tabs.filter((t) => t.kind === "enquiry"), [tabs]);
  const openEmployees = useMemo(() => tabs.filter((t) => t.kind === "employee"), [tabs]);

  function toggleSection(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function isOpen(key: string) {
    if (key === "admin" && pathname.startsWith("/admin")) return true;
    return expanded[key] === true;
  }

  const subLinkClass = (active: boolean) =>
    `block rounded-md px-2 py-1.5 text-xs font-medium ${
      active ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
    }`;

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
      {showHome ? (
        <Link
          href="/"
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
            pathname === "/"
              ? "bg-[#fdf2f8] text-[#b51266] ring-1 ring-[#f9a8d4]/60"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <span className={pathname === "/" ? "text-[#d4147a]" : "text-slate-400"}>
            <NavIcon name="home" />
          </span>
          Home
        </Link>
      ) : null}

      {showTasks ? (
        <Link
          href="/tasks"
          className={`mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
            pathname === "/tasks" || (pathname.startsWith("/tasks") && pathname !== "/tasks/new")
              ? "bg-[#fdf2f8] text-[#b51266]"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <span className={pathname.startsWith("/tasks") ? "text-[#d4147a]" : "text-slate-400"}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c1.07.013 2.008.714 2.007 1.64v6.694a2.25 2.25 0 0 1-2.25 2.25h-1.5m-6.75 0H4.5A2.25 2.25 0 0 1 2.25 12v-1.5m16.5 0H21m-3.75 0H21m-9.75 0H9"
              />
            </svg>
          </span>
          Tasks
          {taskBadge > 0 ? (
            <span
              className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${
                taskStats?.overdue
                  ? "bg-red-100 text-red-700 ring-1 ring-red-200"
                  : "bg-[#fdf2f8] text-[#b51266] ring-1 ring-[#f9a8d4]/50"
              }`}
            >
              {taskBadge}
            </span>
          ) : null}
        </Link>
      ) : null}

      {showEnquiries ? (
        <div className={showHome || showTasks ? "mt-2 border-t border-slate-200 pt-3" : ""}>
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
        <div className="mt-2 border-t border-slate-200 pt-3">
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
                  <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Open</p>
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

      {visiblePeopleLinks.length > 0 ? (
        <div className="mt-2 border-t border-slate-200 pt-3">
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

      {visibleServiceLinks.length > 0 ? (
        <div className="mt-2 border-t border-slate-200 pt-3">
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

      {visibleAdminLinks.length > 0 ? (
        <div className="mt-2 border-t border-slate-200 pt-3">
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
    </nav>
  );
}
