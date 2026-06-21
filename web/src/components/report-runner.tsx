"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { ReportTable } from "@/components/report-table";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { reportById } from "@/lib/reports/catalog";
import { runReport } from "@/lib/reports/runners";

type ReportRunnerViewProps = {
  reportId: string;
};

export function ReportRunnerView({ reportId }: ReportRunnerViewProps) {
  const { clients, employees, locations, enquiries, incidents, tasks, timesheets, claims, invoices, monthlyServicePlans, payrollClosedPeriods, financialClosedMonths, rosterShifts, serviceAgreements } = useData();
  const { users, roles, canReport } = useAuth();
  const report = reportById(reportId);

  const result = useMemo(() => {
    if (!report || !canReport(reportId)) return null;
    return runReport(reportId, {
      clients,
      employees,
      locations,
      enquiries,
      incidents,
      tasks,
      users,
      roles,
      monthlyServicePlans,
      timesheets,
      rosterShifts,
      serviceAgreements,
      claims,
      invoices,
      payrollClosedPeriods,
      financialClosedMonths,
    });
  }, [
    reportId,
    report,
    canReport,
    clients,
    employees,
    locations,
    enquiries,
    incidents,
    tasks,
    users,
    roles,
    monthlyServicePlans,
    timesheets,
    rosterShifts,
    serviceAgreements,
    claims,
    invoices,
    payrollClosedPeriods,
    financialClosedMonths,
  ]);

  if (!report) {
    return (
      <AppShell title="Report not found" breadcrumbs={[{ label: "Home", href: "/" }, { label: "Reports", href: "/reports" }, { label: "Not found" }]}>
        <p className="text-sm text-slate-500">This report is not registered in the catalog.</p>
      </AppShell>
    );
  }

  if (!canReport(reportId)) {
    return (
      <AppShell
        title={report.label}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Reports", href: "/reports" }, { label: report.label }]}
      >
        <p className="text-sm text-slate-500">Your role does not have access to this report.</p>
        <Link href="/reports" className="mt-4 inline-block text-sm font-medium text-[#d4147a] hover:underline">
          Back to reports
        </Link>
      </AppShell>
    );
  }

  if (!result) {
    return (
      <AppShell
        title={report.label}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Reports", href: "/reports" }, { label: report.label }]}
      >
        <p className="text-sm text-slate-500">Could not generate this report.</p>
      </AppShell>
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <AppShell
      title={report.label}
      subtitle={report.description}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Reports", href: "/reports" },
        { label: report.moduleGroup, href: "/reports" },
        { label: report.label },
      ]}
      audit={{ moduleLabel: `Report — ${report.label}` }}
    >
      <ReportTable
        title={report.label}
        description={`${report.moduleGroup} · CSV export uses the column order shown below`}
        columns={result.columns}
        rows={result.rows}
        maxColumns={report.maxColumns}
        exportFilename={`${report.id}-${stamp}.csv`}
      />
    </AppShell>
  );
}
