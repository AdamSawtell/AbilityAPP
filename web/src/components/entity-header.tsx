"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export type EntityHeaderTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "violet"
  | "brand";

export type EntityHeaderMetaIcon =
  | "email"
  | "phone"
  | "home"
  | "mail"
  | "calendar"
  | "map-pin"
  | "user"
  | "id"
  | "building";

export type EntityHeaderBadge = {
  /** Stable key when several badges could share a label. */
  key?: string;
  label: string;
  tone?: EntityHeaderTone;
  href?: string;
};

export type EntityHeaderMetaItem = {
  key?: string;
  icon?: EntityHeaderMetaIcon;
  label: string;
  value: ReactNode;
};

export type EntityHeaderSummaryItem = {
  key?: string;
  label: string;
  value: ReactNode;
};

export type EntityHeaderProps = {
  /** Record type shown as a small uppercase eyebrow, e.g. "Client". */
  type: string;
  title: string;
  subtitle?: ReactNode;
  imageUrl?: string;
  imageAlt?: string;
  imageFit?: "cover" | "contain";
  badges?: EntityHeaderBadge[];
  metadata?: EntityHeaderMetaItem[];
  summary?: EntityHeaderSummaryItem[];
  /** Primary actions rendered top-right (Edit, Print, More, …). */
  actions?: ReactNode;
  /** Optional alert/notice rendered above the banner (e.g. compliance warning). */
  banner?: ReactNode;
};

const TONE_CLASSES: Record<EntityHeaderTone, string> = {
  neutral: "bg-slate-50 text-slate-700 ring-slate-200",
  success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  warning: "bg-amber-50 text-amber-900 ring-amber-200",
  danger: "bg-rose-50 text-rose-900 ring-rose-200",
  info: "bg-sky-50 text-sky-900 ring-sky-200",
  violet: "bg-violet-50 text-violet-900 ring-violet-200",
  brand: "bg-[#fdf2f8] text-[#b51266] ring-[#f9a8d4]",
};

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function MetaIcon({ name }: { name: EntityHeaderMetaIcon }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "email":
    case "mail":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
        </svg>
      );
    case "home":
      return (
        <svg {...common}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
          <path d="M9 21v-6h6v6" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="4.5" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 3v4M16 3v4" />
        </svg>
      );
    case "map-pin":
      return (
        <svg {...common}>
          <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      );
    case "building":
      return (
        <svg {...common}>
          <rect x="4" y="3" width="16" height="18" rx="1.5" />
          <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" />
        </svg>
      );
    case "id":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="8.5" cy="11" r="2" />
          <path d="M13 9h5M13 13h5M5 16a3.5 3.5 0 0 1 7 0" />
        </svg>
      );
    default:
      return null;
  }
}

function Badge({ badge }: { badge: EntityHeaderBadge }) {
  const tone = TONE_CLASSES[badge.tone ?? "neutral"];
  const base =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition";
  if (badge.href) {
    return (
      <Link href={badge.href} className={`${base} ${tone} hover:brightness-95`}>
        {badge.label}
      </Link>
    );
  }
  return <span className={`${base} ${tone}`}>{badge.label}</span>;
}

export function EntityHeader({
  type,
  title,
  subtitle,
  imageUrl,
  imageAlt,
  imageFit = "cover",
  badges = [],
  metadata = [],
  summary = [],
  actions,
  banner,
}: EntityHeaderProps) {
  return (
    <div className="mb-6 space-y-4">
      {banner}

      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-12px_rgba(15,23,42,0.18)]">
        <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-stretch lg:gap-8 lg:p-7">
          {/* Left — hero image */}
          <div className="flex justify-center lg:block">
            {imageUrl?.trim() ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={imageAlt ?? ""}
                className={`h-36 w-36 shrink-0 rounded-[20px] bg-white shadow-lg ring-1 ring-slate-200/80 sm:h-40 sm:w-40 lg:h-44 lg:w-44 ${
                  imageFit === "contain" ? "object-contain p-4" : "object-cover"
                }`}
              />
            ) : (
              <span className="flex h-36 w-36 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-slate-700 to-slate-900 text-4xl font-bold text-white shadow-lg ring-1 ring-slate-900/10 sm:h-40 sm:w-40 lg:h-44 lg:w-44">
                {initials(title)}
              </span>
            )}
          </div>

          {/* Centre — primary information */}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{type}</p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
            {subtitle ? <p className="mt-1.5 text-base text-slate-500 sm:text-[17px]">{subtitle}</p> : null}

            {badges.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {badges.map((badge, index) => (
                  <Badge key={badge.key ?? `${badge.label}-${index}`} badge={badge} />
                ))}
              </div>
            ) : null}

            {metadata.length > 0 ? (
              <dl className="mt-5 grid gap-x-8 gap-y-4 xl:grid-cols-2">
                {metadata.map((item, index) => (
                  <div key={item.key ?? `${item.label}-${index}`} className="flex items-start gap-3">
                    {item.icon ? (
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                        <MetaIcon name={item.icon} />
                      </span>
                    ) : null}
                    <div className="min-w-0">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        {item.label}
                      </dt>
                      <dd className="mt-0.5 break-words text-sm font-medium text-slate-800">{item.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>

          {/* Right — actions + summary panel */}
          {actions || summary.length > 0 ? (
            <div className="flex w-full shrink-0 flex-col gap-4 lg:w-60 lg:self-start">
              {actions ? <div className="flex flex-wrap gap-2 lg:justify-end">{actions}</div> : null}
              {summary.length > 0 ? (
                <dl className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  {summary.map((item, index) => (
                    <div key={item.key ?? `${item.label}-${index}`} className="min-w-0">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        {item.label}
                      </dt>
                      <dd className="mt-0.5 break-words text-sm font-medium text-slate-800">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
