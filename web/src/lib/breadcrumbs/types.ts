export type BreadcrumbItem = {
  label: string;
  href?: string;
};

/** Minimal search-params surface for server-safe breadcrumb building. */
export type ReadonlyURLSearchParamsLike = {
  get(name: string): string | null;
};

export type BreadcrumbBuildContext = {
  routeLabels: ReadonlyMap<string, string>;
  resolveEntityLabel?: (listSegment: string, entityId: string) => string | undefined;
};

export type BreadcrumbBuildOptions = {
  pathname: string;
  searchParams?: URLSearchParams | ReadonlyURLSearchParamsLike;
};
