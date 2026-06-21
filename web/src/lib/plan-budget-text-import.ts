import type { PlanBudgetCsvInputRow, PlanBudgetCsvValidation } from "@/lib/plan-budget-csv-import";
import { parsePlanBudgetCsv } from "@/lib/plan-budget-csv-import";

export const PLAN_BUDGET_TEXT_TEMPLATE = `Core — Assistance with Daily Life — $42,000.00
Capacity building — Support Coordination — $3,500.00
Capital — Assistive Technology — $6,500.00`;

const BUDGET_LABELS = ["Core", "Capacity building", "Capital"] as const;

function parseMoney(value: string): number | null {
  const trimmed = value.trim().replace(/[$,]/g, "");
  if (!trimmed) return 0;
  const n = Number.parseFloat(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function resolveAllowedOption(value: string, allowed: readonly string[]): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const exact = allowed.find((option) => option === trimmed);
  if (exact) return exact;
  const caseInsensitive = allowed.find((option) => option.toLowerCase() === trimmed.toLowerCase());
  return caseInsensitive ?? null;
}

function resolveBudgetLabel(raw: string): string | null {
  const trimmed = raw.trim();
  for (const label of BUDGET_LABELS) {
    if (trimmed.toLowerCase() === label.toLowerCase()) return label;
  }
  if (/^capacity/i.test(trimmed)) return "Capacity building";
  if (/^core/i.test(trimmed)) return "Core";
  if (/^capital/i.test(trimmed)) return "Capital";
  return null;
}

function findCategoryInLine(line: string, categories: readonly string[]): string | null {
  const sorted = [...categories].sort((a, b) => b.length - a.length);
  for (const category of sorted) {
    if (line.toLowerCase().includes(category.toLowerCase())) return category;
  }
  return null;
}

function extractAmountFromLine(line: string): { amount: number; withoutAmount: string } | null {
  const match = line.match(/(?:\$|AUD\s*)?([\d,]+(?:\.\d{2})?)\s*$/i);
  if (!match) return null;
  const amount = parseMoney(match[1]);
  if (amount == null) return null;
  const withoutAmount = line.slice(0, match.index).replace(/[\s\-–—:|,]+$/, "").trim();
  return { amount, withoutAmount };
}

function parseStructuredLine(
  line: string,
  validation?: PlanBudgetCsvValidation
): PlanBudgetCsvInputRow | null {
  const tabCells = line.split("\t").map((cell) => cell.trim()).filter(Boolean);
  if (tabCells.length >= 3) {
    const supportBudget = resolveBudgetLabel(tabCells[0]);
    const allocatedAmount = parseMoney(tabCells[tabCells.length - 1]);
    if (supportBudget && allocatedAmount != null) {
      const supportCategory = tabCells[1];
      return {
        supportBudget,
        supportCategory,
        description: tabCells.slice(2, -1).join(" "),
        ndisLineItemRef: "",
        allocatedAmount,
        claimedAmount: 0,
      };
    }
  }

  const amountPart = extractAmountFromLine(line);
  if (!amountPart) return null;

  const segments = amountPart.withoutAmount.split(/\s*[,|\t]\s*|\s+[-–—]\s+/).map((s) => s.trim()).filter(Boolean);
  if (segments.length < 2) return null;

  const supportBudget = resolveBudgetLabel(segments[0]);
  if (!supportBudget) return null;

  let supportCategory = segments.slice(1).join(" — ");
  if (validation) {
    const matched = findCategoryInLine(supportCategory, validation.supportCategories);
    if (matched) supportCategory = matched;
  }

  return {
    supportBudget,
    supportCategory,
    description: "",
    ndisLineItemRef: "",
    allocatedAmount: amountPart.amount,
    claimedAmount: 0,
  };
}

function parseAllocatedFollowUp(
  line: string,
  pending: { supportBudget: string; supportCategory: string; description: string }
): PlanBudgetCsvInputRow | null {
  const match = line.match(/(?:allocated|approved|total)[:\s]+\$?([\d,]+(?:\.\d{2})?)/i);
  if (!match) return null;
  const allocatedAmount = parseMoney(match[1]);
  if (allocatedAmount == null) return null;
  return {
    supportBudget: pending.supportBudget,
    supportCategory: pending.supportCategory,
    description: pending.description,
    ndisLineItemRef: "",
    allocatedAmount,
    claimedAmount: 0,
  };
}

function validatePlanBudgetRow(
  row: PlanBudgetCsvInputRow,
  validation: PlanBudgetCsvValidation | undefined,
  lineNo: number,
  errors: string[]
): PlanBudgetCsvInputRow | null {
  const parsed = { ...row };

  if (validation) {
    const budgetMatch = resolveAllowedOption(parsed.supportBudget, validation.supportBudgets);
    if (!budgetMatch) {
      errors.push(`Line ${lineNo + 1}: support budget "${parsed.supportBudget}" is not configured.`);
      return null;
    }
    parsed.supportBudget = budgetMatch;

    const categoryMatch = resolveAllowedOption(parsed.supportCategory, validation.supportCategories);
    if (!categoryMatch) {
      errors.push(`Line ${lineNo + 1}: support category "${parsed.supportCategory}" is not configured.`);
      return null;
    }
    parsed.supportCategory = categoryMatch;
  }

  if (!parsed.supportCategory.trim()) {
    errors.push(`Line ${lineNo + 1}: could not determine support category.`);
    return null;
  }

  return parsed;
}

export function parsePlanBudgetText(
  text: string,
  validation?: PlanBudgetCsvValidation
): { ok: true; rows: PlanBudgetCsvInputRow[] } | { ok: false; errors: string[] } {
  const trimmed = text.replace(/^\uFEFF/, "").trim();
  if (!trimmed) return { ok: false, errors: ["Paste text is empty."] };

  if (trimmed.includes("support_budget") && trimmed.includes("support_category")) {
    return parsePlanBudgetCsv(trimmed, validation);
  }

  const lines = trimmed.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const errors: string[] = [];
  const rows: PlanBudgetCsvInputRow[] = [];
  let pending: { supportBudget: string; supportCategory: string; description: string } | null = null;

  for (let lineNo = 0; lineNo < lines.length; lineNo += 1) {
    const line = lines[lineNo];

    if (pending) {
      const followUp = parseAllocatedFollowUp(line, pending);
      if (followUp) {
        const validated = validatePlanBudgetRow(followUp, validation, lineNo, errors);
        if (validated) rows.push(validated);
        pending = null;
        continue;
      }
    }

    const parsed = parseStructuredLine(line, validation);
    if (!parsed) {
      const budgetOnly = resolveBudgetLabel(line.split(/\s*[-–—:|]\s*/)[0] ?? "");
      if (budgetOnly) {
        if (pending) {
          errors.push(
            `Line ${lineNo + 1}: previous line for "${pending.supportBudget} — ${pending.supportCategory}" is missing an allocated amount.`
          );
        }
        const rest = line.slice(line.indexOf(budgetOnly) + budgetOnly.length).replace(/^[\s\-–—:|]+/, "");
        const category =
          (validation ? findCategoryInLine(rest, validation.supportCategories) : null) ??
          rest.split(/\s*[-–—:|]\s*/)[0]?.trim() ??
          "";
        pending = { supportBudget: budgetOnly, supportCategory: category, description: "" };
        continue;
      }
      continue;
    }

    if (pending) {
      errors.push(
        `Line ${lineNo + 1}: previous line for "${pending.supportBudget} — ${pending.supportCategory}" is missing an allocated amount.`
      );
      pending = null;
    }

    const validated = validatePlanBudgetRow(parsed, validation, lineNo, errors);
    if (validated) rows.push(validated);
  }

  if (pending) {
    errors.push(
      `Incomplete paste: "${pending.supportBudget} — ${pending.supportCategory}" is missing an allocated amount line.`
    );
  }

  if (errors.length) return { ok: false, errors };
  if (!rows.length) {
    return {
      ok: false,
      errors: [
        "No plan budget lines found. Paste one line per category — for example: Core — Assistance with Daily Life — $42,000.",
      ],
    };
  }

  return { ok: true, rows };
}
