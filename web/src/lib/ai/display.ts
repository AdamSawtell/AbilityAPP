import type { ChatDisplayAttachment } from "@/lib/ai/types";

type ToolAudit = { name: string; args: Record<string, unknown>; result: unknown };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function resultList(result: unknown): Record<string, unknown>[] {
  const row = asRecord(result);
  if (!row || !Array.isArray(row.results)) return [];
  return row.results.filter((r) => r && typeof r === "object") as Record<string, unknown>[];
}

export function attachmentsFromToolAudit(auditTools: ToolAudit[]): ChatDisplayAttachment[] {
  const attachments: ChatDisplayAttachment[] = [];

  for (const entry of auditTools) {
    const results = resultList(entry.result);
    if (!results.length) continue;

    if (
      entry.name === "client_search" ||
      entry.name === "client_list_recent" ||
      entry.name === "records_updated_since"
    ) {
      attachments.push({
        type: "table",
        title: entry.name === "client_list_recent" ? "Recently updated clients" : "Results",
        columns: ["Name", "Status", "Updated"],
        rows: results.slice(0, 8).map((r) => ({
          Name: String(r.name ?? r.label ?? "—"),
          Status: String(r.status ?? r.entityType ?? "—"),
          Updated: String(r.updatedAt ?? "—"),
          href: String(r.href ?? ""),
        })),
      });
      continue;
    }

    if (entry.name === "task_search") {
      attachments.push({
        type: "table",
        title: "Tasks",
        columns: ["Document", "Title", "Status", "Assignee"],
        rows: results.slice(0, 8).map((r) => ({
          Document: String(r.documentNo ?? "—"),
          Title: String(r.title ?? "—"),
          Status: String(r.status ?? "—"),
          Assignee: String(r.assignee ?? "—"),
          href: String(r.href ?? ""),
        })),
      });
      continue;
    }

    if (entry.name === "incident_search") {
      attachments.push({
        type: "table",
        title: "Incidents",
        columns: ["Document", "Title", "Status", "NDIS"],
        rows: results.slice(0, 8).map((r) => ({
          Document: String(r.documentNo ?? "—"),
          Title: String(r.title ?? "—"),
          Status: String(r.status ?? "—"),
          NDIS: r.isReportable ? String(r.reportableType ?? "Reportable") : "No",
          href: String(r.href ?? ""),
        })),
      });
      continue;
    }

    if (entry.name === "enquiry_search") {
      attachments.push({
        type: "table",
        title: "Enquiries",
        columns: ["Document", "Name", "Status"],
        rows: results.slice(0, 8).map((r) => ({
          Document: String(r.documentNo ?? "—"),
          Name: String(r.name ?? "—"),
          Status: String(r.status ?? "—"),
          href: String(r.href ?? ""),
        })),
      });
      continue;
    }

    if (entry.name === "activity_search") {
      attachments.push({
        type: "table",
        title: "Activity",
        columns: ["Record", "Subject", "Date"],
        rows: results.slice(0, 8).map((r) => ({
          Record: String(r.parentLabel ?? "—"),
          Subject: String(r.subject ?? r.activityType ?? "—"),
          Date: String(r.date ?? r.updatedAt ?? "—"),
          href: String(r.href ?? ""),
        })),
      });
    }
  }

  return attachments;
}
