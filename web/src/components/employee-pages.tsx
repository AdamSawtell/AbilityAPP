"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { EmployeeCoreSummary } from "@/components/employee-core-summary";
import { EmployeeList } from "@/components/employee-list";
import { EmployeeTabbedView } from "@/components/employee-view";
import { RecordTasksPanel } from "@/components/record-tasks-panel";
import { UnsavedChangesBar, type SaveConfirmation } from "@/components/unsaved-changes-bar";
import { useModuleSaveAccess } from "@/lib/access/use-detail-write-access";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { useWorkspace, workspaceKey } from "@/lib/workspace-store";
import type { EmployeeRecord } from "@/lib/employee";
import { auditMetaFrom } from "@/lib/audit";
import { SAVE_TOAST_MESSAGES, showSuccessToast } from "@/lib/toast";
import { RecordLineSaveProvider } from "@/lib/record-line-save-context";
import { ClientDetailSkeleton } from "@/components/ui/page-skeletons";

function EmployeeTabbedViewFallback() {
  return <ClientDetailSkeleton />;
}

export function EmployeeListView() {
  const { employees } = useData();
  return <EmployeeList records={employees} />;
}

export function EmployeeDetailView({ id }: { id: string }) {
  const { employees, upsertEmployee } = useData();
  const { users } = useAuth();
  const canSaveEmployee = useModuleSaveAccess("employees", "employee");
  const { openEmployee, setTabDirty, touchTab } = useWorkspace();
  const stored = employees.find((e) => e.id === id);
  const [draft, setDraft] = useState<EmployeeRecord | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveConfirmation, setSaveConfirmation] = useState<SaveConfirmation | null>(null);

  const employee = draft ?? stored ?? null;
  const hasUnsavedChanges = Boolean(draft);
  const tabKey = workspaceKey("employee", id);

  const linkedUser = useMemo(
    () => users.find((u) => u.employeeBpId === id),
    [users, id]
  );

  useEffect(() => {
    if (!stored) return;
    openEmployee(stored.id, stored.searchKey, stored.name);
  }, [id, stored, openEmployee]);

  useEffect(() => {
    setTabDirty(tabKey, hasUnsavedChanges);
  }, [tabKey, hasUnsavedChanges, setTabDirty]);

  useEffect(() => {
    if (employee) touchTab(tabKey, employee.searchKey, employee.name);
  }, [employee, tabKey, touchTab]);

  if (!employee) {
    return (
      <AppShell
        title="Employee not found"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Employees", href: "/employees" },
          { label: "Not found" },
        ]}
      >
        <p className="text-slate-600">No employee with ID {id}.</p>
        <Link href="/employees" className="mt-4 inline-block text-[#b51266] hover:underline">
          Back to employees
        </Link>
      </AppShell>
    );
  }

  function patchDraft(patch: Partial<EmployeeRecord>) {
    const base = draft ?? stored;
    if (!base) return;
    setDraft({ ...base, ...patch, updatedBy: "SuperUser" });
    setSaved(false);
  }

  function onFieldChange(key: keyof EmployeeRecord, value: string) {
    const base = draft ?? stored;
    if (!base) return;
    const next = { ...base, [key]: value, updatedBy: "SuperUser" };
    if (key === "firstName" || key === "lastName") {
      next.name = `${key === "firstName" ? value : next.firstName} ${key === "lastName" ? value : next.lastName}`.trim();
    }
    setDraft(next);
    setSaved(false);
  }

  function onSave() {
    if (!employee) return;
    const record = employee;
    upsertEmployee(record);
    setDraft(null);
    setSaved(true);
    showSuccessToast(SAVE_TOAST_MESSAGES.staff);
    setSaveConfirmation({ message: `Saved — ${record.name} updated` });
  }

  function onDiscard() {
    setDraft(null);
    setSaved(false);
    setSaveConfirmation(null);
  }

  return (
    <>
      <RecordLineSaveProvider
        onSave={onSave}
        onDiscard={onDiscard}
        dirty={hasUnsavedChanges}
        canSave={canSaveEmployee}
      >
        <AppShell
        title={employee.name}
        subtitle={`${employee.searchKey} · ${employee.jobTitle || "Employee"}`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Employees", href: "/employees" },
          { label: employee.searchKey },
        ]}
        audit={
          stored
            ? {
                entityType: "employee",
                entityId: stored.id,
                meta: auditMetaFrom(stored),
              }
            : undefined
        }
      >
        <EmployeeCoreSummary employee={employee} allEmployees={employees} saved={saved && !hasUnsavedChanges} />

        <Suspense fallback={<EmployeeTabbedViewFallback />}>
          <EmployeeTabbedView
            employee={employee}
            allEmployees={employees}
            linkedUser={linkedUser}
            onChange={onFieldChange}
            onCredentialsChange={(credentials) => patchDraft({ credentials })}
            onLocationsChange={(locations) => patchDraft({ locations })}
            onEmergencyContactsChange={(emergencyContacts) => patchDraft({ emergencyContacts })}
            onAlertsChange={(alerts) => patchDraft({ alerts })}
            onSkillsChange={(skills) => patchDraft({ skills })}
            onDocumentsChange={(documents) => patchDraft({ documents })}
            onActivitiesChange={(activities) => patchDraft({ activities })}
            onLeaveEntitlementsChange={(leaveEntitlements) => patchDraft({ leaveEntitlements })}
            onLeaveRequestsChange={(leaveRequests) => patchDraft({ leaveRequests })}
          />
        </Suspense>

        <div className="mt-8 border-t border-slate-200 pt-8">
          <RecordTasksPanel
            entityType="employee"
            entityId={employee.id}
            entityLabel={`${employee.searchKey} — ${employee.name}`}
          />
        </div>
      </AppShell>
      </RecordLineSaveProvider>

      <UnsavedChangesBar
        visible={hasUnsavedChanges && canSaveEmployee}
        confirmation={saveConfirmation}
        onConfirmationDismiss={() => setSaveConfirmation(null)}
        onSave={onSave}
        onDiscard={onDiscard}
      />
    </>
  );
}