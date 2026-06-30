import Link from "next/link";
import type { BreadcrumbItem } from "@/lib/breadcrumbs/types";

const MAX_TRUNCATED_LABEL = 36;

function BreadcrumbLabel({ label, truncate }: { label: string; truncate: boolean }) {
  if (!truncate || label.length <= MAX_TRUNCATED_LABEL) {
    return <span>{label}</span>;
  }
  return (
    <span className="max-w-[12rem] truncate" title={label}>
      {label}
    </span>
  );
}

/**
 * AB-0039 — horizontal breadcrumb trail below the top nav and above the page title.
 * Parent segments are links; the current page is plain text.
 */
export function Breadcrumbs({ items, className = "" }: { items: BreadcrumbItem[]; className?: string }) {
  if (!items.length) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`mb-3 border-b border-slate-100 bg-slate-50/60 px-1 py-2 text-sm text-slate-500 ${className}`.trim()}
    >
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const truncate = items.length > 3 || item.label.length > MAX_TRUNCATED_LABEL;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex min-w-0 items-center gap-1.5">
              {index > 0 ? (
                <span className="text-slate-300" aria-hidden="true">
                  &gt;
                </span>
              ) : null}
              {item.href && !isLast ? (
                <Link href={item.href} className="cursor-pointer hover:text-brand-link hover:underline">
                  <BreadcrumbLabel label={item.label} truncate={truncate} />
                </Link>
              ) : (
                <span className={isLast ? "font-medium text-slate-900" : undefined}>
                  <BreadcrumbLabel label={item.label} truncate={truncate} />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export type { BreadcrumbItem };
