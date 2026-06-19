"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LineItemTable } from "@/components/line-item-table";
import { IncidentNdisChecklist } from "@/components/incident-ndis-checklist";
import { IncidentEvidenceUpload } from "@/components/incident-evidence-upload";
import { RecordTasksPanel } from "@/components/record-tasks-panel";
import { ClientRecordLink, EmployeeRecordLink, LocationRecordLink } from "@/components/record-link";
import { TaskEntitySearchPicker } from "@/components/task-entity-search";
import { detailTabsForRole, resolveDetailWindowKey } from "@/lib/access/catalog";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { accountableManagerForIncident } from "@/lib/org-structure-resolver";
import { useOrgStructure } from "@/lib/org-structure-store";
import {
  canPerformIncidentManagerReview,
  canCloseReportableIncident,
  incidentStatusOptionsForUser,
} from "@/lib/incident-manager-access";
import {
  incidentActionTableConfig,
  incidentEvidenceTableConfig,
  incidentNotificationTableConfig,
  incidentPartyTableConfig,
} from "@/lib/incident-line-tables";
import {
  canAdvanceToCommissionNotified,
  canAdvanceToManagerReview,
  computeNdisReportDeadline,
  formatDisplayDateTime,
  incidentCategoryOptions,
  incidentServiceTypeOptions,
  incidentSeverityOptions,
  incidentTabGroups,
  isNdisReportOverdue,
  ndisDeadlineLabel,
  ndisReportableTypeOptions,
  showRestrictivePracticeLink,
  type IncidentActionRow,
  type IncidentEvidenceRow,
  type IncidentNotificationRow,
  type IncidentPartyRow,
  type IncidentRecord,
} from "@/lib/incident";
import { incidentDropdowns } from "@/lib/reference-data";
import type { TaskEntityOption } from "@/lib/task-entities";
import { useTaskEntityIndex } from "@/lib/task-entities";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function NdisComplianceBanner({ record }: { record: IncidentRecord }) {
  if (!record.isReportable) return null;
  const overdue = isNdisReportOverdue(record);
  const tone = record.ndisNotifiedAt
    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
    : overdue
      ? "border-rose-200 bg-rose-50 text-rose-900"
      : "border-amber-200 bg-amber-50 text-amber-900";

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${tone}`}>
      <p className="font-medium">{ndisDeadlineLabel(record)}</p>
      <p className="mt-1 text-xs opacity-90">
        {record.reportableType || "Select a reportable incident type."}
        {record.reportDeadlineAt ? ` · Due ${formatDisplayDateTime(record.reportDeadlineAt)}` : ""}
        {record.ndisNotifiedAt ? ` · Notified ${formatDisplayDateTime(record.ndisNotifiedAt)}` : ""}
      </p>
      <p className="mt-2 text-xs opacity-80">
        NDIS Quality and Safeguards: most reportable incidents must be notified within 24 hours of becoming aware.
        Unauthorised restrictive practices without harm may allow 5 business days.
      </p>
    </div>
  );
}

function LocationSearchPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (locationId: string) => void;
}) {
  const { locations } = useData();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const selected = locations.find((l) => l.id === value);

  const results = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return locations
      .filter((l) => `${l.searchKey} ${l.name}`.toLowerCase().includes(q))
      .slice(0, 8);
  }, [deferredQuery, locations]);

  return (
    <div className="space-y-2">
      {selected ? (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Location</p>
            <p className="truncate text-sm font-medium text-slate-900">
              {selected.searchKey} — {selected.name}
            </p>
          </div>
          <button type="button" className="text-xs text-slate-500 hover:text-slate-800" onClick={() => onChange("")}>
            Clear
          </button>
        </div>
      ) : (
        <>
          <input
            className={inputClass}
            type="search"
            placeholder="Type at least 2 characters to search locations…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {results.length > 0 ? (
            <ul className="max-h-48 overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm">
              {results.map((loc) => (
                <li key={loc.id}>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                    onClick={() => {
                      onChange(loc.id);
                      setQuery("");
                    }}
                  >
                    {loc.searchKey} — {loc.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
    </div>
  );
}

export function IncidentTabbedView({
  record,
  onChange,
  onPartiesChange,
  onActionsChange,
  onNotificationsChange,
  onEvidenceChange,
  onWorkflowAdvance,
}: {
  record: IncidentRecord;
  onChange: (key: keyof IncidentRecord, value: string | boolean) => void;
  onPartiesChange: (rows: IncidentPartyRow[]) => void;
  onActionsChange: (rows: IncidentActionRow[]) => void;
  onNotificationsChange: (rows: IncidentNotificationRow[]) => void;
  onEvidenceChange: (rows: IncidentEvidenceRow[]) => void;
  onWorkflowAdvance?: (step: "manager_review" | "commission_notified") => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { session, canWindow, canWriteWindow, users } = useAuth();
  const { clients, employees, locations, getTasksByEntity } = useData();
  const { positions, assignments } = useOrgStructure();
  const entityIndex = useTaskEntityIndex();

  const accountableManager = useMemo(() => {
    const byId = new Map(employees.map((e) => [e.id, e]));
    return accountableManagerForIncident(record, positions, assignments, byId);
  }, [record, positions, assignments, employees]);

  const reviewAccess = useMemo(() => {
    const userEmployeeId = users.find((u) => u.id === session?.userId)?.employeeBpId ?? "";
    return {
      userEmployeeId,
      canOverride: canWindow("incident-manager-override"),
    };
  }, [users, session?.userId, canWindow]);

  const canManagerReview = canPerformIncidentManagerReview(
    accountableManager?.employeeId,
    reviewAccess
  );
  const allowedStatuses = incidentStatusOptionsForUser(
    record,
    reviewAccess,
    accountableManager?.employeeId
  );
  const reportableCloseBlocked =
    record.isReportable && !canCloseReportableIncident(record, reviewAccess);

  const taskCount = getTasksByEntity("incident", record.id).length;
  const allowedTabs = detailTabsForRole("incidents", session?.windowKeys ?? []);
  const defaultTab = allowedTabs[0] ?? "Overview";
  const requestedTab = searchParams.get("tab") ?? defaultTab;
  const activeTab = allowedTabs.includes(requestedTab as (typeof allowedTabs)[number])
    ? requestedTab
    : defaultTab;

  const visibleGroups = incidentTabGroups
    .map((group) => ({
      ...group,
      tabs: group.tabs.filter((tab) => allowedTabs.includes(tab)),
    }))
    .filter((group) => group.tabs.length > 0);

  const primaryClient = clients.find((c) => c.id === record.primaryClientId);
  const primaryEmployee = employees.find((e) => e.id === record.primaryEmployeeId);
  const primaryLocation = locations.find((l) => l.id === record.primaryLocationId);
  const clientRestrictivePractices = primaryClient?.restrictivePractices ?? [];

  function setActiveTab(tab: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function canIncidentTab(tab: string) {
    const key = resolveDetailWindowKey("incidents", tab);
    return key ? canWindow(key) : false;
  }

  function canWriteIncidentTab(tab: string) {
    const key = resolveDetailWindowKey("incidents", tab);
    return key ? canWriteWindow(key) : false;
  }

  function clientPickerValue(): TaskEntityOption | null {
    if (!record.primaryClientId || !primaryClient) return null;
    return {
      entityType: "client",
      entityId: record.primaryClientId,
      label: `${primaryClient.searchKey} — ${primaryClient.name}`,
    };
  }

  function employeePickerValue(): TaskEntityOption | null {
    if (!record.primaryEmployeeId || !primaryEmployee) return null;
    return {
      entityType: "employee",
      entityId: record.primaryEmployeeId,
      label: `${primaryEmployee.searchKey} — ${primaryEmployee.name}`,
    };
  }

  function onReportableToggle(checked: boolean) {
    onChange("isReportable", checked);
    if (!checked) {
      onChange("reportableType", "");
    }
  }

  function onReportableTypeChange(value: string) {
    onChange("reportableType", value);
    const deadline = computeNdisReportDeadline(
      record.awareAt,
      value as IncidentRecord["reportableType"],
      record.restrictivePracticeCausedHarm
    );
    onChange("reportDeadlineAt", deadline);
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
                  const count =
                    tab === "Parties & links"
                      ? record.parties.length
                      : tab === "Investigation"
                        ? record.actions.length + record.evidence.length + taskCount
                        : tab === "Notifications"
                          ? record.notifications.length
                          : null;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition ${
                        activeTab === tab
                          ? "bg-white font-medium text-[#b51266] shadow-sm ring-1 ring-slate-200"
                          : "text-slate-600 hover:bg-white/70"
                      }`}
                    >
                      <span>{tab}</span>
                      {count !== null && count > 0 ? (
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
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

      <div className="min-w-0 flex-1 space-y-6">
        <div className="flex flex-wrap gap-2 lg:hidden">
          {allowedTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                activeTab === tab ? "bg-[#d4147a] text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Overview" && canIncidentTab("Overview") ? (
          <fieldset disabled={!canWriteIncidentTab("Overview")} className="space-y-6 disabled:opacity-100">
            <NdisComplianceBanner record={record} />

            {onWorkflowAdvance && record.status !== "Closed" && record.status !== "Draft" ? (
              <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
                {accountableManager ? (
                  <p className="text-sm text-slate-700">
                    <span className="font-medium text-slate-900">Accountable manager: </span>
                    {accountableManager.employeeName}
                    {accountableManager.positionTitle ? (
                      <span className="text-slate-500"> ({accountableManager.positionTitle})</span>
                    ) : null}
                    {accountableManager.reason === "parent_escalation" ? (
                      <span className="ml-1 text-xs text-amber-700">— escalated from vacant parent role</span>
                    ) : null}
                    {accountableManager.reason === "acting" ? (
                      <span className="ml-1 text-xs text-sky-700">— acting assignment</span>
                    ) : null}
                  </p>
                ) : null}
                {!canManagerReview && record.isReportable && record.status === "Submitted" ? (
                  <p className="text-xs text-amber-800">
                    Only the accountable manager
                    {accountableManager ? ` (${accountableManager.employeeName})` : ""} or someone with
                    manager review override can sign off reportable incidents.
                  </p>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Manager workflow</p>
                {canAdvanceToManagerReview(record) && canManagerReview ? (
                  <button
                    type="button"
                    onClick={() => onWorkflowAdvance("manager_review")}
                    className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700"
                  >
                    Mark manager reviewed
                  </button>
                ) : null}
                {canAdvanceToCommissionNotified(record) &&
                record.status !== "Commission notified" &&
                canManagerReview ? (
                  <button
                    type="button"
                    onClick={() => onWorkflowAdvance("commission_notified")}
                    className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
                  >
                    Mark commission notified
                  </button>
                ) : null}
                {record.managerReviewedAt ? (
                  <span className="text-xs text-slate-500">
                    Manager reviewed {formatDisplayDateTime(record.managerReviewedAt)}
                    {record.managerReviewedBy ? ` by ${record.managerReviewedBy}` : ""}
                  </span>
                ) : null}
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" className="sm:col-span-2">
                <input
                  className={inputClass}
                  value={record.title}
                  onChange={(e) => onChange("title", e.target.value)}
                  placeholder="Brief summary of what happened"
                />
              </Field>
              <Field label="Status">
                <select
                  className={inputClass}
                  value={record.status}
                  onChange={(e) => onChange("status", e.target.value)}
                >
                  {allowedStatuses.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                {reportableCloseBlocked ? (
                  <p className="mt-1 text-xs text-amber-800">
                    Reportable incidents must be manager reviewed before they can be closed.
                  </p>
                ) : null}
              </Field>
              <Field label="Severity">
                <select
                  className={inputClass}
                  value={record.severity}
                  onChange={(e) => onChange("severity", e.target.value)}
                >
                  {incidentSeverityOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Category">
                <select
                  className={inputClass}
                  value={record.category}
                  onChange={(e) => onChange("category", e.target.value)}
                >
                  {incidentCategoryOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Service type">
                <select
                  className={inputClass}
                  value={record.serviceType}
                  onChange={(e) => onChange("serviceType", e.target.value)}
                >
                  <option value="">Select service type…</option>
                  {incidentServiceTypeOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Date reported">
                <input
                  className={inputClass}
                  type="date"
                  value={record.reportedAt}
                  onChange={(e) => onChange("reportedAt", e.target.value)}
                />
              </Field>
              <Field label="Occurred at">
                <input
                  className={inputClass}
                  type="datetime-local"
                  value={toDatetimeLocal(record.occurredAt)}
                  onChange={(e) => onChange("occurredAt", fromDatetimeLocal(e.target.value))}
                />
              </Field>
              <Field label="Aware at (for NDIS deadline)">
                <input
                  className={inputClass}
                  type="datetime-local"
                  value={toDatetimeLocal(record.awareAt)}
                  onChange={(e) => {
                    const awareAt = fromDatetimeLocal(e.target.value);
                    onChange("awareAt", awareAt);
                    if (record.isReportable && record.reportableType) {
                      onChange(
                        "reportDeadlineAt",
                        computeNdisReportDeadline(
                          awareAt,
                          record.reportableType,
                          record.restrictivePracticeCausedHarm
                        )
                      );
                    }
                  }}
                />
              </Field>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={record.isReportable}
                    onChange={(e) => onReportableToggle(e.target.checked)}
                    className="rounded border-slate-300 text-[#d4147a] focus:ring-[#d4147a]"
                  />
                  NDIS reportable incident
                </label>
              </div>
              {record.isReportable ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Reportable type">
                    <select
                      className={inputClass}
                      value={record.reportableType}
                      onChange={(e) => onReportableTypeChange(e.target.value)}
                    >
                      <option value="">Select type…</option>
                      {ndisReportableTypeOptions
                        .filter((o) => o)
                        .map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                    </select>
                  </Field>
                  <Field label="Restrictive practice caused harm?">
                    <select
                      className={inputClass}
                      value={record.restrictivePracticeCausedHarm ? "Yes" : "No"}
                      onChange={(e) => {
                        const harm = e.target.value === "Yes";
                        onChange("restrictivePracticeCausedHarm", harm);
                        if (record.reportableType) {
                          onChange(
                            "reportDeadlineAt",
                            computeNdisReportDeadline(record.awareAt, record.reportableType, harm)
                          );
                        }
                      }}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </Field>
                  <Field label="NDIS notified at">
                    <input
                      className={inputClass}
                      type="datetime-local"
                      value={toDatetimeLocal(record.ndisNotifiedAt)}
                      onChange={(e) => onChange("ndisNotifiedAt", fromDatetimeLocal(e.target.value))}
                    />
                  </Field>
                  <Field label="NDIS notification reference">
                    <input
                      className={inputClass}
                      value={record.ndisNotificationRef}
                      onChange={(e) => onChange("ndisNotificationRef", e.target.value)}
                      placeholder="Portal reference or case ID"
                    />
                  </Field>
                  {showRestrictivePracticeLink(record) && primaryClient ? (
                    <Field label="Linked restrictive practice (client register)" className="sm:col-span-2">
                      <select
                        className={inputClass}
                        value={record.linkedRestrictivePracticeId}
                        onChange={(e) => onChange("linkedRestrictivePracticeId", e.target.value)}
                      >
                        <option value="">Select restrictive practice row…</option>
                        {clientRestrictivePractices.map((rp) => (
                          <option key={rp.id} value={rp.id}>
                            {rp.name || rp.practiceType} ({rp.validFrom || "no start date"})
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-slate-500">
                        Links this incident to the client&apos;s restrictive practice register for audit traceability.
                      </p>
                    </Field>
                  ) : null}
                </div>
              ) : null}
            </div>

            <Field label="What happened?">
              <textarea
                className={`${inputClass} min-h-[100px]`}
                value={record.description}
                onChange={(e) => onChange("description", e.target.value)}
                rows={4}
              />
            </Field>
            <Field label="Immediate actions taken">
              <textarea
                className={`${inputClass} min-h-[80px]`}
                value={record.immediateActions}
                onChange={(e) => onChange("immediateActions", e.target.value)}
                rows={3}
              />
            </Field>
          </fieldset>
        ) : null}

        {activeTab === "Parties & links" && canIncidentTab("Parties & links") ? (
          <fieldset disabled={!canWriteIncidentTab("Parties & links")} className="space-y-6 disabled:opacity-100">
            <div className="grid gap-4 sm:grid-cols-2">
              <TaskEntitySearchPicker
                index={entityIndex}
                value={clientPickerValue()}
                onChange={(opt) => onChange("primaryClientId", opt?.entityId ?? "")}
                entityTypeFilter="client"
                showTypeFilter={false}
                label="Primary client"
              />
              <TaskEntitySearchPicker
                index={entityIndex}
                value={employeePickerValue()}
                onChange={(opt) => onChange("primaryEmployeeId", opt?.entityId ?? "")}
                entityTypeFilter="employee"
                showTypeFilter={false}
                label="Primary employee"
              />
              <div className="sm:col-span-2">
                <Field label="Primary location">
                  <LocationSearchPicker
                    value={record.primaryLocationId}
                    onChange={(id) => onChange("primaryLocationId", id)}
                  />
                </Field>
              </div>
            </div>

            {(primaryClient || primaryEmployee || primaryLocation) && (
              <div className="flex flex-wrap gap-3 text-sm">
                {primaryClient ? (
                  <ClientRecordLink
                    id={primaryClient.id}
                    searchKey={primaryClient.searchKey}
                    name={primaryClient.name}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 hover:border-slate-300"
                  >
                    Client: {primaryClient.searchKey}
                  </ClientRecordLink>
                ) : null}
                {primaryEmployee ? (
                  <EmployeeRecordLink
                    id={primaryEmployee.id}
                    searchKey={primaryEmployee.searchKey}
                    name={primaryEmployee.name}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 hover:border-slate-300"
                  >
                    Employee: {primaryEmployee.searchKey}
                  </EmployeeRecordLink>
                ) : null}
                {primaryLocation ? (
                  <LocationRecordLink
                    id={primaryLocation.id}
                    searchKey={primaryLocation.searchKey}
                    name={primaryLocation.name}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 hover:border-slate-300"
                  >
                    Location: {primaryLocation.searchKey}
                  </LocationRecordLink>
                ) : null}
              </div>
            )}

            <LineItemTable
              config={incidentPartyTableConfig}
              rows={record.parties}
              onChange={onPartiesChange}
              dropdowns={incidentDropdowns}
              readOnly={!canWriteIncidentTab("Parties & links")}
            />
          </fieldset>
        ) : null}

        {activeTab === "Investigation" && canIncidentTab("Investigation") ? (
          <fieldset disabled={!canWriteIncidentTab("Investigation")} className="space-y-6 disabled:opacity-100">
            <Field label="Investigation summary">
              <textarea
                className={`${inputClass} min-h-[100px]`}
                value={record.investigationSummary}
                onChange={(e) => onChange("investigationSummary", e.target.value)}
                rows={4}
              />
            </Field>
            <Field label="Corrective actions">
              <textarea
                className={`${inputClass} min-h-[80px]`}
                value={record.correctiveActions}
                onChange={(e) => onChange("correctiveActions", e.target.value)}
                rows={3}
              />
            </Field>
            <Field label="Lessons learned">
              <textarea
                className={`${inputClass} min-h-[80px]`}
                value={record.lessonsLearned}
                onChange={(e) => onChange("lessonsLearned", e.target.value)}
                rows={3}
              />
            </Field>

            <LineItemTable
              config={incidentActionTableConfig}
              rows={record.actions}
              onChange={onActionsChange}
              dropdowns={incidentDropdowns}
              readOnly={!canWriteIncidentTab("Investigation")}
            />

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Evidence attachments</h3>
              {canWriteIncidentTab("Investigation") ? (
                <IncidentEvidenceUpload
                  incidentId={record.id}
                  uploadedBy={session?.displayName ?? record.updatedBy}
                  onUploaded={(row) =>
                    onEvidenceChange([
                      ...record.evidence,
                      { ...row, lineNo: record.evidence.length + 1 },
                    ])
                  }
                />
              ) : null}
              <LineItemTable
                config={incidentEvidenceTableConfig}
                rows={record.evidence}
                onChange={onEvidenceChange}
                dropdowns={incidentDropdowns}
                readOnly={!canWriteIncidentTab("Investigation")}
              />
            </div>

            <RecordTasksPanel entityType="incident" entityId={record.id} entityLabel={record.documentNo} />
          </fieldset>
        ) : null}

        {activeTab === "Notifications" && canIncidentTab("Notifications") ? (
          <fieldset disabled={!canWriteIncidentTab("Notifications")} className="space-y-6 disabled:opacity-100">
            <IncidentNdisChecklist incident={record} />
            <div>
              <p className="mb-3 text-sm text-slate-600">
                Log who was notified, when, and how. Use this for internal escalation and NDIS Commission submissions.
              </p>
              <LineItemTable
                config={incidentNotificationTableConfig}
                rows={record.notifications}
                onChange={onNotificationsChange}
                dropdowns={incidentDropdowns}
                readOnly={!canWriteIncidentTab("Notifications")}
              />
            </div>
          </fieldset>
        ) : null}
      </div>
    </div>
  );
}

function toDatetimeLocal(iso: string) {
  if (!iso?.trim()) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value: string) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toISOString();
}
