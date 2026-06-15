"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { RecordTasksPanel } from "@/components/record-tasks-panel";
import { UnsavedChangesBar } from "@/components/unsaved-changes-bar";
import { useReferenceData } from "@/lib/config-store";
import type { ProductRecord } from "@/lib/product";
import { useData } from "@/lib/data-store";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20 disabled:bg-slate-50";

export function ProductListView() {
  const { products, priceLists } = useData();

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <p className="border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
        NDIS support products and services. Each product can be linked to a price list.
      </p>
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Search key</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">UOM</th>
            <th className="px-4 py-3">Price list</th>
            <th className="px-4 py-3">Active</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products.map((p) => {
            const pl = priceLists.find((l) => l.id === p.priceListId);
            return (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/products/${p.id}`} className="text-[#b51266] hover:underline">
                    {p.searchKey}
                  </Link>
                </td>
                <td className="px-4 py-3">{p.name}</td>
                <td className="px-4 py-3 text-slate-600">{p.productCategory}</td>
                <td className="px-4 py-3 text-slate-600">{p.uom}</td>
                <td className="px-4 py-3">
                  {pl ? (
                    <Link href={`/price-lists/${pl.id}`} className="text-slate-700 hover:underline">
                      {pl.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">{p.active ? "Yes" : "No"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ProductDetailView({ id }: { id: string }) {
  const { products, priceLists, upsertProduct } = useData();
  const { getOptions } = useReferenceData();
  const stored = products.find((p) => p.id === id);
  const [draft, setDraft] = useState<ProductRecord | null>(null);
  const [saved, setSaved] = useState(false);
  const product = draft ?? stored ?? null;
  const hasUnsavedChanges = Boolean(draft);
  const assignedList = product ? priceLists.find((l) => l.id === product.priceListId) : null;
  const priceLine = assignedList && product ? assignedList.lines.find((l) => l.productId === product.id) : null;

  if (!product) {
    return (
      <AppShell title="Product not found">
        <Link href="/products" className="text-[#b51266] hover:underline">
          Back to products
        </Link>
      </AppShell>
    );
  }

  function onChange<K extends keyof ProductRecord>(key: K, value: ProductRecord[K]) {
    const base = draft ?? stored;
    if (!base) return;
    setDraft({ ...base, [key]: value, updatedBy: "SuperUser" });
    setSaved(false);
  }

  return (
    <>
      <AppShell
        title={product.name}
        subtitle={`${product.searchKey} · ${product.productType}`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Products", href: "/products" },
          { label: product.searchKey },
        ]}
        actions={
          <Link href="/products" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            Back
          </Link>
        }
      >
        {priceLine ? (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/60 px-5 py-4">
            <p className="text-sm font-medium text-emerald-900">Price from {assignedList?.name}</p>
            <p className="mt-1 text-sm text-emerald-800">
              List ${priceLine.listPrice} · Standard ${priceLine.standardPrice} · Limit ${priceLine.limitPrice}
            </p>
          </div>
        ) : null}

        <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
          <Field label="Search key">
            <input className={inputClass} value={product.searchKey} onChange={(e) => onChange("searchKey", e.target.value)} />
          </Field>
          <Field label="Name">
            <input className={inputClass} value={product.name} onChange={(e) => onChange("name", e.target.value)} />
          </Field>
          <Field label="Product category">
            <select className={inputClass} value={product.productCategory} onChange={(e) => onChange("productCategory", e.target.value)}>
              {getOptions("productCategory").map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="UOM">
            <select className={inputClass} value={product.uom} onChange={(e) => onChange("uom", e.target.value)}>
              {getOptions("uom").map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Product type">
            <select className={inputClass} value={product.productType} onChange={(e) => onChange("productType", e.target.value)}>
              {getOptions("productType").map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Price list">
            <select className={inputClass} value={product.priceListId} onChange={(e) => onChange("priceListId", e.target.value)}>
              <option value="">None</option>
              {priceLists.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.name}
                </option>
              ))}
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={product.active} onChange={(e) => onChange("active", e.target.checked)} />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={product.sold} onChange={(e) => onChange("sold", e.target.checked)} />
            Sold
          </label>
          <Field label="NDIS support item">
            <input className={inputClass} value={product.ndisSupportItem ?? ""} onChange={(e) => onChange("ndisSupportItem", e.target.value)} />
          </Field>
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Description</span>
            <textarea
              className={`${inputClass} min-h-[80px] resize-y`}
              value={product.description}
              onChange={(e) => onChange("description", e.target.value)}
            />
          </label>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-8">
          <RecordTasksPanel
            entityType="product"
            entityId={product.id}
            entityLabel={`${product.searchKey} — ${product.name}`}
          />
        </div>

        {saved && !hasUnsavedChanges ? <p className="mt-4 text-sm text-emerald-700">Saved</p> : null}
      </AppShell>
      <UnsavedChangesBar
        visible={hasUnsavedChanges}
        onSave={() => {
          upsertProduct(product);
          setDraft(null);
          setSaved(true);
        }}
        onDiscard={() => {
          setDraft(null);
          setSaved(false);
        }}
      />
    </>
  );
}
