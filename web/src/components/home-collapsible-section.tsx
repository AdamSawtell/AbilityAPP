"use client";

import { useEffect, useId, useState } from "react";

const STORAGE_PREFIX = "abilityapp-home-section:";

export function HomeCollapsibleSection({
  sectionId,
  title,
  subtitle,
  defaultOpen = true,
  badge,
  children,
}: {
  sectionId: string;
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  badge?: number | string;
  children: React.ReactNode;
}) {
  const headingId = useId();
  const panelId = useId();
  const [open, setOpen] = useState(defaultOpen);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${sectionId}`);
      if (raw === "0") setOpen(false);
      else if (raw === "1") setOpen(true);
    } catch {
      // ignore
    }
    setReady(true);
  }, [sectionId]);

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${sectionId}`, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }

  if (!ready) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="px-5 py-4">
          <h2 className="font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        id={headingId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
        className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50/80"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-slate-900">{title}</h2>
            {badge !== undefined && badge !== 0 && badge !== "" ? (
              <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 ring-inset">
                {badge}
              </span>
            ) : null}
          </div>
          {subtitle ? <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        <span
          className={`mt-0.5 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </span>
      </button>
      {open ? (
        <div id={panelId} role="region" aria-labelledby={headingId} className="border-t border-slate-100 px-5 py-4">
          {children}
        </div>
      ) : null}
    </section>
  );
}
