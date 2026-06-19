"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmployeeListView } from "@/components/employee-pages";
import { useAuth } from "@/lib/auth-store";

export default function EmployeesPage() {
  const { canWriteWindow } = useAuth();
  const canCreateEmployee = canWriteWindow("employees");

  return (
    <AppShell
      title="Employees"
      subtitle="Staff and contractors in your organisation. Link each person to a system user for login access."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Employees" }]}
      audit={{ moduleLabel: "Employees" }}
      actions={
        canCreateEmployee ? (
          <Link
            href="/employees/new"
            className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
          >
            Add employee
          </Link>
        ) : null
      }
    >
      <EmployeeListView />
    </AppShell>
  );
}
