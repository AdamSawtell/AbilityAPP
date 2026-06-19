"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { IncidentQuickReportWizard } from "@/components/incident-quick-report";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { useAiDraftLoader } from "@/lib/ai/use-ai-draft";
import { trackAiPrepareSaved } from "@/lib/ai/prepare-audit.client";
import { emptyIncident, type IncidentRecord } from "@/lib/incident";

function NewIncidentPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const aiDraftId = searchParams.get("aiDraft");
  const draftLoad = useAiDraftLoader(aiDraftId);
  const { addIncident } = useData();
  const { session, users } = useAuth();

  const reporterEmployeeId = useMemo(() => {
    if (!session) return "";
    const user = users.find((u) => u.id === session.userId);
    return user?.employeeBpId ?? "";
  }, [session, users]);

  const initialRecord = useMemo((): Partial<IncidentRecord> | undefined => {
    const p = draftLoad.payload;
    if (!p) return undefined;
    const base = emptyIncident();
    return {
      title: String(p.title ?? ""),
      description: String(p.description ?? ""),
      severity: (String(p.severity ?? base.severity) as IncidentRecord["severity"]),
      category: String(p.category ?? base.category),
      isReportable: Boolean(p.isReportable),
      reportableType: String(p.reportableType ?? "") as IncidentRecord["reportableType"],
      primaryClientId: String(p.primaryClientId ?? ""),
      primaryEmployeeId: String(p.primaryEmployeeId ?? ""),
      primaryLocationId: String(p.primaryLocationId ?? ""),
    };
  }, [draftLoad.payload]);

  function onSubmit(record: IncidentRecord) {
    const created = addIncident(record);
    trackAiPrepareSaved({
      draftId: aiDraftId ?? undefined,
      entityType: "incident",
      entityId: created.id,
      entityLabel: `${created.documentNo} — ${created.title}`,
    });
    router.push(`/incidents/${created.id}?submitted=1`);
  }

  if (draftLoad.error) {
    return (
      <AppShell title="Report incident" audit={{ moduleLabel: "Incidents" }}>
        <p className="text-sm text-red-700">{draftLoad.error}</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Report incident"
      subtitle={
        aiDraftId
          ? "Review what your assistant prepared, then complete the wizard and submit."
          : "Step through the essentials — you can add investigation detail on the full record after submitting."
      }
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Incident reports", href: "/incidents" },
        { label: "New" },
      ]}
      audit={{ moduleLabel: "Incidents" }}
      actions={
        <Link
          href="/incidents"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Cancel
        </Link>
      }
    >
      {aiDraftId ? (
        <p className="mb-4 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          Prepared by your AI assistant. Check every step, then submit the incident.
        </p>
      ) : null}
      {draftLoad.loading ? <p className="mb-4 text-sm text-slate-500">Loading draft…</p> : null}
      <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <IncidentQuickReportWizard
          initialEmployeeId={reporterEmployeeId}
          reporterName={session?.displayName ?? ""}
          initialRecord={initialRecord}
          onSubmit={(record) => onSubmit(record)}
        />
      </div>
    </AppShell>
  );
}

export default function NewIncidentPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-slate-500">Loading…</p>}>
      <NewIncidentPageInner />
    </Suspense>
  );
}
