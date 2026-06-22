"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { recordDocumentHelpHref } from "@/lib/record-document-help";

export type RecordDocumentAction = {
  processId: string;
  label: string;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  busy?: boolean;
  variant?: "default" | "primary";
};

type EntityFile = {
  id: string;
  documentNo: string;
  documentLabel: string;
  fileName: string;
  mimeType: string;
  generatedAt: string;
  generatedBy: string;
};

type PrintActivity = {
  id: string;
  processLabel: string;
  userName: string;
  outcome: string;
  startedAt: string;
  detail: string;
};

function formatWhen(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 19).replace("T", " ");
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

async function openStoredDocument(generatedId: string) {
  const res = await fetch(`/api/documents/view?generatedId=${encodeURIComponent(generatedId)}`, {
    credentials: "include",
  });
  if (!res.ok) return;
  const payload = (await res.json()) as { signedUrl?: string | null };
  if (payload.signedUrl) {
    window.open(payload.signedUrl, "_blank", "noopener,noreferrer");
  }
}

const actionButtonClass =
  "rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

const primaryActionClass =
  "rounded-md border border-slate-700 bg-slate-700 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50";

export function RecordDocumentsSection({
  entityType,
  entityId,
  actions,
  helpHref,
  extras,
  mailtoUrl,
  mailtoReady = true,
  error,
  message,
  refreshKey = 0,
}: {
  entityType: string;
  entityId: string;
  actions: RecordDocumentAction[];
  helpHref?: string;
  extras?: ReactNode;
  mailtoUrl?: string | null;
  mailtoReady?: boolean;
  error?: string;
  message?: string;
  refreshKey?: number;
}) {
  const [files, setFiles] = useState<EntityFile[]>([]);
  const [activity, setActivity] = useState<PrintActivity[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  const guideHref = helpHref ?? recordDocumentHelpHref(actions.map((a) => a.processId));

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams({ entityType, entityId });
      const res = await fetch(`/api/documents/entity-history?${params}`, { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as { files?: EntityFile[]; activity?: PrintActivity[] };
      setFiles(data.files ?? []);
      setActivity(data.activity ?? []);
    } finally {
      setHistoryLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory, refreshKey]);

  if (!actions.length && !mailtoUrl) return null;

  return (
    <section className="mt-6 border-t border-slate-100 pt-4" aria-label="Documents">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Documents</p>
        <Link href={guideHref} className="text-xs text-[#b51266] hover:underline">
          How to print and send
        </Link>
      </div>

      {extras ? <div className="mt-3">{extras}</div> : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {actions.map((action) => (
          <button
            key={`${action.processId}-${action.label}`}
            type="button"
            disabled={action.disabled || action.busy}
            onClick={() => void action.onClick()}
            className={action.variant === "primary" ? primaryActionClass : actionButtonClass}
          >
            {action.busy ? `${action.label}…` : action.label}
          </button>
        ))}
        {mailtoUrl && mailtoReady ? (
          <a href={mailtoUrl} className={primaryActionClass}>
            Open email draft
          </a>
        ) : null}
      </div>

      {error ? (
        <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">{error}</p>
      ) : null}
      {message ? (
        <p className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">{message}</p>
      ) : null}

      <div className="mt-3 space-y-2">
        <button
          type="button"
          onClick={() => setShowFiles((v) => !v)}
          className="text-xs font-medium text-slate-600 hover:text-slate-900"
        >
          {showFiles ? "Hide" : "Show"} saved files{files.length ? ` (${files.length})` : ""}
        </button>
        {showFiles ? (
          <div className="overflow-hidden rounded-lg border border-slate-100 bg-slate-50/60">
            {historyLoading && !files.length ? (
              <p className="px-3 py-2 text-sm text-slate-500">Loading…</p>
            ) : files.length ? (
              <ul className="divide-y divide-slate-100">
                {files.map((file) => (
                  <li key={file.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">
                        {file.documentNo} · {file.documentLabel}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatWhen(file.generatedAt)} · {file.generatedBy || "—"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void openStoredDocument(file.id)}
                      className="shrink-0 text-xs font-medium text-[#b51266] hover:underline"
                    >
                      Open
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-3 py-2 text-sm text-slate-500">No files saved from this record yet.</p>
            )}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setShowActivity((v) => !v)}
          className="text-xs font-medium text-slate-600 hover:text-slate-900"
        >
          {showActivity ? "Hide" : "Show"} print log{activity.length ? ` (${activity.length})` : ""}
        </button>
        {showActivity ? (
          <div className="overflow-hidden rounded-lg border border-slate-100 bg-slate-50/60">
            {historyLoading && !activity.length ? (
              <p className="px-3 py-2 text-sm text-slate-500">Loading…</p>
            ) : activity.length ? (
              <ul className="divide-y divide-slate-100">
                {activity.map((row) => (
                  <li key={row.id} className="px-3 py-2 text-sm">
                    <p className="text-slate-800">
                      {row.processLabel}
                      {row.outcome !== "success" ? (
                        <span className="ml-1 text-amber-800">({row.outcome})</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-slate-500">
                      {row.userName || "—"} · {formatWhen(row.startedAt)}
                      {row.detail ? ` · ${row.detail}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-3 py-2 text-sm text-slate-500">No print or send activity logged yet.</p>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
