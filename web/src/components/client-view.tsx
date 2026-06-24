"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ClientOverviewDocumentsPanel } from "@/components/client-overview-documents-panel";
import { ClientConsentSummary } from "@/components/client-consent-summary";
import { ClientPlanBudgetTextImportPanel } from "@/components/client-plan-budget-text-import-panel";
import { ClientPlanBudgetImportPanel } from "@/components/client-plan-budget-import-panel";
import { ClientPlanBudgetClaimedPanel } from "@/components/client-plan-budget-claimed-panel";
import { ClientPlanGatewayPanel } from "@/components/client-plan-gateway-panel";
import { ClientPlanBudgetSummary } from "@/components/client-plan-budget-summary";
import { ClientPlanBudgetWizard } from "@/components/client-plan-budget-wizard";
import { ClientMonthlyServicePlanPanel } from "@/components/service-planning-pages";
import { ClientRosterOfCarePanel } from "@/components/client-roc-panel";
import { ClientGoalsPanel, ClientProgressReviewPanel } from "@/components/client-planning-panels";
import { ClientLocationsPanel } from "@/components/client-locations-panel";
import { ClientServiceAgreementsPanel } from "@/components/service-agreement-pages";
import { ClientServiceBookingsPanel } from "@/components/service-booking-pages";
import { ClientPlanAssessmentPanel, ClientSupportPlanPanel } from "@/components/support-plan-panels";
import { LineItemTable } from "@/components/line-item-table";
import { ClientPortalRequestsPanel } from "@/components/client-portal-requests-panel";
import { RecordTasksPanel } from "@/components/record-tasks-panel";
import { RecordIncidentsPanel } from "@/components/record-incidents-panel";
import { allowedDetailTabsFromGroups, resolveDetailWindowKey } from "@/lib/access/catalog";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import {
  businessPartnerDirectoryOptions,
  businessPartnerOptionLabels,
  findBusinessPartnerById,
} from "@/lib/business-partner";
import {
  activityTableConfig,
  alertTableConfig,
  bpAssociationTableConfig,
  clientTabTableConfigs,
  consentTableConfig,
  contactActivityTableConfig,
  needRuleTableConfig,
  planBudgetTableConfig,
  restrictivePracticeTableConfig,
  riskTableConfig,
  type ClientLineCollectionKey,
  type ClientTabWithTable,
} from "@/lib/client-line-tables";
import { useReferenceData } from "@/lib/config-store";
import { type ClientFieldDef, type ClientRecord } from "@/lib/client";
import { RecordPhotoPanel } from "@/components/record-photo-panel";
import { clientDropdowns, clientTabGroups, coreOverviewFields, profileSections } from "@/lib/client";

import { withDraftHighlight } from "@/lib/ai/draft-field-highlight";

function Field({
  field,
  value,
  onChange,
  highlightFields,
}: {
  field: ClientFieldDef;
  value: string | boolean;
  onChange: (key: keyof ClientRecord, value: string | boolean) => void;
  highlightFields?: Set<string>;
}) {
  const { getOptions } = useReferenceData();
  const { businessPartners } = useData();
  const base =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20 disabled:bg-slate-50 disabled:text-slate-500";
  const fieldClass = withDraftHighlight(base, String(field.key), highlightFields);

  if (field.readOnly) {
    return <input className={fieldClass} value={String(value || "—")} readOnly disabled />;
  }

  if (field.type === "textarea") {
    return (
      <textarea
        className={`${fieldClass} min-h-[80px] resize-y`}
        value={String(value ?? "")}
        onChange={(e) => onChange(field.key, e.target.value)}
      />
    );
  }

  if (field.type === "select" && field.optionsKey) {
    const partnerLabels =
      field.optionsKey === "businessPartnerDirectory" ? businessPartnerOptionLabels(businessPartners) : undefined;
    const options =
      field.optionsKey === "businessPartnerDirectory"
        ? businessPartnerDirectoryOptions(businessPartners, [String(value ?? "")])
        : getOptions(field.optionsKey) ??
          (field.optionsKey in clientDropdowns
            ? clientDropdowns[field.optionsKey as keyof typeof clientDropdowns]
            : []) ??
          [];
    return (
      <select
        className={fieldClass}
        value={String(value ?? "")}
        onChange={(e) => onChange(field.key, e.target.value)}
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {partnerLabels?.[o] ?? o}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      className={fieldClass}
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
  highlightFields,
}: {
  fields: ClientFieldDef[];
  client: ClientRecord;
  onChange: (key: keyof ClientRecord, value: string | boolean) => void;
  highlightFields?: Set<string>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => (
        <label key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
          <span className="mb-1.5 block text-xs font-medium text-slate-600">{field.label}</span>
          <Field field={field} value={client[field.key] as string | boolean} onChange={onChange} highlightFields={highlightFields} />
        </label>
      ))}
    </div>
  );
}

function ReadOnlyFieldGrid({
  fields,
  client,
}: {
  fields: ClientFieldDef[];
  client: ClientRecord;
}) {
  const { businessPartners } = useData();
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
          <dt className="text-xs font-medium text-slate-500">{field.label}</dt>
          <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-900">
            {(() => {
              const raw = client[field.key] as string | boolean;
              if (typeof raw === "boolean") return raw ? "Yes" : "No";
              const text = String(raw ?? "").trim();
              if (!text) return "—";
              if (field.key === "planManagerPartnerId") {
                const partner = findBusinessPartnerById(businessPartners, text);
                return partner ? `${partner.searchKey} — ${partner.partnerType}` : text;
              }
              return text;
            })()}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ClientFullProfileForm({
  client,
  onChange,
  readOnly = false,
}: {
  client: ClientRecord;
  onChange: (key: keyof ClientRecord, value: string | boolean) => void;
  readOnly?: boolean;
}) {
  if (readOnly) {
    return (
      <div className="space-y-6">
        {profileSections.map((section) => (
          <section key={section.title} className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">{section.title}</h3>
            <ReadOnlyFieldGrid fields={section.fields} client={client} />
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RecordPhotoPanel
        pictureUrl={client.pictureUrl}
        onChange={(url) => onChange("pictureUrl", url)}
        description="Profile photo for rosters, handover, and participant recognition."
      />
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
  bookingCount: number,
  hasSupportPlan: boolean,
  goalCount: number,
  progressReviewCount: number,
  incidentCount: number,
  monthlyPlanCount?: number,
  rocCount?: number
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
  if (tab === "Plan budget") return client.planBudgets?.length ?? 0;
  if (tab === "Monthly service plan") return monthlyPlanCount ?? 0;
  if (tab === "Roster of care") return rocCount ?? 0;
  if (tab === "Goals") return goalCount;
  if (tab === "Progress Review") return progressReviewCount;
  if (tab === "Service agreements") return agreementCount;
  if (tab === "Service bookings") return bookingCount;
  if (tab === "Support Plan") return hasSupportPlan ? 1 : 0;
  if (tab === "Incidents") return incidentCount;
  return null;
}

export function ClientTabbedView({
  client,
  agreementCount,
  bookingCount = 0,
  hasSupportPlan,
  goalCount = 0,
  progressReviewCount = 0,
  onChange,
  onLineItemsChange,
  highlightFields,
}: {
  client: ClientRecord;
  agreementCount: number;
  bookingCount?: number;
  hasSupportPlan: boolean;
  goalCount?: number;
  progressReviewCount?: number;
  onChange: (key: keyof ClientRecord, value: string | boolean) => void;
  onLineItemsChange: (key: ClientLineCollectionKey, rows: ClientRecord[ClientLineCollectionKey]) => void;
  highlightFields?: Set<string>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { session, canWindow, canWriteWindow } = useAuth();
  const { getIncidentsForClient, monthlyServicePlans, rosterOfCares, businessPartners } = useData();
  const bpAssociationDropdowns = useMemo(
    () => ({
      ...clientDropdowns,
      businessPartnerDirectory: businessPartnerDirectoryOptions(
        businessPartners,
        (client.bpAssociations ?? []).map((row) => row.partnerId)
      ),
    }),
    [businessPartners, client.bpAssociations]
  );
  const bpAssociationOptionLabels = useMemo(
    () => businessPartnerOptionLabels(businessPartners),
    [businessPartners]
  );

  const allowedTabs = allowedDetailTabsFromGroups("clients", clientTabGroups, session?.windowKeys ?? []);
  const incidentCount = getIncidentsForClient(client.id).length;
  const monthlyPlanCount = monthlyServicePlans.filter((p) => p.clientId === client.id).length;
  const rocCount = rosterOfCares.filter((r) => r.clientId === client.id && r.status !== "Archived").length;
  const defaultTab = allowedTabs[0] ?? "Overview";
  const coachSave = searchParams.get("coachSave") === "1";
  const requestedTab =
    searchParams.get("tab") ??
    (coachSave && allowedTabs.includes("Activity") ? "Activity" : defaultTab);
  const activeTab = allowedTabs.includes(requestedTab) ? requestedTab : defaultTab;
  const tableTab = activeTab in clientTabTableConfigs ? (activeTab as ClientTabWithTable) : null;

  useEffect(() => {
    if (searchParams.get("coachSave") !== "1") return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("coachSave");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const visibleGroups = clientTabGroups
    .map((group) => ({
      ...group,
      tabs: group.tabs.filter((tab) => allowedTabs.includes(tab)),
    }))
    .filter((group) => group.tabs.length > 0);

  function canClientTab(tab: string) {
    const key = resolveDetailWindowKey("clients", tab);
    return key ? canWindow(key) : false;
  }

  function canWriteClientTab(tab: string) {
    const key = resolveDetailWindowKey("clients", tab);
    return key ? canWriteWindow(key) : false;
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
                  const count = tabCount(
                    client,
                    tab,
                    agreementCount,
                    bookingCount,
                    hasSupportPlan,
                    goalCount,
                    progressReviewCount,
                    incidentCount,
                    monthlyPlanCount,
                    rocCount
                  );
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
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Core details</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Read-only snapshot for day-to-day work. Use Full profile or your AI assistant to edit fields.
                </p>
              </div>
              {canClientTab("Full profile") ? (
                <button
                  type="button"
                  onClick={() => setActiveTab("Full profile")}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-[#b51266] shadow-sm hover:bg-[#fdf2f8]"
                >
                  Edit on Full profile
                </button>
              ) : null}
            </div>
            <ReadOnlyFieldGrid fields={coreOverviewFields} client={client} />
            {(client.planBudgets?.length ?? 0) > 0 && canClientTab("Plan budget") ? (
              <div className="mt-6 border-t border-slate-100 pt-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-900">Plan utilisation</h4>
                  <button
                    type="button"
                    onClick={() => setActiveTab("Plan budget")}
                    className="text-sm font-medium text-[#b51266] hover:underline"
                  >
                    Open Plan budget
                  </button>
                </div>
                <ClientPlanBudgetSummary rows={client.planBudgets ?? []} />
              </div>
            ) : null}
            {(client.consents?.length ?? 0) > 0 && canClientTab("Consents and Legal Orders") ? (
              <div className="mt-6 border-t border-slate-100 pt-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-900">Core consents</h4>
                  <button
                    type="button"
                    onClick={() => setActiveTab("Consents and Legal Orders")}
                    className="text-sm font-medium text-[#b51266] hover:underline"
                  >
                    Open consents
                  </button>
                </div>
                <ClientConsentSummary consents={client.consents ?? []} />
              </div>
            ) : null}
            <ClientOverviewDocumentsPanel client={client} />
          </div>
        ) : null}

        {activeTab === "Full profile" && canClientTab("Full profile") ? (
          <ClientFullProfileForm client={client} onChange={onChange} readOnly={!canWriteClientTab("Full profile")} />
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
              readOnly={!canWriteClientTab("Alerts")}
              onChange={(rows) => onLineItemsChange("alerts", rows)}
            />
          </>
        ) : null}

        {tableTab === "Activity" && canClientTab("Activity") ? (
          <>
            <ClientTabIntro
              title="Activity"
              description="Log calls, visits, and notes for this support receiver. The list shows date, type, and subject — click a row to open the full editor. Activity from enquiry conversion is carried forward here."
            />
            <LineItemTable
              config={activityTableConfig}
              rows={client.activity}
              readOnly={!canWriteClientTab("Activity")}
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
              readOnly={!canWriteClientTab("Restrictive Practices")}
              onChange={(rows) => onLineItemsChange("restrictivePractices", rows)}
            />
          </>
        ) : null}

        {tableTab === "Consents and Legal Orders" && canClientTab("Consents and Legal Orders") ? (
          <>
            <ClientTabIntro
              title="Consents and legal orders"
              description="Track the three core NDIS consents — service delivery, information sharing, and photography — plus guardianship and other legal orders."
            >
              <ClientConsentSummary consents={client.consents ?? []} />
              {client.consentAlertList ? (
                <p className="mt-3 rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                  <span className="font-medium">Consent alert list: </span>
                  {client.consentAlertList}
                </p>
              ) : null}
            </ClientTabIntro>
            <LineItemTable
              config={consentTableConfig}
              rows={client.consents ?? []}
              readOnly={!canWriteClientTab("Consents and Legal Orders")}
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
              readOnly={!canWriteClientTab("Risks")}
              onChange={(rows) => onLineItemsChange("risks", rows)}
            />
          </>
        ) : null}

        {tableTab === "BP Associations" && canClientTab("BP Associations") ? (
          <>
            <ClientTabIntro
              title="BP associations"
              description="Link guardians, family, referrers, plan managers, and vendors. Pick from the business partner directory or enter a free-text name."
            />
            <LineItemTable
              config={bpAssociationTableConfig}
              rows={client.bpAssociations ?? []}
              readOnly={!canWriteClientTab("BP Associations")}
              dropdowns={bpAssociationDropdowns}
              optionLabels={bpAssociationOptionLabels}
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
              readOnly={!canWriteClientTab("Contact Activity")}
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
              readOnly={!canWriteClientTab("Support Receiver Needs and Rules")}
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

        {activeTab === "Incidents" && canClientTab("Incidents") ? (
          <RecordIncidentsPanel
            clientId={client.id}
            entityLabel={`${client.searchKey} — ${client.name}`}
          />
        ) : null}

        {activeTab === "Support Plan" && canClientTab("Support Plan") ? <ClientSupportPlanPanel client={client} /> : null}

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

        {activeTab === "Plan budget" && canClientTab("Plan budget") ? (
          <>
            <ClientTabIntro
              title="Plan budget"
              description="Track NDIS plan allocations by support budget and category. Claimed amounts are entered manually until billing integration is live."
            >
              <ClientPlanBudgetWizard
                rows={client.planBudgets ?? []}
                readOnly={!canWriteClientTab("Plan budget")}
                onApply={(rows) => onLineItemsChange("planBudgets", rows)}
              />
              <div className="mt-3">
                <ClientPlanBudgetSummary rows={client.planBudgets ?? []} />
              </div>
            </ClientTabIntro>
            <ClientPlanBudgetImportPanel
              rows={client.planBudgets ?? []}
              readOnly={!canWriteClientTab("Plan budget")}
              onApply={(rows) => onLineItemsChange("planBudgets", rows)}
            />
            <ClientPlanBudgetTextImportPanel
              rows={client.planBudgets ?? []}
              readOnly={!canWriteClientTab("Plan budget")}
              onApply={(rows) => onLineItemsChange("planBudgets", rows)}
            />
            <ClientPlanGatewayPanel
              client={client}
              rows={client.planBudgets ?? []}
              canSync={canWriteClientTab("Plan budget")}
              onApply={(rows) => onLineItemsChange("planBudgets", rows)}
            />
            <ClientPlanBudgetClaimedPanel
              clientId={client.id}
              rows={client.planBudgets ?? []}
              readOnly={!canWriteClientTab("Plan budget")}
              onApply={(rows) => onLineItemsChange("planBudgets", rows)}
            />
            <LineItemTable
              config={planBudgetTableConfig}
              rows={client.planBudgets ?? []}
              readOnly={!canWriteClientTab("Plan budget")}
              onChange={(rows) => onLineItemsChange("planBudgets", rows)}
            />
          </>
        ) : null}

        {activeTab === "Monthly service plan" && canClientTab("Monthly service plan") ? (
          <>
            <ClientTabIntro
              title="Monthly service plan"
              description="Plan monthly hours and spend against the participant's NDIS plan budget before rostering and bookings."
            />
            <ClientMonthlyServicePlanPanel clientId={client.id} />
          </>
        ) : null}

        {activeTab === "Roster of care" && canClientTab("Roster of care") ? (
          <>
            <ClientTabIntro
              title="Roster of care"
              description="Weekly care requirement template — compare required hours to rostered shifts before publishing."
            />
            <ClientRosterOfCarePanel clientId={client.id} />
          </>
        ) : null}

        {activeTab === "Plan & Assessment" && canClientTab("Plan & Assessment") ? (
          <ClientPlanAssessmentPanel clientId={client.id} />
        ) : null}

        {activeTab === "Service agreements" && canClientTab("Service agreements") ? (
          <ClientServiceAgreementsPanel clientId={client.id} clientName={client.name} searchKey={client.searchKey} />
        ) : null}

        {activeTab === "Service bookings" && canClientTab("Service bookings") ? (
          <ClientServiceBookingsPanel clientId={client.id} clientName={client.name} searchKey={client.searchKey} />
        ) : null}

        {activeTab === "Requests" && canClientTab("Requests") ? (
          <div className="space-y-8">
            <ClientPortalRequestsPanel clientId={client.id} />
            <RecordTasksPanel entityType="client" entityId={client.id} entityLabel={`${client.searchKey} — ${client.name}`} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
