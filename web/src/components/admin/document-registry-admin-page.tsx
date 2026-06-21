"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SystemShell } from "@/components/system/system-shell";
import { useAdminPageAccess } from "@/lib/access/window-surface";
import { DOCUMENT_CLASS_LABELS } from "@/lib/document-template";
import { useDocumentPlatform } from "@/lib/document-platform-store";

export function DocumentRegistryAdminPage() {
  const { hasAnyAccess } = useAdminPageAccess("system");
  const hasPageAccess = hasAnyAccess(["admin-document-registry", "admin-document-templates"]);
  const { generatedDocuments, loading } = useDocumentPlatform();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return generatedDocuments;
    return generatedDocuments.filter(
      (doc) =>
        doc.documentNo.toLowerCase().includes(q) ||
        doc.entityLabel.toLowerCase().includes(q) ||
        doc.entityType.toLowerCase().includes(q)
    );
  }, [generatedDocuments, query]);

  if (!hasPageAccess) {
    return (
      <SystemShell title="Document registry" audit={{ moduleLabel: "Document registry" }}>
        <p className="text-sm text-slate-600">Sign in to System to view generated documents.</p>
      </SystemShell>
    );
  }

  return (
    <SystemShell
      title="Document registry"
      subtitle="Generated documents saved from print and export actions."
      audit={{ moduleLabel: "Document registry" }}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input
          className="w-full max-w-md rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm"
          placeholder="Search document no, entity, or type"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Link href="/system/admin/document-templates" className="text-sm font-medium text-[#b51266] hover:underline">
          Document templates
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Document</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Generated</th>
              <th className="px-4 py-3">By</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : filtered.length ? (
              filtered.map((doc) => (
                <tr key={doc.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{doc.documentNo}</td>
                  <td className="px-4 py-3 text-slate-700">{DOCUMENT_CLASS_LABELS[doc.documentClass] ?? doc.documentClass}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {doc.entityType} · {doc.entityLabel || doc.entityId}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{doc.generatedAt?.slice(0, 19).replace("T", " ") || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{doc.generatedBy || "—"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No generated documents yet. Print or download an invoice to create the first registry entry.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </SystemShell>
  );
}
