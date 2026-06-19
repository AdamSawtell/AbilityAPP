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

function statusLabel(raw: unknown): string {
  const s = String(raw ?? "");
  return s.replace(/^\d+_/, "").replace(/_/g, " ") || "—";
}

function enquiryCardTitle(r: Record<string, unknown>): string {
  const direct = String(r.name ?? "").trim();
  if (direct) return direct;
  const full = `${String(r.firstName ?? "").trim()} ${String(r.lastName ?? "").trim()}`.trim();
  return full || "—";
}

function cardAttachment(title: string, results: Record<string, unknown>[], mapRow: (r: Record<string, unknown>) => ChatDisplayAttachment["cards"] extends (infer U)[] | undefined ? U : never): ChatDisplayAttachment {
  return {
    type: "cards",
    title,
    cards: results.slice(0, 6).map(mapRow),
  };
}

export function attachmentsFromToolAudit(auditTools: ToolAudit[]): ChatDisplayAttachment[] {
  const attachments: ChatDisplayAttachment[] = [];

  for (const entry of auditTools) {
    const results = resultList(entry.result);
    if (!results.length) continue;

    if (
      entry.name === "client_search" ||
      entry.name === "client_list_recent" ||
      (entry.name === "records_updated_since" && results.some((r) => r.entityType === "client" || r.searchKey))
    ) {
      const clients = entry.name === "records_updated_since"
        ? results.filter((r) => String(r.entityType ?? "") === "client" || r.searchKey)
        : results;
      if (clients.length) {
        attachments.push(
          cardAttachment(
            entry.name === "client_list_recent" ? "Recently updated clients" : "Clients",
            clients,
            (r) => ({
              title: String(r.name ?? r.label ?? "—"),
              subtitle: String(r.searchKey ?? r.id ?? ""),
              meta: String(r.email ?? r.phone ?? ""),
              badge: statusLabel(r.status),
              href: String(r.href ?? `/clients/${r.id ?? r.searchKey}`),
            })
          )
        );
      }
      continue;
    }

    if (entry.name === "task_search") {
      attachments.push(
        cardAttachment("Tasks", results, (r) => ({
          title: String(r.title ?? "—"),
          subtitle: String(r.documentNo ?? ""),
          meta: String(r.assignee ?? "—"),
          badge: String(r.status ?? ""),
          href: String(r.href ?? `/tasks/${r.id}`),
        }))
      );
      continue;
    }

    if (entry.name === "incident_search" || entry.name === "incident_list_recent" || entry.name === "incident_linked_search") {
      attachments.push(
        cardAttachment("Incidents", results, (r) => ({
          title: String(r.title ?? "—"),
          subtitle: String(r.documentNo ?? ""),
          meta: r.isReportable ? "NDIS reportable" : "Not reportable",
          badge: String(r.status ?? r.severity ?? ""),
          href: String(r.href ?? `/incidents/${r.id}`),
        }))
      );
      continue;
    }

    if (entry.name === "enquiry_search") {
      attachments.push(
        cardAttachment("Enquiries", results, (r) => ({
          title: enquiryCardTitle(r),
          subtitle: String(r.documentNo ?? ""),
          badge: statusLabel(r.status),
          href: String(r.href ?? `/enquiries/${r.id}`),
        }))
      );
      continue;
    }

    if (entry.name === "activity_search") {
      attachments.push(
        cardAttachment("Activity", results, (r) => ({
          title: String(r.subject ?? r.activityType ?? "Activity"),
          subtitle: String(r.parentLabel ?? "—"),
          meta: String(r.date ?? r.updatedAt ?? ""),
          href: String(r.href ?? ""),
        }))
      );
      continue;
    }

    if (entry.name === "client_activity_recent") {
      const row = asRecord(entry.result);
      if (!row || row.found === false) continue;
      const client = asRecord(row.client);
      const activities = Array.isArray(row.activities)
        ? (row.activities as Record<string, unknown>[])
        : [];
      if (!activities.length) continue;
      const clientLabel = String(client?.name ?? "Client");
      attachments.push({
        type: "table",
        title:
          row.purpose === "coach"
            ? `Last ${activities.length} activity notes — ${clientLabel}`
            : `Activity notes — ${clientLabel}`,
        columns: ["Date", "Type", "Subject", "Notes"],
        rows: activities.map((a) => ({
          Date: String(a.date ?? "—"),
          Type: String(a.type ?? "—"),
          Subject: String(a.subject ?? "—"),
          Notes:
            String(a.description ?? "").length > 160
              ? `${String(a.description ?? "").slice(0, 157)}…`
              : String(a.description ?? "—"),
        })),
      });
    }
  }

  return attachments.filter((a) => a.cards?.length || a.rows?.length);
}
