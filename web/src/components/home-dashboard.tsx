"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { HomeCalendar } from "@/components/home-calendar";
import { HomeAiChat } from "@/components/home-ai-chat";
import { IncidentQuickReportDialog } from "@/components/incident-quick-report";
import { ClientRecordLink, EnquiryRecordLink } from "@/components/record-link";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { formatDisplayDateTime, isNdisReportOverdue } from "@/lib/incident";
import { incidentHomeStats, recentIncidents } from "@/lib/incident-hub";
import { taskCountsForSession, visibleTaskViews } from "@/lib/task-access";
import { taskDashboardStats } from "@/lib/task-hub";

function SummaryCard({
  title,
  count,
  description,
  href,
  accent,
}: {
  title: string;
  count: number;
  description: string;
  href: string;
  accent: "pink" | "emerald" | "indigo";
}) {
  const styles =
    accent === "pink"
      ? "from-[#d4147a]/10 to-[#fdf2f8] ring-[#f9a8d4]/50 hover:ring-[#d4147a]/40"
      : accent === "indigo"
        ? "from-indigo-500/10 to-indigo-50 ring-indigo-200/60 hover:ring-indigo-300"
        : "from-emerald-500/10 to-emerald-50 ring-emerald-200/60 hover:ring-emerald-300";

  return (
    <Link
      href={href}
      className={`group rounded-2xl bg-gradient-to-br p-6 shadow-sm ring-1 transition hover:shadow-md ${styles}`}
    >
      <p className="text-sm font-medium text-slate-600">{title}</p>
      <p className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">{count}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#b51266] transition-all group-hover:gap-2">
        View all
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </span>
    </Link>
  );
}

export function HomeDashboard() {
  const { enquiries, clients, employees, tasks, incidents } = useData();
  const { canWindow, canProcess, session, users } = useAuth();
  const router = useRouter();
  const [reportOpen, setReportOpen] = useState(false);
  const showEmployees = canWindow("employees");
  const canReportIncident = canProcess("report-incident") || canWindow("incidents");
  const showIncidents = canWindow("incidents");
  const taskViews = session ? visibleTaskViews(session.windowKeys) : [];
  const taskCounts = session ? taskCountsForSession(tasks, session) : null;
  const taskStats = session ? taskDashboardStats(tasks, session) : null;
  const showTasks = taskViews.length > 0;
  const openTaskCount = taskCounts ? taskCounts.assignedToMe + taskCounts.myRole : 0;

  const openEnquiries = useMemo(
    () => enquiries.filter((e) => !e.status.startsWith("5_")).length,
    [enquiries]
  );

  const convertedCount = useMemo(
    () => enquiries.filter((e) => e.status.startsWith("4_")).length,
    [enquiries]
  );

  const recentEnquiries = useMemo(() => enquiries.slice(0, 5), [enquiries]);
  const recentClients = useMemo(() => clients.slice(0, 5), [clients]);
  const incidentStats = useMemo(() => incidentHomeStats(incidents), [incidents]);
  const overdueIncidents = useMemo(
    () => incidents.filter((i) => i.isReportable && isNdisReportOverdue(i)),
    [incidents]
  );
  const latestIncidents = useMemo(() => recentIncidents(incidents, 5), [incidents]);

  const reporterEmployeeId = useMemo(() => {
    if (!session) return "";
    const user = users.find((u) => u.id === session.userId);
    return user?.employeeBpId ?? "";
  }, [session, users]);

  return (
    <AppShell
      title="Home"
      subtitle={`Welcome back${session?.displayName ? `, ${session.displayName}` : ""}. Pick up where you left off.`}
      audit={{ moduleLabel: "Home dashboard" }}
    >
      <div className="mb-8 flex flex-wrap gap-3">
        {canReportIncident ? (
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-amber-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
            Report incident
          </button>
        ) : null}
        <Link
          href="/enquiries/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[#d4147a] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
        >
          <span aria-hidden>+</span> New enquiry
        </Link>
        <Link
          href="/enquiries"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Browse enquiries
        </Link>
        <Link
          href="/clients"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Browse clients
        </Link>
        {showEmployees ? (
          <Link
            href="/employees"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Browse employees
          </Link>
        ) : null}
        {showIncidents ? (
          <Link
            href="/incidents"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Incident reports
            {incidentStats.overdue > 0 ? ` (${incidentStats.overdue} overdue)` : ""}
          </Link>
        ) : null}
        {showTasks ? (
          <Link
            href="/tasks"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Tasks
            {taskStats?.overdue
              ? ` (${taskStats.overdue} overdue)`
              : openTaskCount > 0
                ? ` (${openTaskCount})`
                : ""}
          </Link>
        ) : null}
      </div>

      {showIncidents && overdueIncidents.length > 0 ? (
        <div className="mb-8 rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-5 shadow-sm ring-1 ring-rose-200/60">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-rose-900">NDIS reporting overdue</p>
              <p className="mt-1 text-sm text-rose-800/90">
                {overdueIncidents.length} reportable incident{overdueIncidents.length === 1 ? "" : "s"} need
                Commission notification.
              </p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {overdueIncidents.slice(0, 3).map((incident) => (
                  <li key={incident.id}>
                    <Link href={`/incidents/${incident.id}`} className="font-medium text-rose-900 hover:underline">
                      {incident.documentNo}
                      {incident.title ? ` — ${incident.title}` : ""}
                    </Link>
                    {incident.reportDeadlineAt ? (
                      <span className="text-rose-700/80"> · due {formatDisplayDateTime(incident.reportDeadlineAt)}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/incidents/compliance"
              className="shrink-0 rounded-lg bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800"
            >
              NDIS compliance
            </Link>
          </div>
        </div>
      ) : null}

      {showTasks && taskCounts && taskStats ? (
        <div className="mb-8">
          <Link
            href="/tasks"
            className="group block overflow-hidden rounded-2xl bg-gradient-to-br from-[#d4147a]/10 via-[#fdf2f8] to-white p-6 shadow-sm ring-1 ring-[#f9a8d4]/50 transition hover:shadow-md hover:ring-[#d4147a]/40"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-600">Your tasks</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                  {openTaskCount} open
                  {taskStats.overdue > 0 ? (
                    <span className="ml-3 text-lg font-semibold text-red-700">{taskStats.overdue} overdue</span>
                  ) : null}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {taskCounts.assignedToMe} assigned to you · {taskCounts.myRole} for {session?.activeRoleName ?? "your role"}
                  {taskStats.dueToday > 0 ? ` · ${taskStats.dueToday} due today` : ""}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-[#b51266] transition-all group-hover:gap-2">
                Open task hub
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </div>
          </Link>
        </div>
      ) : null}

      {session ? (
        <HomeAiChat />
      ) : null}

      {session ? (
        <HomeCalendar tasks={tasks} session={session} users={users} employees={employees} />
      ) : null}

      <div className={`grid gap-6 ${showEmployees && showIncidents ? "lg:grid-cols-4" : showEmployees || showIncidents ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
        <SummaryCard
          title="Enquiries"
          count={enquiries.length}
          description={`${openEnquiries} open · ${convertedCount} converted`}
          href="/enquiries"
          accent="pink"
        />
        <SummaryCard
          title="Clients"
          count={clients.length}
          description="People receiving support"
          href="/clients"
          accent="emerald"
        />
        {showIncidents ? (
          <SummaryCard
            title="Incidents"
            count={incidentStats.total}
            description={
              incidentStats.overdue > 0
                ? `${incidentStats.open} open · ${incidentStats.overdue} overdue`
                : `${incidentStats.open} open · ${incidentStats.reportableOpen} reportable`
            }
            href="/incidents"
            accent="pink"
          />
        ) : null}
        {showEmployees ? (
          <SummaryCard
            title="Employees"
            count={employees.length}
            description="Staff and contractors"
            href="/employees"
            accent="indigo"
          />
        ) : null}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Recent enquiries</h2>
            <Link href="/enquiries" className="text-sm font-medium text-[#b51266] hover:underline">
              All enquiries
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentEnquiries.length ? (
              recentEnquiries.map((e) => (
                <EnquiryRecordLink
                  key={e.id}
                  id={e.id}
                  documentNo={e.documentNo}
                  name={`${e.firstName} ${e.lastName}`.trim()}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-[#fdf2f8]/50"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">
                      {e.firstName} {e.lastName}
                    </p>
                    <p className="text-sm text-slate-500">{e.documentNo}</p>
                  </div>
                  <StatusBadge status={e.status} />
                </EnquiryRecordLink>
              ))
            ) : (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-slate-500">No enquiries yet.</p>
                <Link href="/enquiries/new" className="mt-2 inline-block text-sm font-medium text-[#b51266] hover:underline">
                  Create your first enquiry
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Recent clients</h2>
            <Link href="/clients" className="text-sm font-medium text-[#b51266] hover:underline">
              All clients
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentClients.length ? (
              recentClients.map((c) => (
                <ClientRecordLink
                  key={c.id}
                  id={c.id}
                  searchKey={c.searchKey}
                  name={c.name}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-emerald-50/50"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{c.name}</p>
                    <p className="text-sm text-slate-500">{c.searchKey}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200 ring-inset">
                    {c.status.replace(/^\d+_/, "").replace(/_/g, " ")}
                  </span>
                </ClientRecordLink>
              ))
            ) : (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-slate-500">No clients yet.</p>
                <p className="mt-2 text-sm text-slate-500">Convert an enquiry to create a client record.</p>
              </div>
            )}
          </div>
        </section>

        {showIncidents ? (
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold text-slate-900">Recent incidents</h2>
              <div className="flex items-center gap-3">
                {canReportIncident ? (
                  <button
                    type="button"
                    onClick={() => setReportOpen(true)}
                    className="text-sm font-medium text-amber-800 hover:underline"
                  >
                    Report incident
                  </button>
                ) : null}
                <Link href="/incidents" className="text-sm font-medium text-[#b51266] hover:underline">
                  All incidents
                </Link>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {latestIncidents.length ? (
                latestIncidents.map((incident) => (
                  <Link
                    key={incident.id}
                    href={`/incidents/${incident.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-amber-50/40"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{incident.title || incident.documentNo}</p>
                      <p className="text-sm text-slate-500">
                        {incident.documentNo}
                        {incident.isReportable ? " · NDIS reportable" : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-slate-600">{incident.status}</span>
                  </Link>
                ))
              ) : (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-slate-500">No incidents recorded yet.</p>
                  {canReportIncident ? (
                    <button
                      type="button"
                      onClick={() => setReportOpen(true)}
                      className="mt-2 text-sm font-medium text-amber-800 hover:underline"
                    >
                      Report your first incident
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          </section>
        ) : null}
      </div>

      {canReportIncident ? (
        <IncidentQuickReportDialog
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          onSubmitted={(id) => router.push(`/incidents/${id}?submitted=1`)}
          initialEmployeeId={reporterEmployeeId}
          reporterName={session?.displayName ?? ""}
        />
      ) : null}
    </AppShell>
  );
}
