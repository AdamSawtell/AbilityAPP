"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { EmployeeContractGeneratePanel } from "@/components/employee-contract-generate-panel";
import {
  EmployeeEmergencyContactsPanel,
  PrimaryEmergencyContactSummary,
} from "@/components/employee-emergency-contacts-panel";
import { EmployeePicker } from "@/components/employee-picker";
import { LineItemTable } from "@/components/line-item-table";
import { EmployeeSystemAccessPanel } from "@/components/employee-system-access-panel";
import {
  allowedDetailTabsFromGroups,
  resolveDetailWindowKey,
} from "@/lib/access/catalog";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { useReferenceData } from "@/lib/config-store";
import type { AppUserRecord } from "@/lib/access/types";
import { RecordPhotoPanel } from "@/components/record-photo-panel";
import {
  managerName,
  mergedEmployeeAlerts,
  primaryEmergencyContact,
} from "@/lib/employee-compliance";
import { RecordIncidentsPanel } from "@/components/record-incidents-panel";
import { EmployeeSchedulePanel } from "@/components/employee-schedule-panel";
import { EmployeeScheduleTemplatePanel } from "@/components/employee-schedule-template-panel";
import {
  credentialTableConfig,
  employeeActivityTableConfig,
  employeeAlertTableConfig,
  employeeDocumentTableConfig,
  employeeLeaveTableConfig,
  employeeLeaveRequestTableConfig,
  employeeSkillTableConfig,
} from "@/lib/employee-line-tables";
import {
  employeeContactFields,
  employeeEmploymentFields,
  employeeLeaveFields,
  employeeOverviewFields,
  employeePayrollFields,
  employeeProfileFields,
  employeeTabGroups,
  employeeWorkRightsFields,
  primaryEmployeeLocation,
  type EmployeeActivityRow,
  type EmployeeAlertRow,
  type EmployeeCredentialRow,
  type EmployeeDocumentRow,
  type EmployeeEmergencyContactRow,
  type EmployeeLeaveEntitlementRow,
  type EmployeeLeaveRequestRow,
  type EmployeeLocationRow,
  type EmployeeRecord,
  type EmployeeSkillRow,
} from "@/lib/employee";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

const fieldMeta = new Map(employeeProfileFields().map((f) => [f.key, f]));

function Field({
  fieldKey,
  employee,
  onChange,
  getOptions,
  readOnly = false,
}: {
  fieldKey: keyof EmployeeRecord;
  employee: EmployeeRecord;
  onChange: (key: keyof EmployeeRecord, value: string) => void;
  getOptions: (key: string) => string[];
  readOnly?: boolean;
}) {
  const field = fieldMeta.get(fieldKey);
  const label =
    field?.label ??
    fieldKey
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (s) => s.toUpperCase());
  const value = String(employee[fieldKey] ?? "").trim() || "—";

  if (readOnly) {
    return (
      <div className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>
        <p className="text-sm text-slate-900">{value}</p>
      </div>
    );
  }

  if (!field) {
    return (
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>
        <input
          className={inputClass}
          value={employee[fieldKey] as string}
          onChange={(e) => onChange(fieldKey, e.target.value)}
        />
      </label>
    );
  }

  const options = field.type === "select" && field.optionsKey ? getOptions(field.optionsKey) : [];

  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-600">{field.label}</span>
      {field.type === "select" ? (
        <select
          className={inputClass}
          value={employee[fieldKey] as string}
          onChange={(e) => onChange(fieldKey, e.target.value)}
        >
          <option value="">—</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={field.type}
          className={inputClass}
          value={employee[fieldKey] as string}
          onChange={(e) => onChange(fieldKey, e.target.value)}
        />
      )}
    </label>
  );
}

function FieldSection({
  title,
  description,
  keys,
  employee,
  onChange,
  getOptions,
  readOnly = false,
}: {
  title: string;
  description?: string;
  keys: (keyof EmployeeRecord)[];
  employee: EmployeeRecord;
  onChange: (key: keyof EmployeeRecord, value: string) => void;
  getOptions: (key: string) => string[];
  readOnly?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {keys.map((key) => (
          <Field
            key={key}
            fieldKey={key}
            employee={employee}
            onChange={onChange}
            getOptions={getOptions}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  );
}

function SystemAccessPanel({
  employee,
  linkedUser,
}: {
  employee: EmployeeRecord;
  linkedUser?: AppUserRecord;
}) {
  return <EmployeeSystemAccessPanel employee={employee} linkedUser={linkedUser} />;
}

function tabCount(employee: EmployeeRecord, tab: string, incidentCount: number): number | null {
  if (tab === "Credentials Assigned") return employee.credentials.length;
  if (tab === "Address") return employee.locations.length;
  if (tab === "Emergency contacts") return employee.emergencyContacts.length;
  if (tab === "Alerts") return mergedEmployeeAlerts(employee).length;
  if (tab === "Skills & languages") return employee.skills.length;
  if (tab === "Documents") return employee.documents.length;
  if (tab === "Activity") return employee.activities.length;
  if (tab === "Leave") return employee.leaveEntitlements.length + employee.leaveRequests.length;
  if (tab === "Incidents") return incidentCount > 0 ? incidentCount : null;
  return null;
}

export function EmployeeTabbedView({
  employee,
  allEmployees,
  linkedUser,
  onChange,
  onCredentialsChange,
  onLocationsChange,
  onEmergencyContactsChange,
  onAlertsChange,
  onSkillsChange,
  onDocumentsChange,
  onActivitiesChange,
  onLeaveEntitlementsChange,
  onLeaveRequestsChange,
}: {
  employee: EmployeeRecord;
  allEmployees: EmployeeRecord[];
  linkedUser?: AppUserRecord;
  onChange: (key: keyof EmployeeRecord, value: string) => void;
  onCredentialsChange: (rows: EmployeeCredentialRow[]) => void;
  onLocationsChange: (rows: EmployeeLocationRow[]) => void;
  onEmergencyContactsChange: (rows: EmployeeEmergencyContactRow[]) => void;
  onAlertsChange: (rows: EmployeeAlertRow[]) => void;
  onSkillsChange: (rows: EmployeeSkillRow[]) => void;
  onDocumentsChange: (rows: EmployeeDocumentRow[]) => void;
  onActivitiesChange: (rows: EmployeeActivityRow[]) => void;
  onLeaveEntitlementsChange: (rows: EmployeeLeaveEntitlementRow[]) => void;
  onLeaveRequestsChange: (rows: EmployeeLeaveRequestRow[]) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { session, canWindow, canWriteWindow, canProcess } = useAuth();
  const { getIncidentsForEmployee } = useData();
  const { getOptions } = useReferenceData();

  const allowedTabs = allowedDetailTabsFromGroups("employees", employeeTabGroups, session?.windowKeys ?? []);
  const incidentCount = getIncidentsForEmployee(employee.id).length;
  const defaultTab = allowedTabs[0] ?? "Overview";
  const requestedTab = searchParams.get("tab") ?? defaultTab;
  const activeTab = allowedTabs.includes(requestedTab) ? requestedTab : defaultTab;

  const visibleGroups = employeeTabGroups
    .map((group) => ({
      ...group,
      tabs: group.tabs.filter((tab) => allowedTabs.includes(tab)),
    }))
    .filter((group) => group.tabs.length > 0);

  function setActiveTab(tab: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function canWriteEmployeeTab(tab: string) {
    const key = resolveDetailWindowKey("employees", tab);
    return key ? canWriteWindow(key) : false;
  }

  const canEditCredentials = canWindow("employee-credentials-assigned");
  const canAssignCredential = canProcess("assign-employee-credential");
  const primary = primaryEmployeeLocation(employee);
  const emergency = primaryEmergencyContact(employee);
  const addressTabHref = `${pathname}?tab=${encodeURIComponent("Address")}`;
  const emergencyTabHref = `${pathname}?tab=${encodeURIComponent("Emergency contacts")}`;
  const managerEmployees = allEmployees.filter((e) => e.id !== employee.id);
  const displayAlerts = mergedEmployeeAlerts(employee);
  const manualAlerts = employee.alerts.filter((a) => a.source !== "System");
  const systemAlerts = displayAlerts.filter((a) => a.source === "System");

  const employeeDropdowns = useMemo(
    () => ({
      credentialType: getOptions("credentialType"),
      credentialStatus: getOptions("credentialStatus"),
      employeeAlertType: getOptions("employeeAlertType"),
      showAsAlert: getOptions("showAsAlert"),
      employeeSkillType: getOptions("employeeSkillType"),
      skillProficiency: getOptions("skillProficiency"),
      employeeDocumentType: getOptions("employeeDocumentType"),
      employeeDocumentStatus: getOptions("employeeDocumentStatus"),
      employeeActivityType: getOptions("employeeActivityType"),
      leaveType: getOptions("leaveType"),
      employeeLeaveStatus: getOptions("employeeLeaveStatus"),
    }),
    [getOptions]
  );

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
                  const count = tabCount(employee, tab, incidentCount);
                  const active = activeTab === tab;
                  const windowKey = resolveDetailWindowKey("employees", tab);
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      title={windowKey ? `Window: ${windowKey}` : undefined}
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

      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex flex-wrap gap-2 lg:hidden">
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

        {activeTab === "Overview" && canWindow("employee-overview") ? (
          <div className="space-y-4">
            <FieldSection
              getOptions={getOptions}
              title="Overview"
              description="Core employee identity and status."
              keys={employeeOverviewFields}
              employee={employee}
              onChange={onChange}
              readOnly={!canWriteEmployeeTab("Overview")}
            />
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              {canWriteEmployeeTab("Overview") ? (
                <EmployeePicker
                  employees={managerEmployees}
                  value={employee.reportsToId}
                  onChange={(id) => onChange("reportsToId", id)}
                  label="Reports to"
                  allowClear
                />
              ) : (
                <div>
                  <span className="mb-1.5 block text-xs font-medium text-slate-600">Reports to</span>
                  <p className="text-sm text-slate-900">{managerName(employee, allEmployees) || "—"}</p>
                </div>
              )}
              {employee.reportsToId ? (
                <p className="mt-2 text-xs text-slate-500">Manager: {managerName(employee, allEmployees)}</p>
              ) : null}
            </div>
            <PrimaryAddressSummary primary={primary} addressTabHref={addressTabHref} />
            <PrimaryEmergencyContactSummary contact={emergency} tabHref={emergencyTabHref} />
            {canWriteEmployeeTab("Overview") ? (
              <label className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Notes</span>
                <textarea
                  className={`${inputClass} min-h-[100px] resize-y`}
                  value={employee.notes}
                  onChange={(e) => onChange("notes", e.target.value)}
                />
              </label>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Notes</span>
                <p className="whitespace-pre-wrap text-sm text-slate-900">{employee.notes.trim() || "—"}</p>
              </div>
            )}
          </div>
        ) : null}

        {activeTab === "Contact" && canWindow("employee-contact") ? (
          <div className="space-y-4">
            {canWriteEmployeeTab("Contact") ? (
              <RecordPhotoPanel
                pictureUrl={employee.pictureUrl}
                onChange={(url) => onChange("pictureUrl", url)}
                description="Profile photo for rosters, org chart, and staff directories."
              />
            ) : employee.pictureUrl ? (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <img src={employee.pictureUrl} alt="" className="max-h-40 rounded-lg object-cover" />
              </div>
            ) : null}
            <FieldSection
              getOptions={getOptions}
              title="Contact"
              description="How to reach this employee."
              keys={employeeContactFields}
              employee={employee}
              onChange={onChange}
              readOnly={!canWriteEmployeeTab("Contact")}
            />
            <PrimaryAddressSummary primary={primary} addressTabHref={addressTabHref} />
            <PrimaryEmergencyContactSummary contact={emergency} tabHref={emergencyTabHref} />
          </div>
        ) : null}

        {activeTab === "Emergency contacts" && canWindow("employee-emergency-contacts") ? (
          <EmployeeEmergencyContactsPanel
            contacts={employee.emergencyContacts}
            onChange={canWriteEmployeeTab("Emergency contacts") ? onEmergencyContactsChange : () => {}}
          />
        ) : null}

        {activeTab === "Employment" && canWindow("employee-employment") ? (
          <FieldSection
            getOptions={getOptions}
            title="Employment"
            description="Role, department, employment type, and key dates."
            keys={employeeEmploymentFields}
            employee={employee}
            onChange={onChange}
            readOnly={!canWriteEmployeeTab("Employment")}
          />
        ) : null}

        {activeTab === "Work rights" && canWindow("employee-work-rights") ? (
          <div className="space-y-4">
            <FieldSection
              getOptions={getOptions}
              title="Work rights"
              description="Driver licence, visa, and work eligibility. Medical restrictions are sensitive — limit access by role."
              keys={employeeWorkRightsFields}
              employee={employee}
              onChange={onChange}
              readOnly={!canWriteEmployeeTab("Work rights")}
            />
          </div>
        ) : null}

        {activeTab === "Payroll" && canWindow("employee-payroll") ? (
          <FieldSection
            getOptions={getOptions}
            title="Payroll"
            description="Bank and tax details for salary disbursement. Restricted to payroll roles in production."
            keys={employeePayrollFields}
            employee={employee}
            onChange={onChange}
            readOnly={!canWriteEmployeeTab("Payroll")}
          />
        ) : null}

        {activeTab === "Leave" && canWindow("employee-leave") ? (
          <div className="space-y-4">
            <FieldSection
              getOptions={getOptions}
              title="Leave policy"
              description="Standard hours and leave policy assignment."
              keys={employeeLeaveFields}
              employee={employee}
              onChange={onChange}
              readOnly={!canWriteEmployeeTab("Leave")}
            />
            <LineItemTable
              config={employeeLeaveTableConfig}
              rows={employee.leaveEntitlements}
              onChange={onLeaveEntitlementsChange}
              dropdowns={employeeDropdowns}
              readOnly={!canWriteEmployeeTab("Leave")}
            />
            <LineItemTable
              config={employeeLeaveRequestTableConfig}
              rows={employee.leaveRequests}
              onChange={onLeaveRequestsChange}
              dropdowns={employeeDropdowns}
              readOnly={!canWriteEmployeeTab("Leave")}
            />
          </div>
        ) : null}

        {activeTab === "Schedule" && canWindow("employee-schedule") ? (
          <EmployeeSchedulePanel employeeId={employee.id} />
        ) : null}

        {activeTab === "Schedule template" && canWindow("employee-schedule-template") ? (
          <EmployeeScheduleTemplatePanel
            employeeId={employee.id}
            readOnly={!canWriteWindow("workforce-planning")}
          />
        ) : null}

        {activeTab === "Credentials Assigned" && canEditCredentials ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Credentials assigned</h3>
                <p className="text-sm text-slate-500">
                  Checks, licences, and qualifications. Status updates from expiry dates on save.
                </p>
              </div>
              {!canAssignCredential || !canWriteEmployeeTab("Credentials Assigned") ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                  View only — assign process not granted
                </span>
              ) : null}
            </div>
            <LineItemTable
              config={credentialTableConfig}
              rows={employee.credentials}
              onChange={canAssignCredential && canWriteEmployeeTab("Credentials Assigned") ? onCredentialsChange : () => {}}
              dropdowns={employeeDropdowns}
              readOnly={!canWriteEmployeeTab("Credentials Assigned")}
            />
          </div>
        ) : null}

        {activeTab === "Alerts" && canWindow("employee-alerts") ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Alerts</h3>
              <p className="text-sm text-slate-500">
                Manual flags plus system-generated compliance alerts from credentials and work rights.
              </p>
            </div>
            {systemAlerts.length > 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">System alerts</p>
                <ul className="mt-2 space-y-2">
                  {systemAlerts.map((a) => (
                    <li key={a.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                      <p className="font-medium text-slate-900">{a.name}</p>
                      <p className="text-slate-600">{a.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <LineItemTable
              config={employeeAlertTableConfig}
              rows={manualAlerts}
              onChange={onAlertsChange}
              dropdowns={employeeDropdowns}
              readOnly={!canWriteEmployeeTab("Alerts")}
            />
          </div>
        ) : null}

        {activeTab === "Skills & languages" && canWindow("employee-skills") ? (
          <LineItemTable
            config={employeeSkillTableConfig}
            rows={employee.skills}
            onChange={onSkillsChange}
            dropdowns={employeeDropdowns}
            readOnly={!canWriteEmployeeTab("Skills & languages")}
          />
        ) : null}

        {activeTab === "Documents" && canWindow("employee-documents") ? (
          <div className="space-y-4">
            <EmployeeContractGeneratePanel
              employee={employee}
              managerName={managerName(employee, allEmployees)}
              existingDocuments={employee.documents}
              onDocumentsChange={onDocumentsChange}
            />
            <LineItemTable
              config={employeeDocumentTableConfig}
              rows={employee.documents}
              onChange={onDocumentsChange}
              dropdowns={employeeDropdowns}
              readOnly={!canWriteEmployeeTab("Documents")}
            />
          </div>
        ) : null}

        {activeTab === "Activity" && canWindow("employee-activity") ? (
          <LineItemTable
            config={employeeActivityTableConfig}
            rows={employee.activities}
            onChange={onActivitiesChange}
            dropdowns={employeeDropdowns}
            readOnly={!canWriteEmployeeTab("Activity")}
          />
        ) : null}

        {activeTab === "Incidents" && canWindow("employee-incidents") ? (
          <RecordIncidentsPanel
            employeeId={employee.id}
            entityLabel={`${employee.searchKey} — ${employee.name}`}
          />
        ) : null}

        {activeTab === "Address" && canWindow("employee-locations") ? (
          <EmployeeAddressesPanel
            locations={employee.locations}
            onChange={canWriteEmployeeTab("Address") ? onLocationsChange : () => {}}
          />
        ) : null}

        {activeTab === "System access" && canWindow("employee-system-access") ? (
          <SystemAccessPanel employee={employee} linkedUser={linkedUser} />
        ) : null}

        {allowedTabs.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            You can open employees but no employee tabs are assigned to your role. Ask an administrator to grant
            dependent windows under Business Partner (Employee).
          </div>
        ) : null}
      </div>
    </div>
  );
}
