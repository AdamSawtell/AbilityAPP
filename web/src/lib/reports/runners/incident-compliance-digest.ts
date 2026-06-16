import type { IncidentRecord } from "@/lib/incident";
import { formatDisplayDateTime, isNdisReportOverdue } from "@/lib/incident";
import { ndisChecklistProgress } from "@/lib/incident-ndis";
import type { ReportResult } from "@/lib/reports/types";

export type ComplianceDigestSection = {
  label: string;
  count: number;
  items: { documentNo: string; title: string; detail: string; href: string }[];
};

export type ComplianceDigest = {
  generatedAt: string;
  summary: {
    openReportable: number;
    overdue: number;
    incompleteChecklist: number;
    closedThisWeek: number;
  };
  sections: ComplianceDigestSection[];
};

function weekAgoIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
}

export function buildIncidentComplianceDigest(incidents: IncidentRecord[]): ComplianceDigest {
  const generatedAt = new Date().toISOString();
  const weekAgo = weekAgoIso();

  const reportable = incidents.filter((i) => i.isReportable);
  const openReportable = reportable.filter((i) => i.status !== "Closed");
  const overdue = openReportable.filter(isNdisReportOverdue);
  const incomplete = openReportable.filter((i) => !ndisChecklistProgress(i).complete);
  const closedThisWeek = incidents.filter(
    (i) => i.status === "Closed" && (i.reportedAt || i.occurredAt) >= weekAgo.slice(0, 10)
  );

  const mapItems = (rows: IncidentRecord[]) =>
    rows.slice(0, 25).map((i) => ({
      documentNo: i.documentNo,
      title: i.title || "Untitled incident",
      detail: [
        i.reportableType,
        i.reportDeadlineAt ? `Due ${formatDisplayDateTime(i.reportDeadlineAt)}` : "",
        i.status,
      ]
        .filter(Boolean)
        .join(" · "),
      href: `/incidents/${i.id}`,
    }));

  return {
    generatedAt,
    summary: {
      openReportable: openReportable.length,
      overdue: overdue.length,
      incompleteChecklist: incomplete.length,
      closedThisWeek: closedThisWeek.length,
    },
    sections: [
      { label: "NDIS overdue", count: overdue.length, items: mapItems(overdue) },
      { label: "Incomplete checklist", count: incomplete.length, items: mapItems(incomplete) },
      { label: "Open reportable", count: openReportable.length, items: mapItems(openReportable) },
    ],
  };
}

export function buildIncidentComplianceDigestReport(incidents: IncidentRecord[]): ReportResult {
  const digest = buildIncidentComplianceDigest(incidents);
  const rows = digest.sections.flatMap((section) =>
    section.items.map((item) => ({
      section: section.label,
      documentNo: item.documentNo,
      title: item.title,
      detail: item.detail,
    }))
  );

  return {
    columns: [
      { id: "section", label: "Section" },
      { id: "documentNo", label: "Document no." },
      { id: "title", label: "Title" },
      { id: "detail", label: "Detail" },
    ],
    rows,
  };
}
