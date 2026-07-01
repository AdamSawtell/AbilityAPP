"use client";

import { useEffect, useState } from "react";
import { MobileAuthGuard } from "@/components/mobile/mobile-auth-guard";
import { MobileEmployeeShell } from "@/components/mobile/mobile-employee-shell";
import { CredentialEvidenceUpload } from "@/components/my-workplace/credential-evidence-upload";
import { useMyEmployee } from "@/components/my-workplace/my-workplace-guard";
import { useData } from "@/lib/data-store";
import type { EmployeeCredentialRow, EmployeeRecord } from "@/lib/employee";
import { credentialTypeOptions } from "@/lib/employee-line-tables";
import type { MyCredentialSubmitPayload } from "@/lib/my-workplace/types";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

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

export function MobileCredentialsPage() {
  const { upsertEmployee } = useData();
  const { employee: myEmployee } = useMyEmployee();
  const [credentials, setCredentials] = useState<EmployeeCredentialRow[]>([]);
  const [form, setForm] = useState<MyCredentialSubmitPayload>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function refreshCredentials() {
    const res = await fetch("/api/my/credentials", { credentials: "include" });
    if (!res.ok) throw new Error("Could not load credentials");
    const body = (await res.json()) as { credentials: EmployeeCredentialRow[] };
    setCredentials(body.credentials);
  }

  useEffect(() => {
    void refreshCredentials()
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
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
    <MobileAuthGuard windowKey="my-credentials">
      <MobileEmployeeShell title="Credentials" subtitle="Licences, checks, and evidence">
        <p className="mb-4 text-sm text-slate-600">
          Submit updated credentials before they expire. Attach a document link or upload evidence for HR review.
        </p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="mb-4 min-h-11 w-full rounded-xl bg-[#b51266] text-sm font-semibold text-white"
        >
          {showForm ? "Cancel" : "Add credential"}
        </button>

        {showForm ? (
          <form onSubmit={submitCredential} className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="font-semibold text-slate-900">Submit for review</h2>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Credential type</span>
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
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Number / ID</span>
                <input className={inputClass} value={form.credentialNumber} onChange={(e) => setForm({ ...form, credentialNumber: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Issuing body</span>
                <input className={inputClass} value={form.issuingBody} onChange={(e) => setForm({ ...form, issuingBody: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Issue date</span>
                <input type="date" className={inputClass} value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Expiry date</span>
                <input type="date" className={inputClass} value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Evidence reference</span>
                <input
                  className={inputClass}
                  placeholder="Document link or reference"
                  value={form.evidenceRef}
                  onChange={(e) => setForm({ ...form, evidenceRef: e.target.value })}
                  required
                />
              </label>
              {myEmployee?.id ? (
                <CredentialEvidenceUpload
                  employeeId={myEmployee.id}
                  onUploaded={(fileUrl) => setForm((current) => ({ ...current, evidenceRef: fileUrl }))}
                />
              ) : null}
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Notes (optional)</span>
                <textarea className={inputClass} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </label>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="mt-4 min-h-11 w-full rounded-xl bg-[#b51266] text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit for review"}
            </button>
          </form>
        ) : null}

        {loading ? <p className="text-sm text-slate-500">Loading credentials…</p> : null}
        {!loading && credentials.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-sm text-slate-600">
            No credentials on your record yet.
          </p>
        ) : null}

        <div className="space-y-3">
          {credentials.map((cred) => (
            <article key={cred.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-900">{cred.credentialType}</h3>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${statusBadgeClass(cred.status)}`}>
                  {cred.status}
                </span>
              </div>
              {cred.credentialNumber ? <p className="mt-1 text-sm text-slate-600">{cred.credentialNumber}</p> : null}
              {cred.expiryDate ? <p className="mt-1 text-xs text-slate-500">Expires {cred.expiryDate}</p> : null}
              {cred.evidenceRef ? (
                <p className="mt-2 text-sm break-all">
                  {/^https?:\/\//i.test(cred.evidenceRef) ? (
                    <a href={cred.evidenceRef} target="_blank" rel="noreferrer" className="text-[#b51266] underline">
                      View evidence
                    </a>
                  ) : (
                    cred.evidenceRef
                  )}
                </p>
              ) : null}
              {cred.reviewNotes ? <p className="mt-2 text-sm text-slate-600">HR: {cred.reviewNotes}</p> : null}
            </article>
          ))}
        </div>

        {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </MobileEmployeeShell>
    </MobileAuthGuard>
  );
}
