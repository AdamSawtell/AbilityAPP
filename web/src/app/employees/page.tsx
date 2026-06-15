import { AppShell } from "@/components/app-shell";
import { EmployeeListView } from "@/components/employee-pages";
import Link from "next/link";

export default function EmployeesPage() {
  return (
    <AppShell
      title="Employees"
      subtitle="Staff and contractors in your organisation. Link each person to a system user for login access."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Employees" }]}
      audit={{ moduleLabel: "Employees" }}
      actions={
        <Link
          href="/employees/new"
          className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
        >
          Add employee
        </Link>
      }
    >
      <EmployeeListView />
    </AppShell>
  );
}
