"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { SiteOrientationPanel } from "@/components/site-orientation-panel";
import { UnsavedChangesBar } from "@/components/unsaved-changes-bar";
import { useModuleSaveAccess } from "@/lib/access/use-detail-write-access";
import { useAuth } from "@/lib/auth-store";
import { auditMetaFrom } from "@/lib/audit";
import { SAVE_TOAST_MESSAGES, showSuccessToast } from "@/lib/toast";
import {
  agencyWorkerDisplayName,
  agencyWorkersForVendor,
  createAgencyWorker,
  isAgencyVendorPartner,
  normalizeAgencyWorker,
  type AgencyWorkerRecord,
} from "@/lib/agency-worker";
import { useData } from "@/lib/data-store";
import { businessPartnerTabHref } from "@/lib/business-partner";

function AgencyWorkerForm({
  worker,
  vendorOptions,
  onChange,
  readOnly,
}: {
  worker: AgencyWorkerRecord;
  vendorOptions: { id: string; label: string }[];
  onChange: (key: keyof AgencyWorkerRecord, value: string | boolean) => void;
  readOnly?: boolean;
}) {
  const base =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20 disabled:bg-slate-50 disabled:text-slate-500";

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="block md:col-span-2">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Works for (agency vendor)
        </span>
        <select
          className={base}
          value={worker.vendorBpId}
          disabled={readOnly}
          onChange={(e) => onChange("vendorBpId", e.target.value)}
        >
          <option value="">Select vendor…</option>
          {vendorOptions.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">First name</span>
        <input
          className={base}
          value={worker.firstName}
          readOnly={readOnly}
          disabled={readOnly}
          onChange={(e) => onChange("firstName", e.target.value)}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Last name</span>
        <input
          className={base}
          value={worker.lastName}
          readOnly={readOnly}
          disabled={readOnly}
          onChange={(e) => onChange("lastName", e.target.value)}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</span>
        <input
          className={base}
          type="email"
          value={worker.email}
          readOnly={readOnly}
          disabled={readOnly}
          onChange={(e) => onChange("email", e.target.value)}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</span>
        <input
          className={base}
          value={worker.phone}
          readOnly={readOnly}
          disabled={readOnly}
          onChange={(e) => onChange("phone", e.target.value)}
        />
      </label>
      <label className="block md:col-span-2">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Qualifications</span>
        <input
          className={base}
          value={worker.qualifications}
          readOnly={readOnly}
          disabled={readOnly}
          onChange={(e) => onChange("qualifications", e.target.value)}
        />
      </label>
      <label className="block md:col-span-2">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Skills</span>
        <textarea
          className={`${base} min-h-[72px] resize-y`}
          value={worker.skills}
          readOnly={readOnly}
          disabled={readOnly}
          onChange={(e) => onChange("skills", e.target.value)}
        />
      </label>
      <label className="block md:col-span-2">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Tools and transport
        </span>
        <input
          className={base}
          value={worker.toolsNotes}
          readOnly={readOnly}
          disabled={readOnly}
          onChange={(e) => onChange("toolsNotes", e.target.value)}
        />
      </label>
      <label className="flex items-center gap-2 md:col-span-2">
        <input
          type="checkbox"
          checked={worker.active}
          disabled={readOnly}
          onChange={(e) => onChange("active", e.target.checked)}
        />
        <span className="text-sm text-slate-700">Active — available for agency shift assignment</span>
      </label>
      <label className="block md:col-span-2">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</span>
        <textarea
          className={`${base} min-h-[80px] resize-y`}
          value={worker.notes}
          readOnly={readOnly}
          disabled={readOnly}
          onChange={(e) => onChange("notes", e.target.value)}
        />
      </label>
    </div>
  );
}

export function AgencyWorkerListView({
  vendorBpId,
  hideVendorColumn = false,
}: {
  vendorBpId?: string;
  hideVendorColumn?: boolean;
}) {
  const { agencyWorkers, businessPartners } = useData();
  const rows = useMemo(() => {
    const list = vendorBpId
      ? agencyWorkersForVendor(agencyWorkers, vendorBpId, false)
      : agencyWorkers.map(normalizeAgencyWorker);
    return list.sort((a, b) => agencyWorkerDisplayName(a).localeCompare(agencyWorkerDisplayName(b)));
  }, [agencyWorkers, vendorBpId]);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Name</th>
            {!hideVendorColumn ? <th className="px-4 py-3">Agency vendor</th> : null}
            <th className="px-4 py-3">Skills</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((worker) => {
            const vendor = businessPartners.find((p) => p.id === worker.vendorBpId);
            return (
              <tr key={worker.id} className="hover:bg-slate-50/80">
                <td className="px-4 py-3">
                  <Link href={`/agency-workers/${worker.id}`} className="font-medium text-[#b51266] hover:underline">
                    {agencyWorkerDisplayName(worker)}
                  </Link>
                </td>
                {!hideVendorColumn ? (
                  <td className="px-4 py-3 text-slate-700">
                    {vendor ? (
                      <Link
                        href={`/business-partners/${vendor.id}?tab=${encodeURIComponent("Agency workers")}`}
                        className="hover:underline"
                      >
                        {vendor.name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                ) : null}
                <td className="max-w-xs truncate px-4 py-3 text-slate-600">{worker.skills || "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      worker.active ? "bg-emerald-100 text-emerald-900" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {worker.active ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            );
          })}
          {!rows.length ? (
            <tr>
              <td colSpan={hideVendorColumn ? 3 : 4} className="px-4 py-8 text-center text-slate-500">
                No agency workers yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

export function AgencyWorkerDetailView({ id }: { id: string }) {
  const { agencyWorkers, businessPartners, upsertAgencyWorker } = useData();
  const { session } = useAuth();
  const canSave = useModuleSaveAccess("agency-workers", "agency-worker");
  const stored = agencyWorkers.find((w) => w.id === id);
  const [draft, setDraft] = useState<AgencyWorkerRecord | null>(null);
  const [saved, setSaved] = useState(false);

  const vendorOptions = useMemo(
    () =>
      businessPartners
        .filter((p) => isAgencyVendorPartner(p.partnerType))
        .map((p) => ({ id: p.id, label: p.name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [businessPartners]
  );

  const worker = draft ?? stored ?? null;
  const hasUnsavedChanges = Boolean(draft);

  if (!worker) {
    return (
      <AppShell
        title="Agency worker not found"
        audit={{ moduleLabel: "Agency workers" }}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Agency workers", href: "/agency-workers" },
          { label: "Not found" },
        ]}
      >
        <p className="text-slate-600">No agency worker with ID {id}.</p>
        <Link href="/agency-workers" className="mt-4 inline-block text-[#b51266] hover:underline">
          Back to agency workers
        </Link>
      </AppShell>
    );
  }

  function onChange(key: keyof AgencyWorkerRecord, value: string | boolean) {
    const base = draft ?? stored;
    if (!base) return;
    const next = { ...base, [key]: value, updatedBy: "SuperUser" };
    const name =
      key === "firstName" || key === "lastName"
        ? `${key === "firstName" ? String(value) : next.firstName} ${key === "lastName" ? String(value) : next.lastName}`.trim()
        : next.name;
    setDraft(
      normalizeAgencyWorker({
        ...next,
        name,
        searchKey: name || next.searchKey,
      })
    );
    setSaved(false);
  }

  function onSave() {
    if (!worker) return;
    if (!worker.vendorBpId?.trim()) {
      alert("Select the agency vendor this worker works for.");
      return;
    }
    const err = upsertAgencyWorker(worker);
    if (err) {
      alert(err);
      return;
    }
    setDraft(null);
    setSaved(true);
    showSuccessToast(SAVE_TOAST_MESSAGES.saved);
  }

  const vendor = businessPartners.find((p) => p.id === worker.vendorBpId);

  return (
    <>
      <AppShell
        title={agencyWorkerDisplayName(worker)}
        subtitle={vendor ? `Agency employee · ${vendor.name}` : "Agency employee"}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Agency workers", href: "/agency-workers" },
          { label: worker.searchKey },
        ]}
        audit={{
          entityType: "agency-worker",
          entityId: worker.id,
          meta: auditMetaFrom(stored ?? worker),
        }}
      >
        <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50/80 px-4 py-3 text-sm text-sky-950">
          Agency workers are flagged separately from employees. They are linked to a staffing vendor business partner
          and can be assigned to roster shifts through the agency coverage workflow.
        </div>
        {vendor ? (
          <p className="mb-4 text-sm text-slate-600">
            Works for{" "}
            <Link
              href={`/business-partners/${vendor.id}?tab=${encodeURIComponent("Agency workers")}`}
              className="font-medium text-[#b51266] hover:underline"
            >
              {vendor.name}
            </Link>
            {" · "}
            <Link href={businessPartnerTabHref(vendor.id, "Agency workers")} className="text-[#b51266] hover:underline">
              View vendor worker pool
            </Link>
          </p>
        ) : null}
        {saved && !hasUnsavedChanges ? <p className="mb-4 text-sm text-emerald-700">Saved</p> : null}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <AgencyWorkerForm
            worker={worker}
            vendorOptions={vendorOptions}
            onChange={onChange}
            readOnly={!canSave}
          />
        </div>
        <section className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Site orientations</h3>
          <SiteOrientationPanel
            workerType="agency"
            workerId={worker.id}
            readOnly={!canSave}
            actor={session?.displayName ?? "SuperUser"}
          />
        </section>
      </AppShell>
      <UnsavedChangesBar visible={hasUnsavedChanges && canSave} onSave={onSave} onDiscard={() => setDraft(null)} />
    </>
  );
}

export function NewAgencyWorkerView({ vendorBpId }: { vendorBpId?: string }) {
  const router = useRouter();
  const { agencyWorkers, upsertAgencyWorker, businessPartners } = useData();
  const { canWriteWindow, session } = useAuth();
  const canCreate = canWriteWindow("agency-workers");

  const vendorOptions = useMemo(
    () =>
      businessPartners
        .filter((p) => isAgencyVendorPartner(p.partnerType))
        .map((p) => ({ id: p.id, label: p.name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [businessPartners]
  );

  const [worker, setWorker] = useState(() =>
    createAgencyWorker({ vendorBpId: vendorBpId ?? "", createdBy: "SuperUser", updatedBy: "SuperUser" }, agencyWorkers)
  );

  if (!canCreate) {
    return (
      <AppShell title="Add agency worker" audit={{ moduleLabel: "Agency workers" }}>
        <p className="text-slate-600">You do not have permission to add agency workers.</p>
      </AppShell>
    );
  }

  function onChange(key: keyof AgencyWorkerRecord, value: string | boolean) {
    const next = { ...worker, [key]: value };
    setWorker(
      normalizeAgencyWorker({
        ...next,
        name:
          key === "firstName" || key === "lastName"
            ? `${key === "firstName" ? String(value) : next.firstName} ${key === "lastName" ? String(value) : next.lastName}`.trim()
            : next.name,
        searchKey:
          key === "firstName" || key === "lastName"
            ? `${key === "firstName" ? String(value) : next.firstName} ${key === "lastName" ? String(value) : next.lastName}`.trim()
            : next.searchKey,
      })
    );
  }

  function onSave() {
    if (!worker.vendorBpId?.trim()) {
      alert("Select the agency vendor this worker works for.");
      return;
    }
    const err = upsertAgencyWorker(worker);
    if (err) {
      alert(err);
      return;
    }
    showSuccessToast(SAVE_TOAST_MESSAGES.staff);
    router.push(`/agency-workers/${worker.id}`);
  }

  return (
    <AppShell
      title="Add agency worker"
      subtitle="Register a worker employed by an agency vendor — not a full employee record."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Agency workers", href: "/agency-workers" },
        { label: "New" },
      ]}
      audit={{ moduleLabel: "Agency workers" }}
    >
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <AgencyWorkerForm worker={worker} vendorOptions={vendorOptions} onChange={onChange} />
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onSave}
            className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
          >
            Save agency worker
          </button>
        </div>
      </div>
    </AppShell>
  );
}
