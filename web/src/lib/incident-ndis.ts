import { formatDisplayDateTime, isNdisReportOverdue, type IncidentRecord } from "@/lib/incident";

export type NdisChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  detail: string;
  required: boolean;
};

export function incidentAlertMarker(incidentId: string) {
  return `incident:${incidentId}`;
}

/** Evidence-based NDIS Commission submission checklist derived from the incident record. */
export function ndisSubmissionChecklist(incident: IncidentRecord): NdisChecklistItem[] {
  const internalNotified = incident.notifications.some((n) =>
    n.notifyTarget.toLowerCase().includes("internal")
  );
  const familyNotified = incident.notifications.some(
    (n) =>
      n.notifyTarget.toLowerCase().includes("family") ||
      n.notifyTarget.toLowerCase().includes("participant") ||
      n.notifyTarget.toLowerCase().includes("guardian")
  );
  const commissionNotified =
    Boolean(incident.ndisNotifiedAt) ||
    incident.notifications.some((n) => n.notifyTarget.toLowerCase().includes("ndis"));
  const immediateLogged = Boolean(incident.immediateActions.trim()) || incident.actions.some((a) => a.actionType === "Immediate response");
  const investigationStarted =
    incident.status !== "Draft" &&
    incident.status !== "Submitted" &&
    (Boolean(incident.investigationSummary.trim()) || incident.actions.length > 0);
  const correctiveDocumented = Boolean(incident.correctiveActions.trim()) || incident.actions.some((a) => a.actionType === "Corrective action");
  const closed = incident.status === "Closed";

  return [
    {
      id: "immediate",
      label: "Immediate actions recorded",
      done: immediateLogged,
      detail: immediateLogged ? "Response steps are documented on the record." : "Add immediate actions on Overview or Investigation.",
      required: true,
    },
    {
      id: "internal",
      label: "Internal manager notified",
      done: internalNotified,
      detail: internalNotified ? "Logged in Notifications." : "Log internal escalation on the Notifications tab.",
      required: true,
    },
    {
      id: "family",
      label: "Participant / family notified (if applicable)",
      done: familyNotified,
      detail: familyNotified ? "Logged in Notifications." : "Log when participant, family, or guardian were informed.",
      required: false,
    },
    {
      id: "commission",
      label: "NDIS Commission notified",
      done: commissionNotified,
      detail: commissionNotified
        ? incident.ndisNotificationRef
          ? `Reference: ${incident.ndisNotificationRef}`
          : `Notified ${formatDisplayDateTime(incident.ndisNotifiedAt)}`
        : incident.reportDeadlineAt
          ? `Due ${formatDisplayDateTime(incident.reportDeadlineAt)}${isNdisReportOverdue(incident) ? " — overdue" : ""}`
          : "Set awareness date and reportable type to calculate the deadline.",
      required: true,
    },
    {
      id: "investigation",
      label: "Investigation underway",
      done: investigationStarted,
      detail: investigationStarted ? `Status: ${incident.status}` : "Move status forward and add investigation notes or actions.",
      required: true,
    },
    {
      id: "corrective",
      label: "Corrective actions documented",
      done: correctiveDocumented,
      detail: correctiveDocumented ? "Corrective steps are on the record." : "Add corrective actions before closing.",
      required: true,
    },
    {
      id: "closed",
      label: "Incident closed",
      done: closed,
      detail: closed ? "Record is closed." : "Close the incident when all actions are complete.",
      required: false,
    },
  ];
}

export function ndisChecklistProgress(incident: IncidentRecord) {
  const items = ndisSubmissionChecklist(incident);
  const required = items.filter((i) => i.required);
  const doneRequired = required.filter((i) => i.done).length;
  return {
    items,
    doneRequired,
    totalRequired: required.length,
    complete: doneRequired === required.length,
  };
}
