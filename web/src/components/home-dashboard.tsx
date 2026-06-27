"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/app-shell";
import { HomeCalendar } from "@/components/home-calendar";
import { HomeCollapsibleSection } from "@/components/home-collapsible-section";
import { IncidentQuickReportDialog } from "@/components/incident-quick-report";
import { ClientRecordLink, EnquiryRecordLink } from "@/components/record-link";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { useAiChatShell } from "@/lib/ai/chat-shell-store";
import { queueChatPrompt } from "@/lib/ai/chat-session-storage";
import { resolvePageChatContext } from "@/lib/ai/page-chat-context";
import { buildHomeBriefing, type HomeAttentionItem } from "@/lib/home-briefing";
import { isNdisReportOverdue } from "@/lib/incident";
import { incidentHomeStats, recentIncidents } from "@/lib/incident-hub";
import { taskCountsForSession, visibleTaskViews } from "@/lib/task-access";
import { taskDashboardStats } from "@/lib/task-hub";
import type { MyWorkplaceSummary } from "@/lib/my-workplace/types";
import type { MyActionItem } from "@/lib/my-workplace/compliance-dashboard";
import type { WorkforceReviewSummary } from "@/lib/workforce/review-queue";
import {
  buildTimesheetApprovalSummary,
  canApproveTimesheet,
  defaultTimesheetApprovalScope,
  seesAllTimesheetApprovals,
  timesheetApprovalHref,
} from "@/lib/workforce/timesheet-approval-queue";

function attentionStyles(severity: HomeAttentionItem["severity"]) {
  if (severity === "critical") return "border-rose-200 bg-rose-50/80 hover:bg-rose-50";
  if (severity === "warning") return "border-amber-200 bg-amber-50/80 hover:bg-amber-50";
  return "border-slate-200 bg-slate-50/80 hover:bg-slate-50";
}

function CompactStat({
  title,
  count,
  hint,
  href,
}: {
  title: string;
  count: number;
  hint: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-w-[8.5rem] flex-1 flex-col rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-[#f9a8d4]/60 hover:shadow-md"
    >
      <p className="text-xs font-medium text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{count}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </Link>
  );
}

function HomeQuickActions({
  canReportIncident,
  canNewEnquiry,
  showEmployees,
  showIncidents,
  showTasks,
  showMyWorkplace,
  showEnquiriesBrowse,
  incidentOverdue,
  openTaskCount,
  myAttentionCount,
  onReportIncident,
}: {
  canReportIncident: boolean;
  canNewEnquiry: boolean;
  showEmployees: boolean;
  showIncidents: boolean;
  showTasks: boolean;
  showMyWorkplace: boolean;
  showEnquiriesBrowse: boolean;
  incidentOverdue: number;
  openTaskCount: number;
  myAttentionCount: number;
  onReportIncident: () => void;
}) {
  const [open, setOpen] = useState(false);

  const links = [
    ...(showEnquiriesBrowse ? [{ href: "/enquiries", label: "Browse enquiries" }] : []),
    { href: "/clients", label: "Browse clients" },
    ...(showEmployees ? [{ href: "/employees", label: "Browse employees" }] : []),
    ...(showIncidents
      ? [{ href: "/incidents", label: incidentOverdue > 0 ? `Incidents (${incidentOverdue} overdue)` : "Incidents" }]
      : []),
    ...(showTasks ? [{ href: "/tasks", label: openTaskCount > 0 ? `Tasks (${openTaskCount})` : "Tasks" }] : []),
    ...(showMyWorkplace
      ? [{ href: "/my", label: myAttentionCount > 0 ? `My workplace (${myAttentionCount})` : "My workplace" }]
      : []),
    { href: "/help", label: "How-to guide" },
  ];

  return (
    <div className="relative flex flex-wrap items-center gap-2">
      {canReportIncident ? (
        <button
          type="button"
          onClick={onReportIncident}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700"
        >
          Report incident
        </button>
      ) : null}
      {canNewEnquiry ? (
        <Link
          href="/enquiries/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
        >
          New enquiry
        </Link>
      ) : null}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          aria-expanded={open}
        >
          More actions
          <svg className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {open ? (
          <>
            <button type="button" className="fixed inset-0 z-10 cursor-default" aria-label="Close menu" onClick={() => setOpen(false)} />
            <div className="absolute left-0 z-20 mt-1 min-w-[12rem] rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function HomePromptHero({
  summaryLine,
  suggestions,
  onAsk,
}: {
  summaryLine: string;
  suggestions: string[];
  onAsk: (text: string) => void;
}) {
  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-[#f9a8d4]/40 bg-gradient-to-br from-[#fdf2f8] via-white to-slate-50 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#b51266]">Assistant first</p>
          <p className="mt-2 text-base text-slate-800">{summaryLine}</p>
          <p className="mt-2 text-sm text-slate-500">
            Use the sidebar assistant to search, prepare records, and coach activity notes. Pick a prompt to start.
          </p>
        </div>
        <p className="shrink-0 rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-500">
          Ctrl+\ toggles the assistant panel
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onAsk(suggestion)}
            className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-700 shadow-sm transition hover:border-[#f9a8d4] hover:bg-[#fdf2f8] hover:text-[#b51266]"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </section>
  );
}

export function HomeDashboard() {
  const { enquiries, clients, employees, tasks, incidents, timesheets, rosterShifts, allRosterShifts, rosterShiftRequests, locations } = useData();
  const { canWindow, canProcess, canHomePanel, session, users } = useAuth();
  const { setCollapsed } = useAiChatShell();
  const router = useRouter();
  const [reportOpen, setReportOpen] = useState(false);

  const showEmployees = canWindow("employees");
  const canReportIncident = canProcess("report-incident") || canWindow("incidents");
  const showIncidents = canWindow("incidents");
  const taskViews = session ? visibleTaskViews(session.windowKeys) : [];
  const taskCounts = session ? taskCountsForSession(tasks, session) : null;
  const taskStats = session ? taskDashboardStats(tasks, session) : null;
  const showTasks = taskViews.length > 0;
  const showMyWorkplace = canWindow("my-workplace");
  const showWorkforceReviews =
    canWindow("workforce-planning") && (canProcess("review-employee-credential") || canProcess("approve-leave-request"));
  const showTimesheetApprovals = canWindow("timesheet-approval") && canProcess("approve-timesheet");
  const openTaskCount = taskCounts ? taskCounts.assignedToMe + taskCounts.myRole : 0;

  const [mySummary, setMySummary] = useState<MyWorkplaceSummary | null>(null);
  const [myActionItems, setMyActionItems] = useState<MyActionItem[]>([]);
  const [reviewSummary, setReviewSummary] = useState<WorkforceReviewSummary | null>(null);

  useEffect(() => {
    if (!showMyWorkplace) return;
    void fetch("/api/my", { credentials: "include" })
      .then(async (res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.summary) setMySummary(data.summary as MyWorkplaceSummary);
        if (data?.actionItems) setMyActionItems(data.actionItems as MyActionItem[]);
      })
      .catch(() => undefined);
  }, [showMyWorkplace]);

  useEffect(() => {
    if (!showWorkforceReviews) return;
    void fetch("/api/workforce/reviews", { credentials: "include" })
      .then(async (res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.summary) setReviewSummary(data.summary as WorkforceReviewSummary);
      })
      .catch(() => undefined);
  }, [showWorkforceReviews]);

  const myAttentionCount = mySummary?.actionItemsCount ?? 0;
  const overdueIncidents = useMemo(
    () => incidents.filter((i) => i.isReportable && isNdisReportOverdue(i)),
    [incidents]
  );
  const incidentStats = useMemo(() => incidentHomeStats(incidents), [incidents]);
  const openEnquiries = useMemo(() => enquiries.filter((e) => !e.status.startsWith("5_")).length, [enquiries]);
  const convertedCount = useMemo(() => enquiries.filter((e) => e.status.startsWith("4_")).length, [enquiries]);
  const recentEnquiries = useMemo(() => enquiries.slice(0, 5), [enquiries]);
  const recentClients = useMemo(() => clients.slice(0, 5), [clients]);
  const latestIncidents = useMemo(() => recentIncidents(incidents, 5), [incidents]);

  const pageCtx = useMemo(
    () => resolvePageChatContext("/", { clients, enquiries, tasks, incidents }),
    [clients, enquiries, tasks, incidents]
  );

  const timesheetApprovalSummary = useMemo(() => {
    if (!showTimesheetApprovals || !session || !canApproveTimesheet(session)) return null;
    const reviewerEmployeeId =
      session.employeeBpId?.trim() || users.find((u) => u.id === session.userId)?.employeeBpId?.trim() || null;
    const scope = defaultTimesheetApprovalScope(session, reviewerEmployeeId);
    const counts = buildTimesheetApprovalSummary(
      {
        timesheets,
        employees,
        rosterShifts,
        locations,
        reviewerEmployeeId,
        seesAll: seesAllTimesheetApprovals(session),
      },
      scope
    );
    return {
      ...counts,
      href: timesheetApprovalHref(session, reviewerEmployeeId),
    };
  }, [showTimesheetApprovals, session, users, timesheets, employees, rosterShifts, locations]);

  const briefing = useMemo(
    () =>
      buildHomeBriefing({
        session,
        showTasks,
        showMyWorkplace,
        showWorkforceReviews,
        showIncidents,
        openTaskCount,
        taskStats,
        myActionItems,
        reviewSummary,
        timesheetApprovalSummary,
        overdueIncidents,
      }),
    [
      session,
      showTasks,
      showMyWorkplace,
      showWorkforceReviews,
      showIncidents,
      openTaskCount,
      taskStats,
      myActionItems,
      reviewSummary,
      timesheetApprovalSummary,
      overdueIncidents,
    ]
  );

  const askAssistant = useCallback(
    (text: string) => {
      if (!session) return;
      setCollapsed(false);
      queueChatPrompt(session.userId, session.activeRoleId, text, true);
    },
    [session, setCollapsed]
  );

  const reporterEmployeeId = useMemo(() => {
    if (!session) return "";
    const user = users.find((u) => u.id === session.userId);
    return user?.employeeBpId ?? "";
  }, [session, users]);

  const showPrompt = canHomePanel("home-prompt");
  const showNeedsAttention = canHomePanel("home-needs-attention");
  const showToday = canHomePanel("home-today");
  const showModuleEnquiries = canHomePanel("home-module-enquiries");
  const showModuleClients = canHomePanel("home-module-clients");
  const showModuleIncidents = canHomePanel("home-module-incidents");
  const showModuleEmployees = canHomePanel("home-module-employees");
  const showRecentEnquiries = canHomePanel("home-recent-enquiries");
  const showRecentClients = canHomePanel("home-recent-clients");
  const showRecentIncidents = canHomePanel("home-recent-incidents");
  const showModulesSection =
    showModuleEnquiries || showModuleClients || showModuleIncidents || showModuleEmployees;
  const showRecentSection = showRecentEnquiries || showRecentClients || showRecentIncidents;
  const canNewEnquiry = canHomePanel("home-quick-new-enquiry");
  const canQuickReport = canHomePanel("home-quick-report-incident") && canReportIncident;

  const attentionDefaultOpen = briefing.attentionItems.length > 0;

  return (
    <AppShell
      title="Home"
      subtitle={`Welcome back${session?.displayName ? `, ${session.displayName}` : ""}`}
      audit={{ moduleLabel: "Home dashboard" }}
      actions={
        <HomeQuickActions
          canReportIncident={canQuickReport}
          canNewEnquiry={canNewEnquiry}
          showEmployees={showEmployees}
          showIncidents={showIncidents}
          showTasks={showTasks}
          showMyWorkplace={showMyWorkplace}
          showEnquiriesBrowse={canWindow("enquiries")}
          incidentOverdue={incidentStats.overdue}
          openTaskCount={openTaskCount}
          myAttentionCount={myAttentionCount}
          onReportIncident={() => setReportOpen(true)}
        />
      }
    >
      {showPrompt ? (
        <HomePromptHero summaryLine={briefing.summaryLine} suggestions={pageCtx.suggestions} onAsk={askAssistant} />
      ) : (
        <p className="mb-6 text-sm text-slate-600">{briefing.summaryLine}</p>
      )}

      <div className="space-y-4">
        {showNeedsAttention ? (
        <HomeCollapsibleSection
          sectionId="needs-attention"
          title="Needs attention"
          subtitle="Compliance, tasks, and workplace items in one place"
          defaultOpen={attentionDefaultOpen}
          badge={briefing.attentionItems.length || undefined}
        >
          {briefing.attentionItems.length ? (
            <ul className="space-y-2">
              {briefing.attentionItems.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className={`block rounded-xl border px-4 py-3 transition ${attentionStyles(item.severity)}`}
                  >
                    <p className="font-medium text-slate-900">{item.title}</p>
                    {item.description ? <p className="mt-0.5 text-sm text-slate-600">{item.description}</p> : null}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Nothing urgent right now. Check Today below or ask the assistant.</p>
          )}
        </HomeCollapsibleSection>
        ) : null}

        {showToday ? (
        <HomeCollapsibleSection
          sectionId="today"
          title="Today"
          subtitle="Tasks, calendar, and your schedule"
          defaultOpen
          badge={showTasks && taskStats?.dueToday ? taskStats.dueToday : undefined}
        >
          <div className="space-y-5">
            {showTasks && taskCounts && taskStats ? (
              <Link
                href="/tasks"
                className="group block rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition hover:border-[#f9a8d4]/50 hover:bg-[#fdf2f8]/30"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Your tasks</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">
                      {openTaskCount} open
                      {taskStats.overdue > 0 ? (
                        <span className="ml-2 text-base font-semibold text-red-700">{taskStats.overdue} overdue</span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {taskCounts.assignedToMe} assigned to you · {taskCounts.myRole} for{" "}
                      {session?.activeRoleName ?? "your role"}
                      {taskStats.dueToday > 0 ? ` · ${taskStats.dueToday} due today` : ""}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-[#b51266] group-hover:underline">Open task hub</span>
                </div>
              </Link>
            ) : null}

            {session ? (
              <HomeCalendar
                tasks={tasks}
                incidents={incidents}
                session={session}
                users={users}
                employees={employees}
                rosterShifts={allRosterShifts}
                shiftRequests={rosterShiftRequests}
              />
            ) : null}
          </div>
        </HomeCollapsibleSection>
        ) : null}

        {showModulesSection ? (
        <HomeCollapsibleSection sectionId="modules" title="Modules" subtitle="Quick counts across your workspace" defaultOpen>
          <div className="flex flex-wrap gap-3">
            {showModuleEnquiries ? (
            <CompactStat
              title="Enquiries"
              count={enquiries.length}
              hint={`${openEnquiries} open · ${convertedCount} converted`}
              href="/enquiries"
            />
            ) : null}
            {showModuleClients ? (
            <CompactStat title="Clients" count={clients.length} hint="Receiving support" href="/clients" />
            ) : null}
            {showModuleIncidents ? (
              <CompactStat
                title="Incidents"
                count={incidentStats.total}
                hint={
                  incidentStats.overdue > 0
                    ? `${incidentStats.overdue} overdue`
                    : `${incidentStats.open} open`
                }
                href="/incidents"
              />
            ) : null}
            {showModuleEmployees ? (
              <CompactStat title="Employees" count={employees.length} hint="Staff and contractors" href="/employees" />
            ) : null}
          </div>
        </HomeCollapsibleSection>
        ) : null}

        {showRecentSection ? (
        <HomeCollapsibleSection sectionId="recent-records" title="Recent records" subtitle="Jump back into active work" defaultOpen={false}>
          <div className="grid gap-4 xl:grid-cols-2">
            {showRecentEnquiries ? (
            <div className="rounded-xl border border-slate-100">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">Recent enquiries</h3>
                <Link href="/enquiries" className="text-xs font-medium text-[#b51266] hover:underline">
                  All
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
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#fdf2f8]/50"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">
                          {e.firstName} {e.lastName}
                        </p>
                        <p className="text-xs text-slate-500">{e.documentNo}</p>
                      </div>
                      <StatusBadge status={e.status} />
                    </EnquiryRecordLink>
                  ))
                ) : (
                  <p className="px-4 py-6 text-center text-sm text-slate-500">No enquiries yet.</p>
                )}
              </div>
            </div>
            ) : null}

            {showRecentClients ? (
            <div className="rounded-xl border border-slate-100">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">Recent clients</h3>
                <Link href="/clients" className="text-xs font-medium text-[#b51266] hover:underline">
                  All
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
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-emerald-50/50"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.searchKey}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200 ring-inset">
                        {c.status.replace(/^\d+_/, "").replace(/_/g, " ")}
                      </span>
                    </ClientRecordLink>
                  ))
                ) : (
                  <p className="px-4 py-6 text-center text-sm text-slate-500">No clients yet.</p>
                )}
              </div>
            </div>
            ) : null}

            {showRecentIncidents ? (
              <div className="rounded-xl border border-slate-100 xl:col-span-2">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <h3 className="text-sm font-semibold text-slate-900">Recent incidents</h3>
                  <Link href="/incidents" className="text-xs font-medium text-[#b51266] hover:underline">
                    All
                  </Link>
                </div>
                <div className="divide-y divide-slate-100">
                  {latestIncidents.length ? (
                    latestIncidents.map((incident) => (
                      <Link
                        key={incident.id}
                        href={`/incidents/${incident.id}`}
                        className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-amber-50/40"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900">{incident.title || incident.documentNo}</p>
                          <p className="text-xs text-slate-500">
                            {incident.documentNo}
                            {incident.isReportable ? " · NDIS reportable" : ""}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-medium text-slate-600">{incident.status}</span>
                      </Link>
                    ))
                  ) : (
                    <p className="px-4 py-6 text-center text-sm text-slate-500">No incidents recorded yet.</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </HomeCollapsibleSection>
        ) : null}
      </div>

      {canQuickReport ? (
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
