"use client";

export function MobileOfflineBanner({
  online,
  pending,
  syncing,
  syncError,
  onSyncNow,
}: {
  online: boolean;
  pending: number;
  syncing: boolean;
  syncError: string;
  onSyncNow: () => void;
}) {
  if (online && !pending && !syncError) return null;

  return (
    <div
      className={`mb-4 rounded-xl border px-3 py-2 text-sm ${
        online ? "border-amber-200 bg-amber-50 text-amber-950" : "border-slate-300 bg-slate-100 text-slate-800"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">
          {!online
            ? "You're offline — check-ins will sync when connected."
            : pending
              ? `${pending} check-in action${pending === 1 ? "" : "s"} waiting to sync`
              : "Sync issue"}
        </p>
        {online && pending > 0 ? (
          <button
            type="button"
            disabled={syncing}
            onClick={onSyncNow}
            className="min-h-9 rounded-lg bg-white px-3 text-xs font-semibold text-[#b51266] ring-1 ring-amber-200 disabled:opacity-60"
          >
            {syncing ? "Syncing…" : "Sync now"}
          </button>
        ) : null}
      </div>
      {syncError ? <p className="mt-1 text-xs opacity-90">{syncError}</p> : null}
      {!online && pending > 0 ? (
        <p className="mt-1 text-xs opacity-80">{pending} queued — will upload automatically.</p>
      ) : null}
    </div>
  );
}
