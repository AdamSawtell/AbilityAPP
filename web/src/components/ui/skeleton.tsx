import type { CSSProperties, HTMLAttributes } from "react";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  width?: number | string;
  height?: number | string;
};

function sizeStyle(width?: number | string, height?: number | string): CSSProperties | undefined {
  if (width === undefined && height === undefined) return undefined;
  return {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
  };
}

/** Grey pulsing placeholder block — shadcn-style base primitive. */
export function Skeleton({ className = "", width, height, style, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-md bg-muted ${className}`.trim()}
      style={{ ...sizeStyle(width, height), ...style }}
      {...props}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  const widths = ["w-full", "w-11/12", "w-4/5", "w-3/5", "w-2/3"];
  return (
    <div className={`space-y-2.5 ${className}`.trim()}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={`h-3.5 ${widths[index % widths.length]}`} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`.trim()}>
      <Skeleton className="mb-3 h-4 w-1/3" />
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonTable({
  rows = 6,
  columns = 5,
  className = "",
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`.trim()}>
      <div className="flex gap-3 border-b border-slate-100 px-4 py-3">
        {Array.from({ length: columns }, (_, index) => (
          <Skeleton key={`head-${index}`} className="h-3.5 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-3 px-4 py-3.5">
            {Array.from({ length: columns }, (_, colIndex) => (
              <Skeleton
                key={`${rowIndex}-${colIndex}`}
                className={`h-3.5 flex-1 ${colIndex === 0 ? "max-w-[8rem]" : ""}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
