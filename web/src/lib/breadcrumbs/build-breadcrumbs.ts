import {
  buildRouteLabelMap,
  humanizeSegment,
  isEntityIdSegment,
  labelForPath,
  labelForStaticSegment,
  normalizeBreadcrumbPath,
  taskScopeLabel,
} from "@/lib/breadcrumbs/route-labels";
import { systemNavSectionLabel } from "@/lib/system/nav";
import type { BreadcrumbBuildContext, BreadcrumbBuildOptions, BreadcrumbItem } from "@/lib/breadcrumbs/types";

function segmentLabel(
  pathSoFar: string,
  segment: string,
  parentSegment: string | undefined,
  context: BreadcrumbBuildContext
): string {
  const mapped = labelForPath(pathSoFar, context.routeLabels);
  if (mapped) return mapped;

  if (parentSegment && isEntityIdSegment(parentSegment, segment)) {
    const resolved = context.resolveEntityLabel?.(parentSegment, segment);
    if (resolved) return resolved;
    return segment;
  }

  const staticLabel = labelForStaticSegment(segment);
  if (staticLabel) return staticLabel;

  if (parentSegment === "system" && segment === "reference-data") {
    return "Reference data";
  }

  if (parentSegment === "reference-data") {
    return systemNavSectionLabel(segment) || humanizeSegment(segment);
  }

  if (parentSegment === "guides" || parentSegment === "help") {
    return humanizeSegment(segment.replace(/-/g, " "));
  }

  if (parentSegment === "setup") {
    return humanizeSegment(segment);
  }

  return humanizeSegment(segment);
}

/**
 * Build breadcrumb items from the current pathname.
 * Always starts with Home; the last item has no href.
 */
export function buildBreadcrumbs(
  { pathname, searchParams }: BreadcrumbBuildOptions,
  context: BreadcrumbBuildContext
): BreadcrumbItem[] {
  const normalizedPath = normalizeBreadcrumbPath(pathname);
  if (normalizedPath === "/") {
    return [{ label: "Home" }];
  }

  const segments = normalizedPath.split("/").filter(Boolean);
  const items: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index]!;
    const parentSegment = index > 0 ? segments[index - 1] : undefined;
    const pathSoFar = `/${segments.slice(0, index + 1).join("/")}`;
    const label = segmentLabel(pathSoFar, segment, parentSegment, context);
    const isLastPathSegment = index === segments.length - 1;
    items.push(isLastPathSegment ? { label } : { label, href: pathSoFar });
  }

  const tab = searchParams?.get("tab");
  if (tab) {
    if (items.length > 0) {
      const last = items[items.length - 1]!;
      if (!last.href && items.length > 1) {
        const parentPath = normalizeBreadcrumbPath(pathname);
        items[items.length - 1] = { label: last.label, href: parentPath };
      }
    }
    items.push({ label: tab });
  }

  if (normalizeBreadcrumbPath(pathname) === "/tasks") {
    const scope = searchParams?.get("scope");
    const scopeLabel = taskScopeLabel(scope);
    if (scopeLabel) {
      if (items.length > 0) {
        const last = items[items.length - 1]!;
        if (!last.href) {
          items[items.length - 1] = { label: last.label, href: "/tasks" };
        }
      }
      items.push({ label: scopeLabel });
    }
  }

  if (normalizedPath.startsWith("/my/") && items.length >= 2) {
    const workplaceIndex = items.findIndex(
      (item) => item.label === "My workplace" || normalizeBreadcrumbPath(item.href ?? "") === "/my"
    );
    if (workplaceIndex === -1 && items[1]) {
      items.splice(1, 0, { label: "My workplace", href: "/my" });
    }
  }

  return items;
}

export function createDefaultBreadcrumbContext(
  resolveEntityLabel?: BreadcrumbBuildContext["resolveEntityLabel"]
): BreadcrumbBuildContext {
  return {
    routeLabels: buildRouteLabelMap(),
    resolveEntityLabel,
  };
}
