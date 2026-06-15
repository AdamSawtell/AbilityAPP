"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LineItemTable } from "@/components/line-item-table";
import { UserAdminLink } from "@/components/record-link";
import {
  employeeTabsForRole,
  windowKeyForEmployeeTab,
} from "@/lib/access/catalog";
import { useAuth } from "@/lib/auth-store";
import type { AppUserRecord } from "@/lib/access/types";
import {
  credentialStatusOptions,
  credentialTableConfig,
  credentialTypeOptions,
} from "@/lib/employee-line-tables";
import {
  employeeContactFields,
  employeeEmploymentFields,
  employeeOverviewFields,
  employeeProfileFields,
  employeeTabGroups,
  type EmployeeCredentialRow,
  type EmployeeRecord,
} from "@/lib/employee";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

const fieldMeta = new Map(employeeProfileFields().map((f) => [f.key, f]));

function Field({
  fieldKey,
  employee,
  onChange,
}: {
  fieldKey: keyof EmployeeRecord;
  employee: EmployeeRecord;
  onChange: (key: keyof EmployeeRecord, value: string) => void;
}) {
  const field = fieldMeta.get(fieldKey);
  if (!field) return null;

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
          {field.options?.map((opt) => (
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
}: {
  title: string;
  description?: string;
  keys: (keyof EmployeeRecord)[];
  employee: EmployeeRecord;
  onChange: (key: keyof EmployeeRecord, value: string) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {keys.map((key) => (
          <Field key={key} fieldKey={key} employee={employee} onChange={onChange} />
        ))}
      </div>
    </div>
  );
}

function ComingSoonPanel({ tab }: { tab: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
      <p className="text-sm font-medium text-slate-700">{tab}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        This tab is registered in the window catalog. Line-item editing will follow the same pattern as Credentials
        Assigned.
      </p>
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
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">System access</h3>
      <p className="mt-1 text-sm text-slate-500">
        Application login linked to {employee.name}. Managed in Admin → Users.
      </p>
      {linkedUser ? (
        <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
          <UserAdminLink
            userId={linkedUser.id}
            label={linkedUser.username}
            className="font-medium text-[#b51266] hover:underline"
          />
          <p className="text-xs text-slate-500">{linkedUser.email}</p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-600">No login linked yet.</p>
      )}
      <Link
        href={
          linkedUser ? `/admin/users?user=${linkedUser.id}` : `/admin/users?employee=${employee.id}`
        }
        className="mt-4 inline-block text-sm font-medium text-[#b51266] hover:underline"
      >
        {linkedUser ? "Manage user access" : "Create or link user"}
      </Link>
    </div>
  );
}

function tabCount(employee: EmployeeRecord, tab: string): number | null {
  if (tab === "Credentials Assigned") return employee.credentials.length;
  return null;
}

export function EmployeeTabbedView({
  employee,
  linkedUser,
  onChange,
  onCredentialsChange,
}: {
  employee: EmployeeRecord;
  linkedUser?: AppUserRecord;
  onChange: (key: keyof EmployeeRecord, value: string) => void;
  onCredentialsChange: (rows: EmployeeCredentialRow[]) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { session, canWindow, canProcess } = useAuth();

  const allowedTabs = employeeTabsForRole(session?.windowKeys ?? []);
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

  const canEditCredentials = canWindow("employee-credentials-assigned");
  const canAssignCredential = canProcess("assign-employee-credential");

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
                  const count = tabCount(employee, tab);
                  const active = activeTab === tab;
                  const windowKey = windowKeyForEmployeeTab(tab);
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      title={windowKey ? `Window: ${windowKey}` : undefined}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                        active
                          ? "bg-white font-medium text-indigo-900 shadow-sm ring-1 ring-indigo-200"
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
                activeTab === tab
                  ? "bg-indigo-100 text-indigo-900"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Overview" && canWindow("employee-overview") ? (
          <FieldSection
            title="Overview"
            description="Core employee identity and status."
            keys={employeeOverviewFields}
            employee={employee}
            onChange={onChange}
          />
        ) : null}

        {activeTab === "Contact" && canWindow("employee-contact") ? (
          <FieldSection
            title="Contact"
            description="How to reach this employee."
            keys={employeeContactFields}
            employee={employee}
            onChange={onChange}
          />
        ) : null}

        {activeTab === "Employment" && canWindow("employee-employment") ? (
          <FieldSection
            title="Employment"
            description="Role, department, and employment dates."
            keys={employeeEmploymentFields}
            employee={employee}
            onChange={onChange}
          />
        ) : null}

        {activeTab === "Credentials Assigned" && canEditCredentials ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Credentials assigned</h3>
                <p className="text-sm text-slate-500">
                  Checks, licences, and qualifications held by this employee.
                </p>
              </div>
              {!canAssignCredential ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                  View only — assign process not granted
                </span>
              ) : null}
            </div>
            <LineItemTable
              config={credentialTableConfig}
              rows={employee.credentials}
              onChange={canAssignCredential ? onCredentialsChange : () => {}}
              dropdowns={{
                credentialType: [...credentialTypeOptions],
                credentialStatus: [...credentialStatusOptions],
              }}
            />
          </div>
        ) : null}

        {activeTab === "Locations" && canWindow("employee-locations") ? (
          <ComingSoonPanel tab="Locations" />
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
