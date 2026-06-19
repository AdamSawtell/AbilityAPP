import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import { canAccessWindow } from "@/lib/access/catalog";

type EntityConfig = {
  label: string;
  table: string;
  windowKey: string;
  nameColumns: string[];
  href: (row: Record<string, string>) => string;
};

const ENTITIES: EntityConfig[] = [
  {
    label: "Client",
    table: "client",
    windowKey: "clients",
    nameColumns: ["name", "search_key"],
    href: (row) => `/clients/${row.id}`,
  },
  {
    label: "Enquiry",
    table: "enquiry",
    windowKey: "enquiries",
    nameColumns: ["first_name", "last_name", "document_no"],
    href: (row) => `/enquiries/${row.id}`,
  },
  {
    label: "Employee",
    table: "employee",
    windowKey: "employees",
    nameColumns: ["first_name", "last_name", "employee_no"],
    href: (row) => `/employees/${row.id}`,
  },
  {
    label: "Location",
    table: "support_location",
    windowKey: "locations",
    nameColumns: ["name", "search_key"],
    href: (row) => `/locations/${row.search_key ?? row.id}`,
  },
];

function parseSinceHours(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 24;
  return Math.min(n, 24 * 30);
}

function displayName(row: Record<string, string>, cols: string[]): string {
  const parts = cols.map((c) => row[c]).filter(Boolean);
  return parts.join(" ").trim() || row.id;
}

export async function runRecordsUpdatedSince(
  supabase: SupabaseClient,
  session: AuthSession,
  args: { hours?: number; limit?: number }
) {
  const hours = parseSinceHours(args.hours ?? 24);
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const limit = Math.min(Math.max(args.limit ?? 25, 1), 50);
  const results: {
    entityType: string;
    id: string;
    label: string;
    updatedAt: string;
    href: string;
  }[] = [];

  for (const cfg of ENTITIES) {
    if (!canAccessWindow(session.windowKeys, cfg.windowKey)) continue;
    if (results.length >= limit) break;

    const { data, error } = await supabase
      .from(cfg.table)
      .select("*")
      .gte("updated_at", since)
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) continue;

    for (const row of data ?? []) {
      if (results.length >= limit) break;
      const r = row as unknown as Record<string, string>;
      results.push({
        entityType: cfg.label,
        id: r.id,
        label: displayName(r, cfg.nameColumns),
        updatedAt: r.updated_at,
        href: cfg.href(r),
      });
    }
  }

  results.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return {
    hours,
    since,
    count: results.length,
    results: results.slice(0, limit),
  };
}
