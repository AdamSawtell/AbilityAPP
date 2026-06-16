"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { IncidentQuickReportWizard } from "@/components/incident-quick-report";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import type { IncidentRecord } from "@/lib/incident";

export default function NewIncidentPage() {
  const router = useRouter();
  const { addIncident } = useData();
  const { session, users } = useAuth();

  const reporterEmployeeId = useMemo(() => {
    if (!session) return "";
    const user = users.find((u) => u.id === session.userId);
    return user?.employeeBpId ?? "";
  }, [session, users]);

  function onSubmit(record: IncidentRecord) {
    const created = addIncident(record);
    router.push(`/incidents/${created.id}?submitted=1`);
  }

  return (
    <AppShell
      title="Report incident"
      subtitle="Step through the essentials — you can add investigation detail on the full record after submitting."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Incident reports", href: "/incidents" },
        { label: "New" },
      ]}
      audit={{ moduleLabel: "New incident" }}
      actions={
        <Link
          href="/incidents"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Cancel
        </Link>
      }
    >
      <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <IncidentQuickReportWizard
          initialEmployeeId={reporterEmployeeId}
          reporterName={session?.displayName ?? ""}
          onSubmit={(record) => onSubmit(record)}
        />
      </div>
    </AppShell>
  );
}
