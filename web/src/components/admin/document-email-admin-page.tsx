"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SystemShell } from "@/components/system/system-shell";
import { UnsavedChangesBar } from "@/components/unsaved-changes-bar";
import { useAdminPageAccess } from "@/lib/access/window-surface";
import {
  DOCUMENT_EMAIL_TEMPLATE_PLACEHOLDERS,
  initialDocumentEmailTemplates,
  normalizeDocumentEmailTemplate,
  renderDocumentEmailTemplate,
  type DocumentEmailTemplateRecord,
} from "@/lib/document-email-template";
import { useOrganization } from "@/lib/organization-store";
import { SettingsFormSkeleton } from "@/components/ui/page-skeletons";
import { organizationDisplayName } from "@/lib/organization";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

export function DocumentEmailAdminPage() {
  const { hasAnyAccess } = useAdminPageAccess("system");
  const hasPageAccess = hasAnyAccess(["admin-document-email"]);
  const { organization } = useOrganization();
  const [templates, setTemplates] = useState<DocumentEmailTemplateRecord[]>(initialDocumentEmailTemplates);
  const [activeProcessId, setActiveProcessId] = useState(initialDocumentEmailTemplates[0]?.processId ?? "");
  const [draft, setDraft] = useState<DocumentEmailTemplateRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [saveError, setSaveError] = useState("");

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/document-email-templates", { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as { templates?: DocumentEmailTemplateRecord[] };
      if (data.templates?.length) setTemplates(data.templates);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const sorted = useMemo(
    () => [...templates].sort((a, b) => a.label.localeCompare(b.label)),
    [templates]
  );
  const record = draft ?? sorted.find((t) => t.processId === activeProcessId) ?? null;
  const persisted = sorted.find((t) => t.processId === activeProcessId) ?? null;
  const isDirty = Boolean(draft && (!persisted || JSON.stringify(draft) !== JSON.stringify(persisted)));

  const preview = useMemo(() => {
    if (!record) return null;
    return renderDocumentEmailTemplate(record, {
      orgName: organizationDisplayName(organization),
      recipientName: "Alex Sample",
      recipientEmail: "alex@example.com",
      documentNo: "DOC-12345678",
      entityLabel: "Sample record",
      planDocumentNo: "SP-001",
      invoiceDocumentNo: "INV-001",
      periodStart: "2025-10-06",
      periodEnd: "2025-10-12",
      amount: "$1,234.56",
    });
  }, [organization, record]);

  async function handleSave() {
    if (!record) return;
    setSaveError("");
    setSaveState("saving");
    try {
      const res = await fetch("/api/admin/document-email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ template: record }),
      });
      const payload = (await res.json()) as { error?: string; template?: DocumentEmailTemplateRecord };
      if (!res.ok) {
        setSaveError(payload.error ?? "Could not save email content.");
        setSaveState("idle");
        return;
      }
      const saved = payload.template ? normalizeDocumentEmailTemplate(payload.template) : record;
      setTemplates((prev) => {
        const exists = prev.some((t) => t.processId === saved.processId);
        return exists ? prev.map((t) => (t.processId === saved.processId ? saved : t)) : [...prev, saved];
      });
      setDraft(null);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveError("Could not save email content.");
      setSaveState("idle");
    }
  }

  if (!hasPageAccess) {
    return (
      <SystemShell title="Email content" audit={{ moduleLabel: "Email content" }}>
        <p className="text-sm text-slate-600">You do not have access to manage document email content.</p>
      </SystemShell>
    );
  }

  return (
    <SystemShell title="Email content" audit={{ moduleLabel: "Email content" }}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-600">
              Edit subject and body text used when staff click Send via Email on support plans or invoices. Placeholders
              are replaced when someone sends.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Layout and branding stay on{" "}
              <Link href="/system/admin/document-templates" className="text-[#b51266] hover:underline">
                Document templates
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav className="space-y-1">
            {sorted.map((template) => (
              <button
                key={template.processId}
                type="button"
                onClick={() => {
                  setActiveProcessId(template.processId);
                  setDraft(null);
                }}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                  activeProcessId === template.processId
                    ? "bg-white font-medium text-[#b51266] shadow-sm ring-1 ring-[#f9a8d4]/60"
                    : "text-slate-600 hover:bg-white/80"
                }`}
              >
                {template.label}
              </button>
            ))}
          </nav>

          {record ? (
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              {loading ? (
                <SettingsFormSkeleton rows={3} />
              ) : (
                <>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Subject</span>
                <input
                  className={inputClass}
                  value={record.subject}
                  onChange={(e) =>
                    setDraft({ ...(draft ?? record), subject: e.target.value, processId: record.processId, id: record.id })
                  }
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Body</span>
                <textarea
                  className={`${inputClass} min-h-[200px] resize-y font-mono text-[13px]`}
                  value={record.body}
                  onChange={(e) =>
                    setDraft({ ...(draft ?? record), body: e.target.value, processId: record.processId, id: record.id })
                  }
                />
              </label>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Placeholders</p>
                <p className="mt-1 flex flex-wrap gap-1">
                  {DOCUMENT_EMAIL_TEMPLATE_PLACEHOLDERS.map((token) => (
                    <code key={token} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">
                      {token}
                    </code>
                  ))}
                </p>
              </div>
              {preview ? (
                <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Preview</p>
                  <p className="mt-2 text-sm font-medium text-slate-900">{preview.subject}</p>
                  <pre className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{preview.body}</pre>
                </div>
              ) : null}
              {saveError ? (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">{saveError}</p>
              ) : null}
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <UnsavedChangesBar
        visible={isDirty}
        onSave={() => void handleSave()}
        onDiscard={() => setDraft(null)}
        saveDisabled={saveState === "saving"}
        message={saveState === "saved" ? "Email content saved" : "You have unsaved email content changes"}
      />
    </SystemShell>
  );
}
