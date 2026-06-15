"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ClientLocationsPanel } from "@/components/client-locations-panel";
import { ClientServiceAgreementsPanel } from "@/components/service-agreement-pages";
import { ClientPlanAssessmentPanel, ClientSupportPlanPanel } from "@/components/support-plan-panels";
import { LineItemTable } from "@/components/line-item-table";
import {
  activityTableConfig,
  alertTableConfig,
  clientTabTableConfigs,
  type ClientLineCollectionKey,
  type ClientTabWithTable,
} from "@/lib/client-line-tables";
import { useReferenceData } from "@/lib/config-store";
import {
  clientDropdowns,
  clientTabGroups,
  coreOverviewFields,
  profileSections,
  type ClientFieldDef,
  type ClientRecord,
} from "@/lib/client";

function Field({
  field,
  value,
  onChange,
}: {
  field: ClientFieldDef;
  value: string | boolean;
  onChange: (key: keyof ClientRecord, value: string | boolean) => void;
}) {
  const { getOptions } = useReferenceData();
  const base =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20 disabled:bg-slate-50 disabled:text-slate-500";

  if (field.readOnly) {
    return <input className={base} value={String(value || "—")} readOnly disabled />;
  }

  if (field.type === "textarea") {
    return (
      <textarea
        className={`${base} min-h-[80px] resize-y`}
        value={String(value ?? "")}
        onChange={(e) => onChange(field.key, e.target.value)}
      />
    );
  }

  if (field.type === "select" && field.optionsKey) {
    const options = getOptions(field.optionsKey) ?? clientDropdowns[field.optionsKey as keyof typeof clientDropdowns] ?? [];
    return (
      <select
        className={base}
        value={String(value ?? "")}
        onChange={(e) => onChange(field.key, e.target.value)}
      >
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
      type={field.type}
      value={String(value ?? "")}
      onChange={(e) => onChange(field.key, e.target.value)}
    />
  );
}

function FieldGrid({
  fields,
  client,
  onChange,
}: {
  fields: ClientFieldDef[];
  client: ClientRecord;
  onChange: (key: keyof ClientRecord, value: string | boolean) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => (
        <label key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
          <span className="mb-1.5 block text-xs font-medium text-slate-600">{field.label}</span>
          <Field field={field} value={client[field.key] as string | boolean} onChange={onChange} />
        </label>
      ))}
    </div>
  );
}

function ClientFullProfileForm({
  client,
  onChange,
}: {
  client: ClientRecord;
  onChange: (key: keyof ClientRecord, value: string | boolean) => void;
}) {
  return (
    <div className="space-y-6">
      {profileSections.map((section) => (
        <section key={section.title} className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">{section.title}</h3>
          <FieldGrid fields={section.fields} client={client} onChange={onChange} />
        </section>
      ))}
    </div>
  );
}

function tabCount(client: ClientRecord, tab: string, agreementCount: number, hasSupportPlan: boolean): number | null {
  if (tab === "Alerts") return client.alerts.length;
  if (tab === "Activity") return client.activity.length;
  if (tab === "Locations") return client.locations.length;
  if (tab === "Service agreements") return agreementCount;
  if (tab === "Support Plan") return hasSupportPlan ? 1 : 0;
  return null;
}

function ComingSoonPanel({ tab }: { tab: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
      <p className="text-sm font-medium text-slate-700">{tab}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        This tab will use the same editable line-item table as Alerts and Activity.
      </p>
    </div>
  );
}

export function ClientTabbedView({
  client,
  agreementCount,
  hasSupportPlan,
  onChange,
  onLineItemsChange,
}: {
  client: ClientRecord;
  agreementCount: number;
  hasSupportPlan: boolean;
  onChange: (key: keyof ClientRecord, value: string | boolean) => void;
  onLineItemsChange: (key: ClientLineCollectionKey, rows: ClientRecord[ClientLineCollectionKey]) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "Overview";
  const tableTab = activeTab in clientTabTableConfigs ? (activeTab as ClientTabWithTable) : null;

  function setActiveTab(tab: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <nav className="hidden shrink-0 lg:block lg:w-52 xl:w-56">
        <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          {clientTabGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.tabs.map((tab) => {
                  const count = tabCount(client, tab, agreementCount, hasSupportPlan);
                  const active = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                        active
                          ? "bg-white font-medium text-[#b51266] shadow-sm ring-1 ring-[#f9a8d4]/60"
                          : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
                      }`}
                    >
                      <span className="truncate">{tab}</span>
                      {count !== null && count > 0 ? (
                        <span className="shrink-0 rounded-full bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                          {count}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="min-w-0 flex-1">
        {activeTab === "Overview" ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Core details</h3>
            <p className="mb-4 text-sm text-slate-500">
              Key fields for day-to-day work. Open Full profile for everything else.
            </p>
            <FieldGrid fields={coreOverviewFields} client={client} onChange={onChange} />
          </div>
        ) : null}

        {activeTab === "Full profile" ? (
          <ClientFullProfileForm client={client} onChange={onChange} />
        ) : null}

        {tableTab === "Alerts" ? (
          <LineItemTable
            config={alertTableConfig}
            rows={client.alerts}
            onChange={(rows) => onLineItemsChange("alerts", rows)}
          />
        ) : null}

        {tableTab === "Activity" ? (
          <LineItemTable
            config={activityTableConfig}
            rows={client.activity}
            onChange={(rows) => onLineItemsChange("activity", rows)}
          />
        ) : null}

        {activeTab === "Locations" ? (
          <ClientLocationsPanel
            locations={client.locations}
            onChange={(rows) => onLineItemsChange("locations", rows)}
          />
        ) : null}

        {activeTab === "Support Plan" ? <ClientSupportPlanPanel clientId={client.id} /> : null}

        {activeTab === "Plan & Assessment" ? <ClientPlanAssessmentPanel clientId={client.id} /> : null}

        {activeTab === "Service agreements" ? (
          <ClientServiceAgreementsPanel clientId={client.id} clientName={client.name} searchKey={client.searchKey} />
        ) : null}

        {activeTab !== "Overview" &&
        activeTab !== "Full profile" &&
        activeTab !== "Locations" &&
        activeTab !== "Support Plan" &&
        activeTab !== "Plan & Assessment" &&
        activeTab !== "Service agreements" &&
        !tableTab ? (
          <ComingSoonPanel tab={activeTab} />
        ) : null}
      </div>
    </div>
  );
}
