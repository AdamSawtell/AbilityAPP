import Link from "next/link";
import type { ReactNode, SVGProps } from "react";

export type EmptyStateVariant = "empty" | "no-results";

export type EmptyStateAction = {
  label: string;
  href?: string;
  onClick?: () => void;
};

/**
 * Curated inline SVG icons (no external icon dependency — see AB-0037 non-goals).
 * Pass a key to `<EmptyState icon="clients" />` or a custom node.
 */
function baseIconProps(props: SVGProps<SVGSVGElement>): SVGProps<SVGSVGElement> {
  return {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    ...props,
  };
}

export const emptyStateIcons = {
  inbox: (props: SVGProps<SVGSVGElement>) => (
    <svg {...baseIconProps(props)}>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  ),
  search: (props: SVGProps<SVGSVGElement>) => (
    <svg {...baseIconProps(props)}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  clients: (props: SVGProps<SVGSVGElement>) => (
    <svg {...baseIconProps(props)}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  locations: (props: SVGProps<SVGSVGElement>) => (
    <svg {...baseIconProps(props)}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  shifts: (props: SVGProps<SVGSVGElement>) => (
    <svg {...baseIconProps(props)}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  clock: (props: SVGProps<SVGSVGElement>) => (
    <svg {...baseIconProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  document: (props: SVGProps<SVGSVGElement>) => (
    <svg {...baseIconProps(props)}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h6" />
    </svg>
  ),
  invoice: (props: SVGProps<SVGSVGElement>) => (
    <svg {...baseIconProps(props)}>
      <path d="M5 3h14a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2-3-2V4a1 1 0 0 1 1-1z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  ),
  briefcase: (props: SVGProps<SVGSVGElement>) => (
    <svg {...baseIconProps(props)}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  handshake: (props: SVGProps<SVGSVGElement>) => (
    <svg {...baseIconProps(props)}>
      <path d="m11 17 2 2a1 1 0 1 0 3-3" />
      <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
      <path d="m21 3 1 11h-2M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3M3 4h8" />
    </svg>
  ),
} as const;

export type EmptyStateIconName = keyof typeof emptyStateIcons;

function resolveIcon(icon: ReactNode | EmptyStateIconName | undefined, variant: EmptyStateVariant): ReactNode {
  if (icon && typeof icon !== "string") return icon;
  const name = (typeof icon === "string" ? icon : null) ?? (variant === "no-results" ? "search" : "inbox");
  const Icon = emptyStateIcons[name as EmptyStateIconName] ?? emptyStateIcons.inbox;
  return <Icon />;
}

function ActionButton({ action, primary }: { action: EmptyStateAction; primary: boolean }) {
  const className = primary
    ? "inline-flex items-center gap-1 rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#b51266]"
    : "inline-flex items-center gap-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50";

  if (action.href) {
    return (
      <Link href={action.href} className={className}>
        {action.label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={action.onClick} className={className}>
      {action.label}
    </button>
  );
}

/**
 * AB-0037 — friendly empty state for list/table/dashboard views.
 *
 * - `variant="empty"` (default): the module has no data yet — bold CTA to create the first item.
 * - `variant="no-results"`: a search/filter returned nothing — softer CTA (e.g. "Clear filters").
 *
 * Only render after a data fetch resolves to zero rows — use a skeleton (AB-0036) while loading.
 */
export function EmptyState({
  variant = "empty",
  icon,
  heading,
  message,
  action,
  secondaryAction,
  className = "",
}: {
  variant?: EmptyStateVariant;
  icon?: ReactNode | EmptyStateIconName;
  heading: string;
  message?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={`mx-auto flex max-w-sm flex-col items-center px-6 py-12 text-center ${className}`.trim()}
    >
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        {resolveIcon(icon, variant)}
      </span>
      <h3 className="text-sm font-semibold text-slate-900">{heading}</h3>
      {message ? <p className="mt-1.5 text-sm text-slate-500">{message}</p> : null}
      {action || secondaryAction ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {action ? <ActionButton action={action} primary={variant === "empty"} /> : null}
          {secondaryAction ? <ActionButton action={secondaryAction} primary={false} /> : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Table-friendly wrapper: renders `<EmptyState>` inside a full-width `<tr><td>` so it can
 * drop into an existing `<tbody>` without breaking table structure.
 */
export function EmptyStateRow({
  colSpan,
  ...props
}: {
  colSpan: number;
} & Parameters<typeof EmptyState>[0]) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-6">
        <EmptyState {...props} />
      </td>
    </tr>
  );
}
