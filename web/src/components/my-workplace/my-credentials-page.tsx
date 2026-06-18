"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { MyWorkplaceGuard, myWorkplaceBreadcrumbs } from "@/components/my-workplace/my-workplace-guard";
import { MyWorkplaceSubnav } from "@/components/my-workplace/my-workplace-subnav";
import { useData } from "@/lib/data-store";
import type { EmployeeCredentialRow, EmployeeRecord } from "@/lib/employee";
import { credentialTypeOptions } from "@/lib/employee-line-tables";
import type { MyCredentialSubmitPayload } from "@/lib/my-workplace/types";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

function statusBadgeClass(status: string): string {
  if (status === "Current") return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  if (status === "Pending review") return "bg-sky-50 text-sky-800 ring-sky-200";
  if (status === "Rejected") return "bg-rose-50 text-rose-800 ring-rose-200";
  if (status === "Expired" || status === "Expiring soon") return "bg-amber-50 text-amber-900 ring-amber-200";
  return "bg-slate-50 text-slate-700 ring-slate-200";
}

const emptyForm: MyCredentialSubmitPayload = {
  credentialType: "",
  credentialNumber: "",
  issuingBody: "",
  issueDate: "",
  expiryDate: "",
  evidenceRef: "",
  notes: "",
};

export function MyCredentialsPage() {
  const { upsertEmployee } = useData();
  const [credentials, setCredentials] = useState<EmployeeCredentialRow[]>([]);
  const [form, setForm] = useState<MyCredentialSubmitPayload>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function refreshCredentials(showLoading = false) {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch("/api/my/credentials", { credentials: "include" });
      if (!res.ok) throw new Error("Could not load credentials");
      const body = (await res.json()) as { credentials: EmployeeCredentialRow[] };
      setCredentials(body.credentials);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/my/credentials", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load credentials");
        return res.json() as Promise<{ credentials: EmployeeCredentialRow[] }>;
      })
      .then((body) => {
        if (!cancelled) setCredentials(body.credentials);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function submitCredential(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/my/credentials", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = (await res.json()) as { error?: string; employee?: EmployeeRecord };
      if (!res.ok) throw new Error(body.error ?? "Submit failed");
      if (body.employee) upsertEmployee(body.employee);
      setForm(emptyForm);
      setShowForm(false);
      setMessage("Credential submitted for HR review.");
      await refreshCredentials();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <MyWorkplaceGuard windowKey="my-credentials">
      <AppShell
        title="My credentials"
        subtitle="Add licences and checks with evidence. HR reviews and signs off when complete."
        breadcrumbs={myWorkplaceBreadcrumbs("Credentials")}
        audit={{ moduleLabel: "My credentials" }}
      >
        <MyWorkplaceSubnav />

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Submit updated credentials before they expire. Attach a document link or reference as evidence.
          </p>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
          >
            {showForm ? "Cancel" : "Add credential"}
          </button>
        </div>

        {showForm ? (
          <form onSubmit={submitCredential} className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Submit credential for review</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Credential type</span>
                <select
                  className={inputClass}
                  value={form.credentialType}
                  onChange={(e) => setForm({ ...form, credentialType: e.target.value })}
                  required
                >
                  <option value="">Select type…</option>
                  {credentialTypeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Number / ID</span>
                <input className={inputClass} value={form.credentialNumber} onChange={(e) => setForm({ ...form, credentialNumber: e.target.value })} />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Issuing body</span>
                <input className={inputClass} value={form.issuingBody} onChange={(e) => setForm({ ...form, issuingBody: e.target.value })} />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Issue date</span>
                <input type="date" className={inputClass} value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Expiry date</span>
                <input type="date" className={inputClass} value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Evidence reference</span>
                <input
                  className={inputClass}
                  placeholder="Document link, file reference, or upload ID"
                  value={form.evidenceRef}
                  onChange={(e) => setForm({ ...form, evidenceRef: e.target.value })}
                  required
                />
                <span className="mt-1 block text-xs text-slate-500">HR uses this to verify your credential before sign-off.</span>
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Notes (optional)</span>
                <textarea className={inputClass} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </label>
            </div>
            <button type="submit" disabled={submitting} className="mt-4 rounded-lg bg-[#d4147a] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#b51266] disabled:opacity-60">
              {submitting ? "Submitting…" : "Submit for review"}
            </button>
          </form>
        ) : null}

        {loading ? <p className="text-sm text-slate-500">Loading credentials…</p> : null}

        {!loading && credentials.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-sm text-slate-600">
            No credentials on your record yet. Add your first credential with evidence to start the review process.
          </p>
        ) : null}

        <div className="space-y-3">
          {credentials.map((cred) => (
            <article key={cred.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{cred.credentialType}</h3>
                  {cred.credentialNumber ? <p className="text-sm text-slate-600">{cred.credentialNumber}</p> : null}
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${statusBadgeClass(cred.status)}`}>
                  {cred.status}
                </span>
              </div>
              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                {cred.issuingBody ? (
                  <div>
                    <dt className="text-slate-500">Issuing body</dt>
                    <dd>{cred.issuingBody}</dd>
                  </div>
                ) : null}
                {cred.issueDate ? (
                  <div>
                    <dt className="text-slate-500">Issue date</dt>
                    <dd>{cred.issueDate}</dd>
                  </div>
                ) : null}
                {cred.expiryDate ? (
                  <div>
                    <dt className="text-slate-500">Expiry date</dt>
                    <dd>{cred.expiryDate}</dd>
                  </div>
                ) : null}
                {cred.evidenceRef ? (
                  <div className="sm:col-span-2">
                    <dt className="text-slate-500">Evidence</dt>
                    <dd className="break-all">{cred.evidenceRef}</dd>
                  </div>
                ) : null}
                {cred.reviewNotes ? (
                  <div className="sm:col-span-2">
                    <dt className="text-slate-500">HR feedback</dt>
                    <dd>{cred.reviewNotes}</dd>
                  </div>
                ) : null}
                {cred.reviewedAt && cred.reviewedBy ? (
                  <div className="sm:col-span-2 text-xs text-slate-500">
                    Reviewed by {cred.reviewedBy} on {cred.reviewedAt.slice(0, 10)}
                  </div>
                ) : null}
              </dl>
            </article>
          ))}
        </div>

        {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </AppShell>
    </MyWorkplaceGuard>
  );
}
