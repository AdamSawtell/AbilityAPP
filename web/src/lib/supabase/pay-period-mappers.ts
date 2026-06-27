import type {
  PayPeriodDefinitionRecord,
  PayPeriodInstanceRecord,
} from "@/lib/pay-period";
import {
  normalizePayPeriodDefinition,
  normalizePayPeriodInstance,
} from "@/lib/pay-period";

export type PayPeriodDefinitionRow = {
  id: string;
  organization_id: string;
  name: string;
  frequency: string;
  period_length_days: number;
  start_day: number;
  anchor_date: string;
  label_pattern: string;
  edit_grace_days: number;
  is_active: boolean;
  created_by: string;
  updated_by: string;
};

export type PayPeriodInstanceRow = {
  id: string;
  definition_id: string;
  period_number: string;
  period_index: number;
  start_date: string;
  end_date: string;
  status: string;
  closed_at: string | null;
  closed_by: string;
  close_notes: string;
};

export function payPeriodDefinitionFromRow(row: PayPeriodDefinitionRow): PayPeriodDefinitionRecord {
  return normalizePayPeriodDefinition({
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    frequency: row.frequency,
    periodLengthDays: row.period_length_days,
    startDay: row.start_day,
    anchorDate: row.anchor_date?.slice(0, 10) ?? "",
    labelPattern: row.label_pattern,
    editGraceDays: row.edit_grace_days,
    isActive: row.is_active,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  });
}

export function payPeriodDefinitionToRow(record: PayPeriodDefinitionRecord): PayPeriodDefinitionRow {
  const normalized = normalizePayPeriodDefinition(record);
  return {
    id: normalized.id,
    organization_id: normalized.organizationId,
    name: normalized.name,
    frequency: normalized.frequency,
    period_length_days: normalized.periodLengthDays,
    start_day: normalized.startDay,
    anchor_date: normalized.anchorDate,
    label_pattern: normalized.labelPattern,
    edit_grace_days: normalized.editGraceDays,
    is_active: normalized.isActive,
    created_by: normalized.createdBy,
    updated_by: normalized.updatedBy,
  };
}

export function payPeriodInstanceFromRow(row: PayPeriodInstanceRow): PayPeriodInstanceRecord {
  return normalizePayPeriodInstance({
    id: row.id,
    definitionId: row.definition_id,
    periodNumber: row.period_number,
    periodIndex: row.period_index,
    startDate: row.start_date?.slice(0, 10) ?? "",
    endDate: row.end_date?.slice(0, 10) ?? "",
    status: row.status,
    closedAt: row.closed_at ?? "",
    closedBy: row.closed_by,
    closeNotes: row.close_notes,
  });
}

export function payPeriodInstanceToRow(record: PayPeriodInstanceRecord): PayPeriodInstanceRow {
  const normalized = normalizePayPeriodInstance(record);
  return {
    id: normalized.id,
    definition_id: normalized.definitionId,
    period_number: normalized.periodNumber,
    period_index: normalized.periodIndex,
    start_date: normalized.startDate,
    end_date: normalized.endDate,
    status: normalized.status,
    closed_at: normalized.closedAt?.trim() ? normalized.closedAt : null,
    closed_by: normalized.closedBy,
    close_notes: normalized.closeNotes,
  };
}
