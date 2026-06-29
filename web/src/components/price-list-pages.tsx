"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { LineItemTable, type GenericTableConfig } from "@/components/line-item-table";
import { RecordTasksPanel } from "@/components/record-tasks-panel";
import { UnsavedChangesBar } from "@/components/unsaved-changes-bar";
import { useAuth } from "@/lib/auth-store";
import { newLineId } from "@/lib/client-line-tables";
import { formatContractDate } from "@/lib/contract";
import type { PriceListLine, PriceListRecord } from "@/lib/product";
import { useData } from "@/lib/data-store";
import { auditMetaFrom } from "@/lib/audit";
import { SAVE_TOAST_MESSAGES, showSuccessToast } from "@/lib/toast";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

const priceLineConfig: GenericTableConfig<PriceListLine> = {
  columns: [
    { key: "lineNo", label: "Line", type: "number" as const, className: "w-14" },
    { key: "productId", label: "Product", type: "select" as const, optionsKey: "productId" },
    { key: "listPrice", label: "List price", type: "text" as const },
    { key: "standardPrice", label: "Standard price", type: "text" as const },
    { key: "limitPrice", label: "Limit price", type: "text" as const },
  ],
  emptyRow: (lineNo: number): PriceListLine => ({
    id: newLineId("pll"),
    lineNo,
    productId: "",
    listPrice: "",
    standardPrice: "",
    limitPrice: "",
  }),
  addLabel: "Add product price",
  emptyMessage: "No product prices on this list yet.",
};

export function PriceListListView() {
  const { priceLists } = useData();

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Schema</th>
            <th className="px-4 py-3">Valid from</th>
            <th className="px-4 py-3">Lines</th>
            <th className="px-4 py-3">Currency</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {priceLists.map((pl) => (
            <tr key={pl.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium">
                <Link href={`/price-lists/${pl.id}`} className="text-[#b51266] hover:underline">
                  {pl.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-600">{pl.schema}</td>
              <td className="px-4 py-3">{formatContractDate(pl.validFrom)}</td>
              <td className="px-4 py-3">{pl.lines.length}</td>
              <td className="px-4 py-3">{pl.currency}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PriceListDetailView({ id }: { id: string }) {
  const { priceLists, products, upsertPriceList } = useData();
  const { canWriteWindow } = useAuth();
  const canSavePriceList = canWriteWindow("price-lists");
  const stored = priceLists.find((p) => p.id === id);
  const [draft, setDraft] = useState<PriceListRecord | null>(null);
  const [saved, setSaved] = useState(false);
  const list = draft ?? stored ?? null;
  const hasUnsavedChanges = Boolean(draft);

  const productDropdown = useMemo(
    () => ({ productId: products.map((p) => p.id) }),
    [products]
  );
  const productLabels = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, `${p.searchKey} — ${p.name}`])),
    [products]
  );

  if (!list) {
    return (
      <AppShell title="Price list not found">
        <Link href="/price-lists" className="text-[#b51266] hover:underline">
          Back to price lists
        </Link>
      </AppShell>
    );
  }

  function onChange<K extends keyof PriceListRecord>(key: K, value: PriceListRecord[K]) {
    const base = draft ?? stored;
    if (!base) return;
    setDraft({ ...base, [key]: value, updatedBy: "SuperUser" });
    setSaved(false);
  }

  return (
    <>
      <AppShell
        title={list.name}
        subtitle={`Valid from ${formatContractDate(list.validFrom)} · ${list.lines.length} product prices`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Price lists", href: "/price-lists" },
          { label: list.name },
        ]}
        actions={
          <Link href="/price-lists" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            Back
          </Link>
        }
        audit={{
          entityType: "price-list",
          entityId: list.id,
          meta: auditMetaFrom(stored ?? list),
        }}
      >
        <fieldset disabled={!canSavePriceList} className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4 disabled:opacity-100">
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Name</span>
            <input className={inputClass} value={list.name} onChange={(e) => onChange("name", e.target.value)} />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Schema</span>
            <input className={inputClass} value={list.schema} onChange={(e) => onChange("schema", e.target.value)} />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Valid from</span>
            <input className={inputClass} type="date" value={list.validFrom} onChange={(e) => onChange("validFrom", e.target.value)} />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Currency</span>
            <input className={inputClass} value={list.currency} onChange={(e) => onChange("currency", e.target.value)} />
          </label>
        </fieldset>

        <LineItemTable
          config={priceLineConfig}
          rows={list.lines}
          dropdowns={productDropdown}
          optionLabels={productLabels}
          onChange={(rows) => onChange("lines", rows)}
          readOnly={!canSavePriceList}
        />
        {saved && !hasUnsavedChanges ? <p className="mt-4 text-sm text-emerald-700">Saved</p> : null}

        <div className="mt-8 border-t border-slate-200 pt-8">
          <RecordTasksPanel entityType="price-list" entityId={list.id} entityLabel={list.name} />
        </div>
      </AppShell>
      <UnsavedChangesBar
        visible={hasUnsavedChanges && canSavePriceList}
        onSave={() => {
          upsertPriceList(list);
          setDraft(null);
          setSaved(true);
          showSuccessToast(SAVE_TOAST_MESSAGES.saved);
        }}
        onDiscard={() => {
          setDraft(null);
          setSaved(false);
        }}
      />
    </>
  );
}
