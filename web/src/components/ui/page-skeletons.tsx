import type { ReactNode } from "react";
import { Skeleton, SkeletonCard, SkeletonTable, SkeletonText } from "@/components/ui/skeleton";

function ShellFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      <p role="status" className="sr-only">
        Loading page content…
      </p>
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white sm:block">
          <div className="space-y-4 p-4">
            <Skeleton className="h-8 w-40" />
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-4 w-full" />
            ))}
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-6 sm:p-8">{children}</main>
      </div>
    </div>
  );
}

function PageHeaderSkeleton({ subtitle = true }: { subtitle?: boolean }) {
  return (
    <div className="mb-6">
      <Skeleton className="mb-2 h-8 w-48" />
      {subtitle ? <Skeleton className="h-4 w-72 max-w-full" /> : null}
    </div>
  );
}

export function GenericPageSkeleton() {
  return (
    <ShellFrame>
      <PageHeaderSkeleton />
      <SkeletonCard className="mb-4" />
      <SkeletonText lines={4} />
    </ShellFrame>
  );
}

export function PortalPageSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6f8] p-6">
      <p role="status" className="sr-only">
        Loading page content…
      </p>
      <div className="w-full max-w-3xl space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-72 max-w-full" />
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <ShellFrame>
      <PageHeaderSkeleton />
      <Skeleton className="mb-6 h-28 w-full rounded-2xl" />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    </ShellFrame>
  );
}

export function RecordListPageSkeleton({ titleWidth = "w-32" }: { titleWidth?: string }) {
  return (
    <ShellFrame>
      <div className="mb-6">
        <Skeleton className={`mb-2 h-8 ${titleWidth}`} />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="mb-3 flex flex-wrap gap-3">
        <Skeleton className="h-9 w-72 max-w-full rounded-lg" />
        <Skeleton className="h-9 w-36 rounded-lg" />
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
      <SkeletonTable rows={8} columns={5} />
    </ShellFrame>
  );
}

export function MyWorkplaceHubContentSkeleton({ showSubnavPills = true }: { showSubnavPills?: boolean }) {
  return (
    <>
      <p role="status" className="sr-only">
        Loading My workplace overview…
      </p>
      {showSubnavPills ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      ) : null}
      <Skeleton className="mb-6 h-40 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    </>
  );
}

export function MyWorkplacePageSkeleton() {
  return (
    <ShellFrame>
      <PageHeaderSkeleton />
      <MyWorkplaceHubContentSkeleton />
    </ShellFrame>
  );
}

export function RosteringPageSkeleton() {
  return (
    <ShellFrame>
      <PageHeaderSkeleton />
      <div className="mb-4 flex flex-wrap gap-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-9 w-24 rounded-lg" />
        ))}
      </div>
      <div className="mb-4 flex gap-2">
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }, (_, index) => (
          <Skeleton key={index} className="h-64 rounded-xl" />
        ))}
      </div>
    </ShellFrame>
  );
}

export function MyShiftsPageSkeleton() {
  return (
    <ShellFrame>
      <PageHeaderSkeleton />
      <div className="mb-6 flex gap-2">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-9 w-28 rounded-lg" />
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
    </ShellFrame>
  );
}

export function MyAvailabilityPageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <Skeleton className="mb-2 h-5 w-40" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="grid gap-3 px-5 py-4 sm:grid-cols-5 sm:items-end">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-9 w-full rounded-lg" />
              <Skeleton className="h-9 w-full rounded-lg" />
              <Skeleton className="h-9 w-full rounded-lg" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          ))}
        </div>
        <div className="border-t border-slate-100 px-5 py-4">
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function MyAvailabilityRowsSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="grid gap-3 px-5 py-4 sm:grid-cols-5 sm:items-end">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      ))}
    </>
  );
}

export function MyProfilePageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index}>
            <Skeleton className="mb-2 h-3.5 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-32 rounded-lg" />
    </div>
  );
}

export function ClientDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
      <SkeletonText lines={6} />
    </div>
  );
}

export function RecordDetailPageSkeleton() {
  return (
    <ShellFrame>
      <PageHeaderSkeleton />
      <ClientDetailSkeleton />
    </ShellFrame>
  );
}

export function MyAvailabilityFullPageSkeleton() {
  return (
    <ShellFrame>
      <PageHeaderSkeleton />
      <MyAvailabilityPageSkeleton />
    </ShellFrame>
  );
}

export function MyProfileFullPageSkeleton() {
  return (
    <ShellFrame>
      <PageHeaderSkeleton />
      <MyProfilePageSkeleton />
    </ShellFrame>
  );
}

/** Pick a layout-matching skeleton from the current pathname. */
export function routePageSkeleton(pathname: string) {
  if (pathname === "/login") {
    return <GenericPageSkeleton />;
  }
  if (pathname.startsWith("/portal") || pathname.startsWith("/agency-portal")) return <PortalPageSkeleton />;
  if (pathname === "/" || pathname === "") return <DashboardPageSkeleton />;
  if (pathname === "/my" || pathname === "/my/") return <MyWorkplacePageSkeleton />;
  if (pathname.startsWith("/my/shifts")) return <MyShiftsPageSkeleton />;
  if (pathname.startsWith("/my/availability")) return <MyAvailabilityFullPageSkeleton />;
  if (pathname.startsWith("/my/profile")) return <MyProfileFullPageSkeleton />;
  if (pathname.startsWith("/my/")) return <MyWorkplacePageSkeleton />;
  if (pathname === "/clients") return <RecordListPageSkeleton titleWidth="w-28" />;
  if (pathname.startsWith("/clients/")) return <RecordDetailPageSkeleton />;
  if (pathname === "/locations") return <RecordListPageSkeleton titleWidth="w-36" />;
  if (pathname.startsWith("/locations/")) return <RecordDetailPageSkeleton />;
  if (pathname.startsWith("/rostering")) return <RosteringPageSkeleton />;
  return <GenericPageSkeleton />;
}
