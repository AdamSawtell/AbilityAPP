"use client";

type SessionExpiryModalProps = {
  timeoutMinutes: number;
  remainingSeconds: number;
  onStaySignedIn: () => void;
};

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function SessionExpiryModal({
  timeoutMinutes,
  remainingSeconds,
  onStaySignedIn,
}: SessionExpiryModalProps) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-expiry-title"
        aria-describedby="session-expiry-description"
        className="w-full max-w-lg rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-2xl"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl text-amber-700">
          <span aria-hidden>!</span>
        </div>
        <h2 id="session-expiry-title" className="mt-4 text-xl font-semibold text-slate-950">
          Session expiring
        </h2>
        <p id="session-expiry-description" className="mt-3 text-sm leading-6 text-slate-600">
          You've been inactive for {timeoutMinutes} minute{timeoutMinutes === 1 ? "" : "s"}. Your
          session will expire in 2 minutes unless you stay signed in.
        </p>
        <p className="mt-5 rounded-xl bg-slate-100 px-4 py-3 font-mono text-3xl font-semibold text-slate-950">
          {formatCountdown(remainingSeconds)}
        </p>
        <button
          type="button"
          onClick={onStaySignedIn}
          className="mt-6 w-full rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        >
          Stay signed in
        </button>
      </div>
    </div>
  );
}
