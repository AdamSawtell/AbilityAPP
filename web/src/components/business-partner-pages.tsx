"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { AgencyWorkerListView } from "@/components/agency-worker-pages";
import { AppShell } from "@/components/app-shell";
import { BusinessPartnerCoreSummary } from "@/components/business-partner-core-summary";
import { UnsavedChangesBar } from "@/components/unsaved-changes-bar";
import { useModuleSaveAccess } from "@/lib/access/use-detail-write-access";
import { useAuth } from "@/lib/auth-store";
import { auditMetaFrom } from "@/lib/audit";
import { SAVE_TOAST_MESSAGES, showSuccessToast } from "@/lib/toast";
import { ClientDetailSkeleton } from "@/components/ui/page-skeletons";
import { agencyWorkersForVendor, isAgencyVendorPartner } from "@/lib/agency-worker";
import {
  businessPartnerSections,
  businessPartnerTabHref,
  businessPartnerTabs,
  resolveBusinessPartnerTab,
  type BusinessPartnerFieldDef,
  type BusinessPartnerRecord,
  type BusinessPartnerTab,
} from "@/lib/business-partner";
import { useReferenceData } from "@/lib/config-store";
import { BusinessPartnerList } from "@/components/business-partner-list";
import { useData } from "@/lib/data-store";

function PartnerField({
  field,
  value,
  onChange,
  readOnly,
}: {
  field: BusinessPartnerFieldDef;
  value: string;
  onChange: (key: keyof BusinessPartnerRecord, value: string) => void;
  readOnly?: boolean;
}) {
  const { getOptions } = useReferenceData();
  const base =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20 disabled:bg-slate-50 disabled:text-slate-500";

  if (field.readOnly || readOnly) {
    return <input className={base} value={value || "—"} readOnly disabled />;
  }

  if (field.type === "textarea") {
    return (
      <textarea
        className={`${base} min-h-[80px] resize-y`}
        value={value}
        onChange={(e) => onChange(field.key, e.target.value)}
      />
    );
  }

  if (field.type === "select" && field.optionsKey) {
    const options = getOptions(field.optionsKey);
    return (
      <select className={base} value={value} onChange={(e) => onChange(field.key, e.target.value)}>
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      className={base}
      type={field.type === "email" ? "email" : field.type === "tel" ? "tel" : "text"}
      value={value}
      onChange={(e) => onChange(field.key, e.target.value)}
    />
  );
}

function PartnerForm({
  partner,
  onChange,
  readOnly = false,
}: {
  partner: BusinessPartnerRecord;
  onChange: (key: keyof BusinessPartnerRecord, value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-6">
      {businessPartnerSections.map((section) => (
        <section key={section.title} className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">{section.title}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {section.fields.map((field) => (
              <label key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">{field.label}</span>
                <PartnerField
                  field={field}
                  value={String(partner[field.key] ?? "")}
                  onChange={onChange}
                  readOnly={readOnly}
                />
              </label>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function BusinessPartnerTabBar({
  partnerId,
  activeTab,
  showAgencyTab,
  agencyWorkerCount,
}: {
  partnerId: string;
  activeTab: BusinessPartnerTab;
  showAgencyTab: boolean;
  agencyWorkerCount: number;
}) {
  const tabs = showAgencyTab ? businessPartnerTabs : (["Overview"] as const);

  return (
    <nav className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3" aria-label="Business partner sections">
      {tabs.map((tab) => {
        const active = tab === activeTab;
        const href = businessPartnerTabHref(partnerId, tab);
        const count = tab === "Agency workers" ? agencyWorkerCount : null;
        return (
          <Link
            key={tab}
            href={href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-[#fdf2f8] text-[#b51266] ring-1 ring-[#f9a8d4] ring-inset"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {tab}
            {count != null ? (
              <span className="ml-1.5 rounded-full bg-slate-200/80 px-1.5 py-0.5 text-xs font-semibold text-slate-700">
                {count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function BusinessPartnerAgencyWorkersPanel({
  partner,
}: {
  partner: BusinessPartnerRecord;
}) {
  const { agencyWorkers } = useData();
  const { canWriteWindow } = useAuth();
  const canAddWorker = canWriteWindow("agency-workers");
  const workers = useMemo(
    () => agencyWorkersForVendor(agencyWorkers, partner.id, false),
    [agencyWorkers, partner.id]
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-sky-200 bg-sky-50/80 px-4 py-3 text-sm text-sky-950">
        Workers employed by <strong>{partner.name}</strong> appear here. They are registered separately from internal
        employees and are proposed when requesting agency coverage on roster gaps.
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {workers.length} agency worker{workers.length === 1 ? "" : "s"} linked to this vendor.
        </p>
        {canAddWorker ? (
          <Link
            href={`/agency-workers/new?vendorBpId=${encodeURIComponent(partner.id)}`}
            className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
          >
            Add agency worker
          </Link>
        ) : null}
      </div>
      <AgencyWorkerListView vendorBpId={partner.id} hideVendorColumn />
    </div>
  );
}

function BusinessPartnerDetailFallback() {
  return <ClientDetailSkeleton />;
}

export function BusinessPartnerListView() {
  const { businessPartners } = useData();
  return <BusinessPartnerList records={businessPartners} />;
}

export function BusinessPartnerDetailView({ id }: { id: string }) {
  return (
    <Suspense fallback={<BusinessPartnerDetailFallback />}>
      <BusinessPartnerDetailViewInner id={id} />
    </Suspense>
  );
}

function BusinessPartnerDetailViewInner({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { businessPartners, agencyWorkers, upsertBusinessPartner } = useData();
  const canSave = useModuleSaveAccess("business-partners", "business-partner");
  const stored = businessPartners.find((p) => p.id === id);
  const [draft, setDraft] = useState<BusinessPartnerRecord | null>(null);
  const [saved, setSaved] = useState(false);

  const partner = draft ?? stored ?? null;
  const hasUnsavedChanges = Boolean(draft);
  const showAgencyTab = Boolean(partner && isAgencyVendorPartner(partner.partnerType));
  const activeTab = resolveBusinessPartnerTab(searchParams.get("tab"), showAgencyTab);
  const agencyWorkerCount = useMemo(
    () => (partner ? agencyWorkersForVendor(agencyWorkers, partner.id, false).length : 0),
    [agencyWorkers, partner]
  );

  useEffect(() => {
    if (!partner) return;
    if (activeTab === "Agency workers" && !showAgencyTab) {
      router.replace(businessPartnerTabHref(partner.id, "Overview"));
    }
  }, [partner, activeTab, showAgencyTab, router]);

  if (!partner) {
    return (
      <AppShell
        title="Business partner not found"
        audit={{ moduleLabel: "Business partners" }}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Business partners", href: "/business-partners" },
          { label: "Not found" },
        ]}
      >
        <p className="text-slate-600">No business partner with ID {id}.</p>
        <Link href="/business-partners" className="mt-4 inline-block text-[#b51266] hover:underline">
          Back to business partners
        </Link>
      </AppShell>
    );
  }

  function onChange(key: keyof BusinessPartnerRecord, value: string) {
    const base = draft ?? stored;
    if (!base) return;
    const next = { ...base, [key]: value, updatedBy: "SuperUser" };
    setDraft(next);
    setSaved(false);
    if (key === "partnerType" && activeTab === "Agency workers" && !isAgencyVendorPartner(value)) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("tab");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }
  }

  function onSave() {
    if (!partner) return;
    try {
      upsertBusinessPartner(partner);
      setDraft(null);
      setSaved(true);
      showSuccessToast(SAVE_TOAST_MESSAGES.saved);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not save business partner.");
    }
  }

  function onDiscard() {
    setDraft(null);
    setSaved(false);
  }

  return (
    <>
      <AppShell
        title={partner.name}
        subtitle={`${partner.searchKey} · ${partner.partnerType || "External partner"}`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Business partners", href: "/business-partners" },
          { label: partner.searchKey },
        ]}
        audit={{
          entityType: "business-partner",
          entityId: partner.id,
          meta: auditMetaFrom(stored ?? partner),
        }}
      >
        <BusinessPartnerCoreSummary partner={partner} saved={saved && !hasUnsavedChanges} />

        <BusinessPartnerTabBar
          partnerId={partner.id}
          activeTab={activeTab}
          showAgencyTab={showAgencyTab}
          agencyWorkerCount={agencyWorkerCount}
        />
        {activeTab === "Overview" ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <PartnerForm partner={partner} onChange={onChange} readOnly={!canSave} />
          </div>
        ) : (
          <BusinessPartnerAgencyWorkersPanel partner={partner} />
        )}
      </AppShell>
      {activeTab === "Overview" ? (
        <UnsavedChangesBar visible={hasUnsavedChanges && canSave} onSave={onSave} onDiscard={onDiscard} />
      ) : null}
    </>
  );
}

export function NewBusinessPartnerView() {
  const router = useRouter();
  const { addBusinessPartner } = useData();
  const { canWriteWindow } = useAuth();
  const canCreate = canWriteWindow("business-partners");

  const seed = useMemo(
    (): BusinessPartnerRecord => ({
      id: "",
      searchKey: "",
      name: "",
      partnerType: "Plan manager",
      status: "Active",
      email: "",
      phone: "",
      mobile: "",
      abn: "",
      address1: "",
      address2: "",
      city: "",
      state: "SA",
      postcode: "",
      country: "Australia",
      preferredCommunicationMethod: "Email",
      invoiceDeliveryMethod: "Email",
      statementDeliveryMethod: "Email",
      paymentTerms: "14 days",
      bankBsb: "",
      bankAccountNumber: "",
      bankAccountName: "",
      remittanceEmail: "",
      agencyHourlyRate: 0,
      notes: "",
      createdBy: "SuperUser",
      updatedBy: "SuperUser",
    }),
    []
  );

  const [record, setRecord] = useState(seed);
  const [error, setError] = useState("");

  if (!canCreate) {
    return (
      <AppShell title="New business partner" audit={{ moduleLabel: "Business partners" }}>
        <p className="text-slate-600">You do not have permission to create business partners.</p>
      </AppShell>
    );
  }

  function onChange(key: keyof BusinessPartnerRecord, value: string) {
    setRecord((prev) => ({ ...prev, [key]: value, updatedBy: "SuperUser" }));
    setError("");
  }

  function onCreate() {
    if (!record.searchKey.trim() || !record.name.trim() || !record.partnerType.trim()) {
      setError("Search key, name, and partner type are required.");
      return;
    }
    try {
      const created = addBusinessPartner(record);
      router.push(`/business-partners/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create business partner.");
    }
  }

  return (
    <AppShell
      title="New business partner"
      subtitle="Plan managers, vendors, referrers, and other external organisations"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Business partners", href: "/business-partners" },
        { label: "New" },
      ]}
      audit={{ moduleLabel: "Business partners" }}
      actions={
        <button
          type="button"
          onClick={onCreate}
          className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
        >
          Create partner
        </button>
      }
    >
      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <PartnerForm partner={record} onChange={onChange} />
      </div>
    </AppShell>
  );
}
