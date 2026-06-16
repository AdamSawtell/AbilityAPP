"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ClientGoalsPanel, ClientProgressReviewPanel } from "@/components/client-planning-panels";
import { ClientLocationsPanel } from "@/components/client-locations-panel";
import { ClientServiceAgreementsPanel } from "@/components/service-agreement-pages";
import { ClientPlanAssessmentPanel, ClientSupportPlanPanel } from "@/components/support-plan-panels";
import { LineItemTable } from "@/components/line-item-table";
import { RecordTasksPanel } from "@/components/record-tasks-panel";
import { detailTabsForRole, windowKeyForDetailTab } from "@/lib/access/catalog";
import { useAuth } from "@/lib/auth-store";
import {
  activityTableConfig,
  alertTableConfig,
  bpAssociationTableConfig,
  clientTabTableConfigs,
  consentTableConfig,
  contactActivityTableConfig,
  needRuleTableConfig,
  restrictivePracticeTableConfig,
  riskTableConfig,
  type ClientLineCollectionKey,
  type ClientTabWithTable,
} from "@/lib/client-line-tables";
import { useReferenceData } from "@/lib/config-store";
import { type ClientFieldDef, type ClientRecord } from "@/lib/client";
import { clientDropdowns, clientTabGroups, coreOverviewFields, profileSections } from "@/lib/client";

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
    const options =
      getOptions(field.optionsKey) ??
      (field.optionsKey in clientDropdowns
        ? clientDropdowns[field.optionsKey as keyof typeof clientDropdowns]
        : []) ??
      [];
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

function ClientTabIntro({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

function tabCount(
  client: ClientRecord,
  tab: string,
  agreementCount: number,
  hasSupportPlan: boolean,
  goalCount: number,
  progressReviewCount: number
): number | null {
  if (tab === "Alerts") return client.alerts.length;
  if (tab === "Activity") return client.activity.length;
  if (tab === "Locations") return client.locations.length;
  if (tab === "Restrictive Practices") return client.restrictivePractices?.length ?? 0;
  if (tab === "Consents and Legal Orders") return client.consents?.length ?? 0;
  if (tab === "Risks") return client.risks?.length ?? 0;
  if (tab === "BP Associations") return client.bpAssociations?.length ?? 0;
  if (tab === "Contact Activity") return client.contactActivity?.length ?? 0;
  if (tab === "Support Receiver Needs and Rules") return client.needsAndRules?.length ?? 0;
  if (tab === "Goals") return goalCount;
  if (tab === "Progress Review") return progressReviewCount;
  if (tab === "Service agreements") return agreementCount;
  if (tab === "Support Plan") return hasSupportPlan ? 1 : 0;
  return null;
}

export function ClientTabbedView({
  client,
  agreementCount,
  hasSupportPlan,
  goalCount = 0,
  progressReviewCount = 0,
  onChange,
  onLineItemsChange,
}: {
  client: ClientRecord;
  agreementCount: number;
  hasSupportPlan: boolean;
  goalCount?: number;
  progressReviewCount?: number;
  onChange: (key: keyof ClientRecord, value: string | boolean) => void;
  onLineItemsChange: (key: ClientLineCollectionKey, rows: ClientRecord[ClientLineCollectionKey]) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { session, canWindow } = useAuth();

  const allowedTabs = detailTabsForRole("clients", session?.windowKeys ?? []);
  const defaultTab = allowedTabs[0] ?? "Overview";
  const requestedTab = searchParams.get("tab") ?? defaultTab;
  const activeTab = allowedTabs.includes(requestedTab) ? requestedTab : defaultTab;
  const tableTab = activeTab in clientTabTableConfigs ? (activeTab as ClientTabWithTable) : null;

  const visibleGroups = clientTabGroups
    .map((group) => ({
      ...group,
      tabs: group.tabs.filter((tab) => allowedTabs.includes(tab)),
    }))
    .filter((group) => group.tabs.length > 0);

  function canClientTab(tab: string) {
    const key = windowKeyForDetailTab("clients", tab);
    return key ? canWindow(key) : false;
  }

  function setActiveTab(tab: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <nav className="hidden shrink-0 lg:block lg:w-52 xl:w-56">
        <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          {visibleGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.tabs.map((tab) => {
                  const count = tabCount(client, tab, agreementCount, hasSupportPlan, goalCount, progressReviewCount);
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
        <div className="mb-4 flex flex-wrap gap-2 lg:hidden">
          {allowedTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                activeTab === tab ? "bg-[#fdf2f8] text-[#b51266]" : "bg-slate-100 text-slate-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Overview" && canClientTab("Overview") ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Core details</h3>
            <p className="mb-4 text-sm text-slate-500">
              Key fields for day-to-day work. Open Full profile for everything else.
            </p>
            <FieldGrid fields={coreOverviewFields} client={client} onChange={onChange} />
          </div>
        ) : null}

        {activeTab === "Full profile" && canClientTab("Full profile") ? (
          <ClientFullProfileForm client={client} onChange={onChange} />
        ) : null}

        {tableTab === "Alerts" && canClientTab("Alerts") ? (
          <>
            <ClientTabIntro
              title="Alerts"
              description="Flag risks, incidents, and temporary warnings. Items marked Show as alert appear in the client header and register."
            />
            <LineItemTable
              config={alertTableConfig}
              rows={client.alerts}
              onChange={(rows) => onLineItemsChange("alerts", rows)}
            />
          </>
        ) : null}

        {tableTab === "Activity" && canClientTab("Activity") ? (
          <>
            <ClientTabIntro
              title="Activity"
              description="Log calls, visits, and notes for this support receiver. Activity from enquiry conversion is carried forward here."
            />
            <LineItemTable
              config={activityTableConfig}
              rows={client.activity}
              onChange={(rows) => onLineItemsChange("activity", rows)}
            />
          </>
        ) : null}

        {tableTab === "Restrictive Practices" && canClientTab("Restrictive Practices") ? (
          <>
            <ClientTabIntro
              title="Restrictive practices"
              description="Record authorised restrictive practices under the NDIS framework. Mark Show as alert when staff must see this before delivering support."
            />
            <LineItemTable
              config={restrictivePracticeTableConfig}
              rows={client.restrictivePractices ?? []}
              onChange={(rows) => onLineItemsChange("restrictivePractices", rows)}
            />
          </>
        ) : null}

        {tableTab === "Consents and Legal Orders" && canClientTab("Consents and Legal Orders") ? (
          <>
            <ClientTabIntro
              title="Consents and legal orders"
              description="Track photo consent, information sharing, guardianship, and other legal orders. Items marked Show as alert roll up to the consent alert list on the client profile."
            >
              {client.consentAlertList ? (
                <p className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                  <span className="font-medium">Consent alert list: </span>
                  {client.consentAlertList}
                </p>
              ) : null}
            </ClientTabIntro>
            <LineItemTable
              config={consentTableConfig}
              rows={client.consents ?? []}
              onChange={(rows) => onLineItemsChange("consents", rows)}
            />
          </>
        ) : null}

        {tableTab === "Risks" && canClientTab("Risks") ? (
          <>
            <ClientTabIntro
              title="Risks"
              description="Formal risk register for this client. Items marked Show as alert roll up to the risk alerts field on the profile."
            >
              {client.riskAlerts ? (
                <p className="rounded-lg border border-red-200/80 bg-red-50 px-3 py-2 text-sm text-red-950">
                  <span className="font-medium">Risk alerts: </span>
                  {client.riskAlerts}
                </p>
              ) : null}
            </ClientTabIntro>
            <LineItemTable
              config={riskTableConfig}
              rows={client.risks ?? []}
              onChange={(rows) => onLineItemsChange("risks", rows)}
            />
          </>
        ) : null}

        {tableTab === "BP Associations" && canClientTab("BP Associations") ? (
          <>
            <ClientTabIntro
              title="BP associations"
              description="Link guardians, family, referrers, and other contacts associated with this support receiver."
            />
            <LineItemTable
              config={bpAssociationTableConfig}
              rows={client.bpAssociations ?? []}
              onChange={(rows) => onLineItemsChange("bpAssociations", rows)}
            />
          </>
        ) : null}

        {tableTab === "Contact Activity" && canClientTab("Contact Activity") ? (
          <>
            <ClientTabIntro
              title="Contact activity"
              description="Log outreach with associated contacts. This is separate from the core Activity tab for direct client case notes."
            />
            <LineItemTable
              config={contactActivityTableConfig}
              rows={client.contactActivity ?? []}
              onChange={(rows) => onLineItemsChange("contactActivity", rows)}
            />
          </>
        ) : null}

        {tableTab === "Support Receiver Needs and Rules" && canClientTab("Support Receiver Needs and Rules") ? (
          <>
            <ClientTabIntro
              title="Support receiver needs and rules"
              description="Document daily living rules, support needs, and instructions staff must follow when delivering support."
            />
            <LineItemTable
              config={needRuleTableConfig}
              rows={client.needsAndRules ?? []}
              onChange={(rows) => onLineItemsChange("needsAndRules", rows)}
            />
          </>
        ) : null}

        {activeTab === "Locations" && canClientTab("Locations") ? (
          <ClientLocationsPanel
            locations={client.locations}
            onChange={(rows) => onLineItemsChange("locations", rows)}
          />
        ) : null}

        {activeTab === "Support Plan" && canClientTab("Support Plan") ? <ClientSupportPlanPanel clientId={client.id} /> : null}

        {activeTab === "Goals" && canClientTab("Goals") ? (
          <>
            <ClientTabIntro
              title="Goals"
              description="Goals from the active support plan. Changes save to the support plan record."
            />
            <ClientGoalsPanel clientId={client.id} />
          </>
        ) : null}

        {activeTab === "Progress Review" && canClientTab("Progress Review") ? (
          <>
            <ClientTabIntro
              title="Progress review"
              description="Record progress reviews against support plan goals."
            />
            <ClientProgressReviewPanel clientId={client.id} />
          </>
        ) : null}

        {activeTab === "Plan & Assessment" && canClientTab("Plan & Assessment") ? (
          <ClientPlanAssessmentPanel clientId={client.id} />
        ) : null}

        {activeTab === "Service agreements" && canClientTab("Service agreements") ? (
          <ClientServiceAgreementsPanel clientId={client.id} clientName={client.name} searchKey={client.searchKey} />
        ) : null}

        {activeTab === "Requests" && canClientTab("Requests") ? (
          <RecordTasksPanel entityType="client" entityId={client.id} entityLabel={`${client.searchKey} — ${client.name}`} />
        ) : null}
      </div>
    </div>
  );
}
