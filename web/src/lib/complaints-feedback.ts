import type { ClientRecord } from "@/lib/client";
import type { ClientActivityRow } from "@/lib/client-line-tables";
import type { IncidentRecord } from "@/lib/incident";

export const COMPLAINT_ACTIVITY_TYPES = ["Complaint", "Feedback"] as const;
export const COMPLAINT_INCIDENT_CATEGORY = "Complaint";

export type ComplaintsFeedbackRow = {
  id: string;
  source: "activity" | "incident";
  clientId: string;
  clientSearchKey: string;
  clientName: string;
  type: string;
  subject: string;
  status: string;
  recordedAt: string;
  href: string;
};

function activityRows(clients: ClientRecord[]): ComplaintsFeedbackRow[] {
  const rows: ComplaintsFeedbackRow[] = [];
  for (const client of clients) {
    for (const activity of client.activity ?? []) {
      if (!COMPLAINT_ACTIVITY_TYPES.includes(activity.activityType as (typeof COMPLAINT_ACTIVITY_TYPES)[number])) {
        continue;
      }
      rows.push({
        id: `act-${client.id}-${activity.id}`,
        source: "activity",
        clientId: client.id,
        clientSearchKey: client.searchKey,
        clientName: client.name,
        type: activity.activityType,
        subject: activity.subject?.trim() || activity.description?.trim().slice(0, 80) || "—",
        status: activity.activityType === "Feedback" ? "Logged" : "Open",
        recordedAt: activity.date || "",
        href: `/clients/${client.id}?tab=Activity`,
      });
    }
  }
  return rows;
}

function incidentRows(incidents: IncidentRecord[], clients: ClientRecord[]): ComplaintsFeedbackRow[] {
  const clientById = new Map(clients.map((c) => [c.id, c]));
  return incidents
    .filter((incident) => incident.category === COMPLAINT_INCIDENT_CATEGORY)
    .map((incident) => {
      const client = incident.primaryClientId ? clientById.get(incident.primaryClientId) : undefined;
      return {
        id: `inc-${incident.id}`,
        source: "incident" as const,
        clientId: client?.id ?? incident.primaryClientId ?? "",
        clientSearchKey: client?.searchKey ?? "—",
        clientName: client?.name ?? "—",
        type: "Complaint (incident)",
        subject: incident.title?.trim() || incident.documentNo,
        status: incident.status,
        recordedAt: incident.occurredAt || incident.reportedAt || "",
        href: `/incidents/${incident.id}`,
      };
    });
}

export function collectComplaintsFeedback(
  clients: ClientRecord[],
  incidents: IncidentRecord[]
): ComplaintsFeedbackRow[] {
  return [...activityRows(clients), ...incidentRows(incidents, clients)].sort((a, b) =>
    b.recordedAt.localeCompare(a.recordedAt)
  );
}

export type ComplaintsFeedbackSummary = {
  total: number;
  openComplaints: number;
  feedbackCount: number;
  incidentComplaints: number;
  openRows: ComplaintsFeedbackRow[];
};

export function summarizeComplaintsFeedback(
  clients: ClientRecord[],
  incidents: IncidentRecord[],
  periodStart?: string,
  periodEnd?: string
): ComplaintsFeedbackSummary {
  let rows = collectComplaintsFeedback(clients, incidents);
  if (periodStart && periodEnd) {
    rows = rows.filter((row) => {
      const day = row.recordedAt.slice(0, 10);
      return day >= periodStart && day <= periodEnd;
    });
  }

  const openComplaints = rows.filter(
    (r) => r.type.includes("Complaint") && r.status !== "Closed"
  ).length;
  const feedbackCount = rows.filter((r) => r.type === "Feedback").length;
  const incidentComplaints = rows.filter((r) => r.source === "incident").length;

  return {
    total: rows.length,
    openComplaints,
    feedbackCount,
    incidentComplaints,
    openRows: rows.filter((r) => r.status !== "Closed" && r.status !== "Logged").slice(0, 10),
  };
}

export function complaintsFeedbackCsv(rows: ComplaintsFeedbackRow[]): string {
  const header = ["Source", "Client", "Type", "Subject", "Status", "Date", "Link"].join(",");
  const lines = rows.map((row) =>
    [
      row.source,
      `"${row.clientSearchKey.replace(/"/g, '""')}"`,
      `"${row.type.replace(/"/g, '""')}"`,
      `"${row.subject.replace(/"/g, '""')}"`,
      row.status,
      row.recordedAt.slice(0, 10),
      row.href,
    ].join(",")
  );
  return [header, ...lines].join("\r\n");
}
