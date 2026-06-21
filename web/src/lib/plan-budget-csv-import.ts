import type { ClientPlanBudgetRow } from "@/lib/client-line-tables";
import { newLineId } from "@/lib/client-line-tables";

export type PlanBudgetCsvInputRow = {
  supportBudget: string;
  supportCategory: string;
  description: string;
  ndisLineItemRef: string;
  allocatedAmount: number;
  claimedAmount: number;
};

export const PLAN_BUDGET_CSV_HEADERS = [
  "support_budget",
  "support_category",
  "description",
  "ndis_line_item",
  "allocated_amount",
  "claimed_amount",
] as const;

export const PLAN_BUDGET_CSV_TEMPLATE = `support_budget,support_category,description,ndis_line_item,allocated_amount,claimed_amount
Core,Assistance with Daily Life,Personal care supports,,12000,3200
Capacity building,Support Coordination,Plan coordination,,2500,0
Capital,Assistive Technology,Wheelchair maintenance,,5000,1200`;

export type PlanBudgetCsvValidation = {
  supportBudgets: readonly string[];
  supportCategories: readonly string[];
};

function resolveAllowedOption(value: string, allowed: readonly string[]): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const exact = allowed.find((option) => option === trimmed);
  if (exact) return exact;
  const caseInsensitive = allowed.find((option) => option.toLowerCase() === trimmed.toLowerCase());
  return caseInsensitive ?? null;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cells.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function headerIndex(header: string[], names: string[]): number {
  for (const name of names) {
    const index = header.indexOf(name);
    if (index >= 0) return index;
  }
  return -1;
}

function parseMoney(value: string): number | null {
  const trimmed = value.trim().replace(/[$,]/g, "");
  if (!trimmed) return 0;
  const n = Number.parseFloat(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function cell(row: string[], index: number): string {
  return index >= 0 ? row[index]?.trim() ?? "" : "";
}

export function parsePlanBudgetCsv(
  text: string,
  validation?: PlanBudgetCsvValidation
): { ok: true; rows: PlanBudgetCsvInputRow[] } | { ok: false; errors: string[] } {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return { ok: false, errors: ["CSV is empty."] };

  const header = parseCsvLine(lines[0]).map((cell) => cell.toLowerCase());
  const budgetIdx = headerIndex(header, ["support_budget", "supportbudget", "budget"]);
  const categoryIdx = headerIndex(header, ["support_category", "supportcategory", "category"]);
  const allocatedIdx = headerIndex(header, ["allocated_amount", "allocated", "allocatedamount"]);
  const claimedIdx = headerIndex(header, ["claimed_amount", "claimed", "claimedamount"]);
  const descriptionIdx = headerIndex(header, ["description", "notes"]);
  const lineItemIdx = headerIndex(header, ["ndis_line_item", "ndislineitem", "line_item"]);

  const errors: string[] = [];
  if (budgetIdx < 0) errors.push("Missing required column: support_budget");
  if (categoryIdx < 0) errors.push("Missing required column: support_category");
  if (allocatedIdx < 0) errors.push("Missing required column: allocated_amount");
  if (errors.length) return { ok: false, errors };

  const rows: PlanBudgetCsvInputRow[] = [];

  for (let lineNo = 1; lineNo < lines.length; lineNo += 1) {
    const cells = parseCsvLine(lines[lineNo]);
    const supportBudget = cell(cells, budgetIdx);
    const supportCategory = cell(cells, categoryIdx);
    const allocatedAmount = parseMoney(cell(cells, allocatedIdx));
    const claimedRaw = claimedIdx >= 0 ? cell(cells, claimedIdx) : "";
    const claimedAmount = claimedRaw ? parseMoney(claimedRaw) : 0;

    if (!supportBudget && !supportCategory && !cell(cells, descriptionIdx)) continue;

    if (!supportBudget) {
      errors.push(`Row ${lineNo + 1}: support_budget is required.`);
      continue;
    }
    if (!supportCategory) {
      errors.push(`Row ${lineNo + 1}: support_category is required.`);
      continue;
    }
    if (allocatedAmount == null) {
      errors.push(`Row ${lineNo + 1}: allocated_amount must be a valid number.`);
      continue;
    }
    if (claimedAmount == null) {
      errors.push(`Row ${lineNo + 1}: claimed_amount must be a valid number.`);
      continue;
    }

    let resolvedBudget = supportBudget;
    let resolvedCategory = supportCategory;
    if (validation) {
      const budgetMatch = resolveAllowedOption(supportBudget, validation.supportBudgets);
      if (!budgetMatch) {
        errors.push(
          `Row ${lineNo + 1}: support_budget "${supportBudget}" is not a configured NDIS support budget.`
        );
        continue;
      }
      resolvedBudget = budgetMatch;

      const categoryMatch = resolveAllowedOption(supportCategory, validation.supportCategories);
      if (!categoryMatch) {
        errors.push(
          `Row ${lineNo + 1}: support_category "${supportCategory}" is not a configured NDIS support category.`
        );
        continue;
      }
      resolvedCategory = categoryMatch;
    }

    rows.push({
      supportBudget: resolvedBudget,
      supportCategory: resolvedCategory,
      description: cell(cells, descriptionIdx),
      ndisLineItemRef: cell(cells, lineItemIdx),
      allocatedAmount,
      claimedAmount,
    });
  }

  if (errors.length) return { ok: false, errors };
  if (!rows.length) return { ok: false, errors: ["No budget lines found in CSV."] };

  return { ok: true, rows };
}

export function appendPlanBudgetCsvRows(
  existing: ClientPlanBudgetRow[],
  imported: PlanBudgetCsvInputRow[]
): ClientPlanBudgetRow[] {
  let nextLineNo =
    existing.reduce((max, row) => (row.lineNo > max ? row.lineNo : max), 0) + 1;

  const appended = imported.map((row) => ({
    id: newLineId("budget"),
    lineNo: nextLineNo++,
    supportBudget: row.supportBudget,
    supportCategory: row.supportCategory,
    description: row.description,
    ndisLineItemRef: row.ndisLineItemRef,
    allocatedAmount: row.allocatedAmount,
    claimedAmount: row.claimedAmount,
  }));

  return [...existing, ...appended];
}

export function replacePlanBudgetCsvRows(imported: PlanBudgetCsvInputRow[]): ClientPlanBudgetRow[] {
  return imported.map((row, index) => ({
    id: newLineId("budget"),
    lineNo: index + 1,
    supportBudget: row.supportBudget,
    supportCategory: row.supportCategory,
    description: row.description,
    ndisLineItemRef: row.ndisLineItemRef,
    allocatedAmount: row.allocatedAmount,
    claimedAmount: row.claimedAmount,
  }));
}
