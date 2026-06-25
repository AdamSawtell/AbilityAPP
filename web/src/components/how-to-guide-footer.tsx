"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { resolvePageGuide } from "@/lib/help/page-guides";

export function HowToGuideFooter() {
  const pathname = usePathname();
  const guide = resolvePageGuide(pathname);
  if (!guide) return null;

  const areaLabel = "How to guide";

  return (
    <footer className="mt-8">
      <Link
        href={guide.href}
        className="inline-flex max-w-full items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50/80 px-2.5 py-1.5 text-[11px] leading-tight text-slate-500 shadow-sm transition hover:border-brand-border-accent hover:bg-brand-muted-surface hover:text-brand-link"
        aria-label={`${areaLabel}: ${guide.title}`}
      >
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white text-[11px] font-semibold text-brand-primary ring-1 ring-slate-200/80"
          aria-hidden
        >
          ?
        </span>
        <span className="min-w-0 truncate">
          <span className="text-slate-400">{areaLabel}</span>
          <span className="text-slate-300"> · </span>
          <span className="font-medium text-slate-600">{guide.title}</span>
        </span>
        <span className="shrink-0 text-slate-400" aria-hidden>
          →
        </span>
      </Link>
    </footer>
  );
}
