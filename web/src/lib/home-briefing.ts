import type { AuthSession } from "@/lib/access/types";
import type { IncidentRecord } from "@/lib/incident";
import type { MyActionItem } from "@/lib/my-workplace/compliance-dashboard";
import type { WorkforceReviewSummary } from "@/lib/workforce/review-queue";
import type { TaskDashboardStats } from "@/lib/task-hub";

import type { TimesheetApprovalSummary } from "@/lib/workforce/timesheet-approval-queue";

export type HomeAttentionSeverity = "critical" | "warning" | "info";

export type HomeAttentionItem = {
  id: string;
  severity: HomeAttentionSeverity;
  title: string;
  description?: string;
  href: string;
};

export type HomeBriefing = {
  summaryLine: string;
  attentionItems: HomeAttentionItem[];
};

function severityRank(severity: HomeAttentionSeverity): number {
  if (severity === "critical") return 0;
  if (severity === "warning") return 1;
  return 2;
}

export function buildHomeBriefing(input: {
  session: AuthSession | null;
  showTasks: boolean;
  showMyWorkplace: boolean;
  showWorkforceReviews: boolean;
  /** Org-wide NDIS reporting overdue items require "Can see all incidents". */
  showIncidentCompliance: boolean;
  openTaskCount: number;
  taskStats: TaskDashboardStats | null;
  myActionItems: MyActionItem[];
  reviewSummary: WorkforceReviewSummary | null;
  timesheetApprovalSummary: TimesheetApprovalSummary | null;
  overdueIncidents: IncidentRecord[];
}): HomeBriefing {
  const items: HomeAttentionItem[] = [];

  if (input.showIncidentCompliance && input.overdueIncidents.length > 0) {
    for (const incident of input.overdueIncidents.slice(0, 3)) {
      items.push({
        id: `ndis-${incident.id}`,
        severity: "critical",
        title: `${incident.documentNo} — NDIS reporting overdue`,
        description: incident.title || undefined,
        href: `/incidents/${incident.id}`,
      });
    }
    if (input.overdueIncidents.length > 3) {
      items.push({
        id: "ndis-more",
        severity: "critical",
        title: `${input.overdueIncidents.length - 3} more reportable incident${input.overdueIncidents.length - 3 === 1 ? "" : "s"} overdue`,
        href: "/incidents/compliance",
      });
    }
  }

  if (input.showTasks && input.taskStats && input.taskStats.overdue > 0) {
    items.push({
      id: "tasks-overdue",
      severity: "warning",
      title: `${input.taskStats.overdue} overdue task${input.taskStats.overdue === 1 ? "" : "s"}`,
      description:
        input.taskStats.dueToday > 0
          ? `${input.taskStats.dueToday} also due today`
          : `${input.openTaskCount} open overall`,
      href: "/tasks",
    });
  }

  if (input.showWorkforceReviews && input.reviewSummary && input.reviewSummary.total > 0) {
    items.push({
      id: "workforce-reviews",
      severity: "warning",
      title: `${input.reviewSummary.total} workforce review${input.reviewSummary.total === 1 ? "" : "s"} waiting`,
      description: `${input.reviewSummary.pendingCredentials} credential${input.reviewSummary.pendingCredentials === 1 ? "" : "s"}, ${input.reviewSummary.pendingLeave} leave request${input.reviewSummary.pendingLeave === 1 ? "" : "s"}`,
      href: "/workforce-planning#reviews",
    });
  }

  if (input.timesheetApprovalSummary && input.timesheetApprovalSummary.total > 0) {
    items.push({
      id: "timesheet-approvals",
      severity: input.timesheetApprovalSummary.blocked > 0 ? "warning" : "info",
      title: `${input.timesheetApprovalSummary.total} timesheet${input.timesheetApprovalSummary.total === 1 ? "" : "s"} awaiting approval`,
      description: `${input.timesheetApprovalSummary.ready} ready, ${input.timesheetApprovalSummary.review} review, ${input.timesheetApprovalSummary.blocked} blocked`,
      href: input.timesheetApprovalSummary.href,
    });
  }

  if (input.showMyWorkplace) {
    for (const item of input.myActionItems.slice(0, 4)) {
      const severity: HomeAttentionSeverity =
        item.severity === "overdue"
          ? "critical"
          : item.severity === "due_soon" || item.severity === "action"
            ? "warning"
            : "info";
      items.push({
        id: item.id,
        severity,
        title: item.title,
        description: item.description,
        href: item.href,
      });
    }
  }

  items.sort((a, b) => severityRank(a.severity) - severityRank(b.severity));

  const parts: string[] = [];
  const criticalCount = items.filter((i) => i.severity === "critical").length;
  const warningCount = items.filter((i) => i.severity === "warning").length;

  if (criticalCount > 0) {
    parts.push(`${criticalCount} critical item${criticalCount === 1 ? "" : "s"}`);
  }
  if (warningCount > 0) {
    parts.push(`${warningCount} warning${warningCount === 1 ? "" : "s"}`);
  }
  if (input.showTasks && input.taskStats) {
    if (input.taskStats.dueToday > 0 && input.taskStats.overdue === 0) {
      parts.push(`${input.taskStats.dueToday} task${input.taskStats.dueToday === 1 ? "" : "s"} due today`);
    }
  }

  let summaryLine: string;
  if (parts.length === 0) {
    summaryLine = input.session?.displayName
      ? `You're up to date, ${input.session.displayName.split(" ")[0]}. Ask the assistant or pick a quick action below.`
      : "You're up to date. Ask the assistant or pick a quick action below.";
  } else if (parts.length === 1) {
    summaryLine = `Today: ${parts[0]}.`;
  } else {
    summaryLine = `Today: ${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}.`;
  }

  return { summaryLine, attentionItems: items };
}
