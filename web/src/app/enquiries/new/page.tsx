"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { EnquiryForm } from "@/components/enquiry-form";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { useAiDraftLoader } from "@/lib/ai/use-ai-draft";
import { draftHighlightKeys } from "@/lib/ai/draft-field-highlight";
import { trackAiPrepareSaved } from "@/lib/ai/prepare-audit.client";
import { emptyEnquiry, formSections, type EnquiryRecord } from "@/lib/enquiry";
import { ClientDetailSkeleton, SettingsFormSkeleton } from "@/components/ui/page-skeletons";

function NewEnquiryPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const aiDraftId = searchParams.get("aiDraft");
  const { session } = useAuth();
  const { addEnquiry } = useData();
  const draftLoad = useAiDraftLoader(aiDraftId);
  const [record, setRecord] = useState<EnquiryRecord>(emptyEnquiry());
  const [error, setError] = useState("");
  const [appliedDraft, setAppliedDraft] = useState(false);

  const highlightFields = useMemo(
    () => (draftLoad.payload ? draftHighlightKeys(draftLoad.payload, "enquiry") : undefined),
    [draftLoad.payload]
  );

  useEffect(() => {
    if (!draftLoad.payload || appliedDraft || draftLoad.loading) return;
    const p = draftLoad.payload;
    setRecord((prev) => ({
      ...prev,
      firstName: String(p.firstName ?? prev.firstName),
      lastName: String(p.lastName ?? prev.lastName),
      email: String(p.email ?? prev.email),
      phone: String(p.phone ?? prev.phone),
      fundingBody: String(p.fundingBody ?? prev.fundingBody),
      disability: String(p.disability ?? prev.disability),
      services: String(p.services ?? prev.services),
      description: String(p.description ?? prev.description),
      enquirySource: String(p.enquirySource ?? prev.enquirySource),
      status: String(p.status ?? prev.status),
      updatedBy: session?.displayName ?? prev.updatedBy,
    }));
    setAppliedDraft(true);
  }, [draftLoad.payload, draftLoad.loading, appliedDraft, session?.displayName]);

  function onChange(key: keyof EnquiryRecord, value: string) {
    setRecord((prev) => ({ ...prev, [key]: value }));
    setError("");
  }

  function onCreate() {
    if (!record.firstName.trim() || !record.lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }
    const created = addEnquiry({
      ...record,
      createdBy: session?.displayName ?? record.createdBy,
      updatedBy: session?.displayName ?? record.updatedBy,
    });
    trackAiPrepareSaved({
      userId: session?.userId ?? "",
      roleId: session?.activeRoleId ?? "",
      draftId: aiDraftId ?? undefined,
      entityType: "enquiry",
      entityId: created.id,
      entityLabel: `${created.documentNo} — ${created.firstName} ${created.lastName}`,
      chatMessage: aiDraftId
        ? `Created enquiry ${created.documentNo}. You can continue in chat.`
        : undefined,
    });
    router.push(`/enquiries/${created.id}`);
  }

  if (draftLoad.error) {
    return (
      <AppShell title="New enquiry" audit={{ moduleLabel: "Enquiries" }}>
        <p className="text-sm text-red-700">{draftLoad.error}</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="New enquiry"
      subtitle={aiDraftId ? "Review the details your assistant prepared, then create the record." : "Capture intake details. A document number is assigned when you create the record."}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Enquiries", href: "/enquiries" },
        { label: "New" },
      ]}
      audit={{ moduleLabel: "Enquiries" }}
      actions={
        <>
          <Link
            href="/enquiries"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={onCreate}
            className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
          >
            Create enquiry
          </button>
        </>
      }
    >
      {aiDraftId ? (
        <p className="mb-4 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          Prepared by your AI assistant. Check every field, then click Create enquiry.
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}
      {draftLoad.loading ? <SettingsFormSkeleton rows={6} /> : null}
      {!draftLoad.loading ? (
        <EnquiryForm record={record} sections={formSections} onChange={onChange} highlightFields={highlightFields} />
      ) : null}
    </AppShell>
  );
}

export default function NewEnquiryPage() {
  return (
    <Suspense fallback={<div className="p-8"><ClientDetailSkeleton /></div>}>
      <NewEnquiryPageInner />
    </Suspense>
  );
}
