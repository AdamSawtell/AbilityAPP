"use client";

import { useState } from "react";
import type { ClientPlanBudgetRow } from "@/lib/client-line-tables";
import { useReferenceData } from "@/lib/config-store";
import {
  appendPlanBudgetCsvRows,
  parsePlanBudgetCsv,
  PLAN_BUDGET_CSV_HEADERS,
  PLAN_BUDGET_CSV_TEMPLATE,
  replacePlanBudgetCsvRows,
} from "@/lib/plan-budget-csv-import";

export function ClientPlanBudgetImportPanel({
  rows,
  readOnly,
  onApply,
}: {
  rows: ClientPlanBudgetRow[];
  readOnly?: boolean;
  onApply: (rows: ClientPlanBudgetRow[]) => void;
}) {
  const { getOptions } = useReferenceData();
  const [csvText, setCsvText] = useState("");
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  if (readOnly) return null;

  function handleImport() {
    setError("");
    setMessage("");

    const parsed = parsePlanBudgetCsv(csvText, {
      supportBudgets: getOptions("ndisSupportBudget"),
      supportCategories: getOptions("ndisSupportCategory"),
    });
    if (!parsed.ok) {
      setError(parsed.errors.join(" "));
      return;
    }

    const next = replaceExisting
      ? replacePlanBudgetCsvRows(parsed.rows)
      : appendPlanBudgetCsvRows(rows, parsed.rows);

    onApply(next);
    setMessage(
      `${replaceExisting ? "Replaced with" : "Appended"} ${parsed.rows.length} plan budget line${parsed.rows.length === 1 ? "" : "s"}. Save the client record to persist.`
    );
    setCsvText("");
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Import plan budget CSV</h3>
      <p className="mt-1 text-sm text-slate-600">
        Paste NDIS plan budget lines exported from a spreadsheet. Columns:{" "}
        {PLAN_BUDGET_CSV_HEADERS.join(", ")}.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={replaceExisting}
            onChange={(e) => setReplaceExisting(e.target.checked)}
            className="rounded border-slate-300"
          />
          Replace existing lines
        </label>
        <button
          type="button"
          onClick={() => setCsvText(PLAN_BUDGET_CSV_TEMPLATE)}
          className="text-sm font-medium text-[#b51266] hover:underline"
        >
          Load sample template
        </button>
      </div>

      <textarea
        value={csvText}
        onChange={(e) => setCsvText(e.target.value)}
        rows={6}
        placeholder={PLAN_BUDGET_CSV_TEMPLATE}
        className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs text-slate-800 shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20"
      />

      {error ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">{error}</p>
      ) : null}
      {message ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          {message}
        </p>
      ) : null}

      <div className="mt-3">
        <button
          type="button"
          disabled={!csvText.trim()}
          onClick={handleImport}
          className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Import CSV
        </button>
      </div>
    </div>
  );
}
