"use client";

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
  if (!open) return null;

  const url = documentRef.trim();
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
          {viewable ? (
            <>
              <p className="mb-3 text-sm text-slate-600">
                <a href={url} target="_blank" rel="noreferrer" className="font-medium text-[#b51266] hover:underline">
                  Open in new tab
                </a>
              </p>
              <iframe title={title} src={url} className="h-[60vh] w-full rounded-xl border border-slate-200 bg-slate-50" />
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
              <p className="font-medium text-slate-900">Document reference</p>
              <p className="mt-2 break-all">{url || "No document link is stored for this item."}</p>
              <p className="mt-3 text-xs text-slate-500">Ask HR if you need a copy of this document.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
