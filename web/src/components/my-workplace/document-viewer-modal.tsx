"use client";

import { useEffect, useState } from "react";

function isViewableUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

export function DocumentViewerModal({
  open,
  title,
  documentRef,
  onClose,
}: {
  open: boolean;
  title: string;
  documentRef: string;
  onClose: () => void;
}) {
  const [resolvedUrl, setResolvedUrl] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!open) {
      setResolvedUrl("");
      setLoadError("");
      return;
    }

    const ref = documentRef.trim();
    if (!ref) return;

    if (isViewableUrl(ref)) {
      setResolvedUrl(ref);
      return;
    }

    if (!ref.startsWith("generated:")) return;

    const generatedId = ref.slice("generated:".length);
    setLoadError("");
    void fetch(`/api/documents/view?generatedId=${encodeURIComponent(generatedId)}`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? "Could not load document");
        }
        return res.json() as Promise<{ signedUrl?: string | null }>;
      })
      .then((data) => {
        if (!data.signedUrl) throw new Error("Document link is not available");
        setResolvedUrl(data.signedUrl);
      })
      .catch((err: Error) => setLoadError(err.message));
  }, [open, documentRef]);

  if (!open) return null;

  const url = resolvedUrl.trim();
  const viewable = isViewableUrl(url);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5">
          {loadError ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">{loadError}</p>
          ) : viewable ? (
            <>
              <p className="mb-3 text-sm text-slate-600">
                <a href={url} target="_blank" rel="noreferrer" className="font-medium text-[#b51266] hover:underline">
                  Open in new tab
                </a>
              </p>
              <iframe title={title} src={url} className="h-[60vh] w-full rounded-xl border border-slate-200 bg-slate-50" />
            </>
          ) : documentRef.trim().startsWith("generated:") ? (
            <p className="text-sm text-slate-600">Loading document…</p>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
              <p className="font-medium text-slate-900">Document reference</p>
              <p className="mt-2 break-all">{documentRef.trim() || "No document link is stored for this item."}</p>
              <p className="mt-3 text-xs text-slate-500">Ask HR if you need a copy of this document.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
