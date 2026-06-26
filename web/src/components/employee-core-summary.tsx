"use client";

import Link from "next/link";
import {
  EntityHeader,
  type EntityHeaderBadge,
  type EntityHeaderMetaItem,
  type EntityHeaderSummaryItem,
} from "@/components/entity-header";
import { complianceSummary, managerName } from "@/lib/employee-compliance";
import { formatEmployeeAddress, primaryEmployeeLocation, type EmployeeRecord } from "@/lib/employee";

function statusLabel(status: string) {
  return status.replace(/^\d+_/, "").replace(/_/g, " ");
}

export function EmployeeCoreSummary({
  employee,
  allEmployees,
  saved,
}: {
  employee: EmployeeRecord;
  allEmployees: EmployeeRecord[];
  saved?: boolean;
}) {
  const compliance = complianceSummary(employee);
  const primary = primaryEmployeeLocation(employee);
  const manager = managerName(employee, allEmployees);
  const credentialsTabHref = `/employees/${employee.id}?tab=${encodeURIComponent("Credentials Assigned")}`;

  const subtitleParts = [
    employee.searchKey,
    employee.employeeNumber || null,
    employee.jobTitle || null,
  ].filter(Boolean);

  const badges: EntityHeaderBadge[] = [];
  if (saved) badges.push({ key: "saved", label: "Saved", tone: "success" });
  if (employee.employmentStatus) {
    badges.push({ key: "status", label: statusLabel(employee.employmentStatus), tone: "success" });
  }
  if (compliance.expiredCredentialCount > 0) {
    badges.push({
      key: "expired",
      label: `${compliance.expiredCredentialCount} expired credential${compliance.expiredCredentialCount === 1 ? "" : "s"}`,
      tone: "danger",
      href: credentialsTabHref,
    });
  }
  if (compliance.expiringCredentialCount > 0) {
    badges.push({
      key: "expiring",
      label: `${compliance.expiringCredentialCount} expiring soon`,
      tone: "warning",
      href: credentialsTabHref,
    });
  }
  if (
    employee.credentials.length > 0 &&
    compliance.expiredCredentialCount === 0 &&
    compliance.expiringCredentialCount === 0
  ) {
    badges.push({
      key: "credentials",
      label: `${employee.credentials.length} credential${employee.credentials.length === 1 ? "" : "s"}`,
      tone: "info",
      href: credentialsTabHref,
    });
  }

  const metadata: EntityHeaderMetaItem[] = [
    { key: "email", icon: "email", label: "Email", value: employee.email || "—" },
    { key: "phone", icon: "phone", label: "Phone", value: employee.phone || employee.mobile || "—" },
    {
      key: "site",
      icon: "map-pin",
      label: "Primary site",
      value: primary ? (
        <Link
          href={`/employees/${employee.id}?tab=${encodeURIComponent("Address")}`}
          className="hover:text-[#b51266] hover:underline"
        >
          {formatEmployeeAddress(primary)}
        </Link>
      ) : (
        "—"
      ),
    },
    { key: "manager", icon: "user", label: "Reports to", value: manager || "—" },
  ];

  const summary: EntityHeaderSummaryItem[] = [
    { key: "department", label: "Department", value: employee.department || "—" },
    { key: "site-branch", label: "Site", value: employee.siteBranch || "—" },
  ];
  if (employee.employmentType?.trim()) {
    summary.push({ key: "employment-type", label: "Employment", value: employee.employmentType });
  }

  const banner =
    compliance.level !== "ok" ? (
      <div
        className={`rounded-2xl border px-4 py-3 text-sm ${
          compliance.level === "critical"
            ? "border-red-200 bg-red-50 text-red-900"
            : "border-amber-200 bg-amber-50 text-amber-900"
        }`}
      >
        <p className="font-medium">
          {compliance.level === "critical" ? "Compliance action required" : "Compliance warning"}
        </p>
        <ul className="mt-1 list-inside list-disc">
          {compliance.messages.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </div>
    ) : null;

  return (
    <EntityHeader
      type="Employee"
      title={employee.name}
      subtitle={subtitleParts.join(" · ")}
      imageUrl={employee.pictureUrl}
      imageAlt={employee.name}
      badges={badges}
      metadata={metadata}
      summary={summary}
      banner={banner}
    />
  );
}
