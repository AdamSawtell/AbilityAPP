import { newLineId } from "@/lib/client-line-tables";
import type { GenericTableConfig } from "@/components/line-item-table";
import type { IncidentActionRow, IncidentNotificationRow, IncidentPartyRow } from "@/lib/incident";

export const partyTypeOptions = ["Client", "Employee", "Witness", "Other"] as const;
export const partyRoleOptions = [
  "Affected person",
  "Reporter",
  "Witness",
  "Staff involved",
  "Manager notified",
  "Other",
] as const;

export const incidentActionTypeOptions = [
  "Immediate response",
  "Investigation step",
  "Corrective action",
  "Evidence collected",
  "Risk review",
  "Other",
] as const;

export const notificationTargetOptions = [
  "Internal manager",
  "NDIS Commission",
  "Participant / family",
  "Guardian",
  "Police",
  "Other regulator",
  "Other",
] as const;

export const notificationMethodOptions = ["Phone", "Email", "NDIS portal", "In person", "Written letter", "Other"] as const;

export function emptyPartyRow(lineNo: number): IncidentPartyRow {
  return {
    id: newLineId("ip"),
    lineNo,
    partyType: "Client",
    entityId: "",
    partyName: "",
    roleInIncident: "Affected person",
    notes: "",
  };
}

export function emptyActionRow(lineNo: number): IncidentActionRow {
  return {
    id: newLineId("ia"),
    lineNo,
    actionDate: new Date().toISOString().slice(0, 10),
    actionType: "Investigation step",
    description: "",
    evidenceRef: "",
    owner: "",
    outcome: "",
  };
}

export function emptyNotificationRow(lineNo: number): IncidentNotificationRow {
  return {
    id: newLineId("in"),
    lineNo,
    notifiedAt: new Date().toISOString(),
    notifyTarget: "Internal manager",
    method: "Email",
    notifiedBy: "",
    reference: "",
    notes: "",
  };
}

export const incidentPartyTableConfig: GenericTableConfig<IncidentPartyRow> = {
  addLabel: "Add party",
  emptyMessage: "No parties linked. Add clients, employees, witnesses, or other people involved.",
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "partyType", label: "Type", type: "select", optionsKey: "partyType", required: true },
    { key: "entityId", label: "Record ID", type: "text" },
    { key: "partyName", label: "Name", type: "text" },
    { key: "roleInIncident", label: "Role", type: "select", optionsKey: "partyRole", required: true },
    { key: "notes", label: "Notes", type: "text" },
  ],
  emptyRow: emptyPartyRow,
};

export const incidentActionTableConfig: GenericTableConfig<IncidentActionRow> = {
  addLabel: "Add action",
  emptyMessage: "No investigation or response steps recorded yet.",
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "actionDate", label: "Date", type: "date" },
    { key: "actionType", label: "Type", type: "select", optionsKey: "incidentActionType", required: true },
    { key: "description", label: "Description", type: "textarea", className: "min-w-[12rem]" },
    { key: "evidenceRef", label: "Evidence ref", type: "text" },
    { key: "owner", label: "Owner", type: "text" },
    { key: "outcome", label: "Outcome", type: "text" },
  ],
  emptyRow: emptyActionRow,
};

export const incidentNotificationTableConfig: GenericTableConfig<IncidentNotificationRow> = {
  addLabel: "Log notification",
  emptyMessage: "No notifications logged. Record internal alerts and NDIS Commission submissions here.",
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "notifiedAt", label: "Notified at", type: "date" },
    { key: "notifyTarget", label: "Notified", type: "select", optionsKey: "notificationTarget", required: true },
    { key: "method", label: "Method", type: "select", optionsKey: "notificationMethod" },
    { key: "notifiedBy", label: "By", type: "text" },
    { key: "reference", label: "Reference", type: "text" },
    { key: "notes", label: "Notes", type: "text" },
  ],
  emptyRow: emptyNotificationRow,
};
