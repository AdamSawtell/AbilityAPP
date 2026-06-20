import type { RosterOfCareLine, RosterOfCareRecord } from "@/lib/roster-of-care";
import { strDate, toDate } from "@/lib/supabase/mappers";

export type RosterOfCareRow = {
  id: string;
  client_id: string;
  service_agreement_id: string | null;
  name: string;
  status: string;
  source: string;
  valid_from: string | null;
  valid_to: string | null;
  created_by: string;
  updated_by: string;
};

export type RosterOfCareLineRowDb = {
  id: string;
  roster_of_care_id: string;
  line_no: number;
  weekday: number;
  start_time: string;
  end_time: string;
  support_type: string;
  location_id: string | null;
  service_agreement_line_id: string | null;
  worker_requirement: string;
  notes: string;
};

export function rosterOfCareFromRow(
  row: RosterOfCareRow,
  lines: RosterOfCareLineRowDb[]
): RosterOfCareRecord {
  return {
    id: row.id,
    clientId: row.client_id,
    serviceAgreementId: row.service_agreement_id ?? "",
    name: row.name,
    status: row.status,
    source: row.source,
    validFrom: strDate(row.valid_from),
    validTo: strDate(row.valid_to),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    lines: lines.map((line) => ({
      id: line.id,
      lineNo: line.line_no,
      weekday: line.weekday,
      startTime: String(line.start_time ?? "").slice(0, 5),
      endTime: String(line.end_time ?? "").slice(0, 5),
      supportType: line.support_type,
      locationId: line.location_id ?? "",
      serviceAgreementLineId: line.service_agreement_line_id ?? "",
      workerRequirement: line.worker_requirement,
      notes: line.notes,
    })),
  };
}

export function rosterOfCareToRow(record: RosterOfCareRecord): RosterOfCareRow {
  return {
    id: record.id,
    client_id: record.clientId,
    service_agreement_id: record.serviceAgreementId?.trim() ? record.serviceAgreementId : null,
    name: record.name,
    status: record.status,
    source: record.source,
    valid_from: toDate(record.validFrom),
    valid_to: toDate(record.validTo),
    created_by: record.createdBy,
    updated_by: record.updatedBy,
  };
}

export function rosterOfCareLineToRow(
  rosterOfCareId: string,
  line: RosterOfCareLine
): RosterOfCareLineRowDb {
  return {
    id: line.id,
    roster_of_care_id: rosterOfCareId,
    line_no: line.lineNo,
    weekday: line.weekday,
    start_time: line.startTime,
    end_time: line.endTime,
    support_type: line.supportType,
    location_id: line.locationId?.trim() ? line.locationId : null,
    service_agreement_line_id: line.serviceAgreementLineId?.trim() ? line.serviceAgreementLineId : null,
    worker_requirement: line.workerRequirement,
    notes: line.notes,
  };
}
