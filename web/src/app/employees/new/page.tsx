"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useReferenceData } from "@/lib/config-store";
import { useData } from "@/lib/data-store";
import { employeeProfileFields, type EmployeeRecord } from "@/lib/employee";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

const emptyCollections = {
  credentials: [],
  locations: [],
  emergencyContacts: [],
  alerts: [],
  skills: [],
  documents: [],
  activities: [],
  leaveEntitlements: [],
  leaveRequests: [],
};

export default function NewEmployeePage() {
  const { getOptions } = useReferenceData();
  const router = useRouter();
  const { addEmployee } = useData();
  const [record, setRecord] = useState<EmployeeRecord>({
    id: "",
    searchKey: "",
    businessPartnerGroup: "Employee",
    name: "",
    firstName: "",
    lastName: "",
    preferredName: "",
    middleName: "",
    email: "",
    phone: "",
    mobile: "",
    jobTitle: "",
    department: "",
    employmentStatus: "Active",
    employmentType: "Full-time",
    startDate: "",
    endDate: "",
    probationEndDate: "",
    confirmationDate: "",
    noticeDays: "",
    siteBranch: "",
    costCentre: "",
    gender: "",
    birthday: "",
    employeeNumber: "",
    reportsToId: "",
    driverLicenceClass: "",
    driverLicenceExpiry: "",
    visaSubclass: "",
    visaExpiry: "",
    workRightsNotes: "",
    bankName: "",
    bankBsb: "",
    bankAccountNumber: "",
    payMethod: "Bank",
    tfn: "",
    taxDeclaration: "",
    superFund: "",
    superMemberNumber: "",
    standardHoursPerWeek: "",
    fte: "",
    contractedHoursPerPeriod: "",
    contractedHoursPeriod: "fortnight",
    schadsClassificationLevel: "",
    schadsPayPoint: "",
    superRate: 12,
    leavePolicy: "",
    medicalRestrictionsNotes: "",
    notes: "",
    pictureUrl: "",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
    ...emptyCollections,
  });
  const [error, setError] = useState("");

  function onChange(key: keyof EmployeeRecord, value: string) {
    setRecord((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "firstName" || key === "lastName") {
        next.name = `${key === "firstName" ? value : next.firstName} ${key === "lastName" ? value : next.lastName}`.trim();
      }
      return next;
    });
    setError("");
  }

  function onCreate() {
    if (!record.firstName.trim() || !record.lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }
    const created = addEmployee(record);
    router.push(`/employees/${created.id}`);
  }

  return (
    <AppShell
      title="New employee"
      subtitle="Create a business partner employee record. You can link a system user afterwards."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Employees", href: "/employees" },
        { label: "New" },
      ]}
      audit={{ moduleLabel: "New employee" }}
      actions={
        <>
          <Link
            href="/employees"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={onCreate}
            className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
          >
            Create employee
          </button>
        </>
      }
    >
      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          {employeeProfileFields().map((field) => (
            <label key={field.key} className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-600">{field.label}</span>
              {field.type === "select" ? (
                <select
                  className={inputClass}
                  value={record[field.key] as string}
                  onChange={(e) => onChange(field.key, e.target.value)}
                >
                  <option value="">—</option>
                  {(field.optionsKey ? getOptions(field.optionsKey) : []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  className={inputClass}
                  value={record[field.key] as string}
                  onChange={(e) => onChange(field.key, e.target.value)}
                />
              )}
            </label>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
