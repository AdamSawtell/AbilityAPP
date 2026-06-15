"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LineItemTable } from "@/components/line-item-table";
import { useReferenceData } from "@/lib/config-store";
import type { ContractRecord } from "@/lib/contract";
import {
  contractDateFields,
  contractHeaderFields,
  contractTabs,
  type ContractFieldDef,
} from "@/lib/contract-fields";
import {
  auditTableConfig,
  contractTabTableConfigs,
  type ContractLineCollectionKey,
  type ContractTabWithTable,
} from "@/lib/contract-line-tables";

function Field({
  field,
  value,
  onChange,
}: {
  field: ContractFieldDef;
  value: string;
  onChange: (key: keyof ContractRecord, value: string) => void;
}) {
  const { getOptions } = useReferenceData();
  const base =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20 disabled:bg-slate-50 disabled:text-slate-500";

  if (field.readOnly) {
    return <input className={base} value={value || "—"} readOnly disabled />;
  }

  if (field.type === "textarea") {
    return (
      <textarea
        className={`${base} min-h-[80px] resize-y`}
        value={value}
        onChange={(e) => onChange(field.key, e.target.value)}
      />
    );
  }

  if (field.type === "select" && field.optionsKey) {
    const options = getOptions(field.optionsKey);
    return (
      <select className={base} value={value} onChange={(e) => onChange(field.key, e.target.value)}>
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      className={base}
      type={field.type === "date" ? "date" : "text"}
      value={value}
      onChange={(e) => onChange(field.key, e.target.value)}
    />
  );
}

export function ContractTabbedView({
  contract,
  onChange,
  onLineItemsChange,
}: {
  contract: ContractRecord;
  onChange: (key: keyof ContractRecord, value: string) => void;
  onLineItemsChange: (key: ContractLineCollectionKey, rows: ContractRecord[ContractLineCollectionKey]) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "Overview";
  const tableTab = activeTab in contractTabTableConfigs ? (activeTab as ContractTabWithTable) : null;

  function setActiveTab(tab: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <nav className="shrink-0 lg:w-44">
        <div className="space-y-1 rounded-xl border border-slate-200 bg-slate-50/80 p-2">
          {contractTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                activeTab === tab
                  ? "bg-white font-medium text-[#b51266] shadow-sm ring-1 ring-[#f9a8d4]/60"
                  : "text-slate-600 hover:bg-white/70"
              }`}
            >
              {tab}
              {tab === "Audit" && contract.audit.length > 0 ? (
                <span className="rounded-full bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold">
                  {contract.audit.length}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </nav>

      <div className="min-w-0 flex-1 space-y-6">
        {activeTab === "Overview" ? (
          <>
            <section className="rounded-xl border-2 border-[#f9a8d4]/40 bg-[#fdf2f8]/30 p-5">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#b51266]">Key dates</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {contractDateFields.map((field) => (
                  <label key={field.key}>
                    <span className="mb-1.5 block text-xs font-medium text-slate-600">
                      {field.label}
                      {field.required ? <span className="text-[#d4147a]"> *</span> : null}
                    </span>
                    <Field field={field} value={contract[field.key] as string} onChange={onChange} />
                  </label>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">Contract details</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {contractHeaderFields.map((field) => (
                  <label key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                    <span className="mb-1.5 block text-xs font-medium text-slate-600">{field.label}</span>
                    <Field field={field} value={contract[field.key] as string} onChange={onChange} />
                  </label>
                ))}
              </div>
            </section>
          </>
        ) : null}

        {tableTab === "Audit" ? (
          <LineItemTable
            config={auditTableConfig}
            rows={contract.audit}
            onChange={(rows) => onLineItemsChange("audit", rows)}
          />
        ) : null}
      </div>
    </div>
  );
}
