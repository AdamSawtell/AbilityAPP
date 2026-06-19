import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import { canAccessWindow } from "@/lib/access/catalog";

type ActivityHit = {
  source: string;
  id: string;
  parentId: string;
  parentLabel: string;
  date: string;
  activityType: string;
  subject: string;
  description: string;
  updatedAt: string;
  href: string;
};

type ActivityTableConfig = {
  source: string;
  table: string;
  parentColumn: string;
  parentTable: string;
  parentLabelColumn: string;
  parentSearchKeyColumn?: string;
  windowKey: string;
  href: (parentId: string, parentSearchKey?: string) => string;
};

const ACTIVITY_TABLES: ActivityTableConfig[] = [
  {
    source: "client_activity",
    table: "client_activity",
    parentColumn: "client_id",
    parentTable: "client",
    parentLabelColumn: "name",
    parentSearchKeyColumn: "search_key",
    windowKey: "client-activity",
    href: (id) => `/clients/${id}?tab=Activity`,
  },
  {
    source: "client_contact_activity",
    table: "client_contact_activity",
    parentColumn: "client_id",
    parentTable: "client",
    parentLabelColumn: "name",
    parentSearchKeyColumn: "search_key",
    windowKey: "client-contact-activity",
    href: (id) => `/clients/${id}?tab=Contact+activity`,
  },
  {
    source: "enquiry_activity",
    table: "enquiry_activity",
    parentColumn: "enquiry_id",
    parentTable: "enquiry",
    parentLabelColumn: "document_no",
    windowKey: "enquiry-activity",
    href: (id) => `/enquiries/${id}?tab=Activity`,
  },
  {
    source: "employee_activity",
    table: "employee_activity",
    parentColumn: "employee_id",
    parentTable: "employee",
    parentLabelColumn: "first_name",
    windowKey: "employee-activity",
    href: (id) => `/employees/${id}?tab=Activity`,
  },
  {
    source: "location_activity",
    table: "support_location_activity",
    parentColumn: "location_id",
    parentTable: "support_location",
    parentLabelColumn: "name",
    parentSearchKeyColumn: "search_key",
    windowKey: "location-activity",
    href: (id, key) => `/locations/${key ?? id}?tab=Activity`,
  },
];

function parseSinceHours(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function sinceIso(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function matchesQuery(haystack: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return haystack.toLowerCase().includes(q);
}

function canSearchActivity(session: AuthSession, cfg: ActivityTableConfig): boolean {
  if (canAccessWindow(session.windowKeys, cfg.windowKey)) return true;
  if (
    (cfg.source === "client_activity" || cfg.source === "client_contact_activity") &&
    canAccessWindow(session.windowKeys, "clients")
  ) {
    return true;
  }
  return false;
}

export async function runActivitySearch(
  supabase: SupabaseClient,
  session: AuthSession,
  args: { query?: string; updatedWithinHours?: number; limit?: number }
) {
  const query = args.query?.trim() ?? "";
  const hours = parseSinceHours(args.updatedWithinHours);
  const since = hours ? sinceIso(hours) : null;
  const limit = Math.min(Math.max(args.limit ?? 20, 1), 50);
  const hits: ActivityHit[] = [];

  for (const cfg of ACTIVITY_TABLES) {
    if (!canSearchActivity(session, cfg)) continue;
    if (hits.length >= limit) break;

    let q = supabase.from(cfg.table).select("*").order("updated_at", { ascending: false });
    if (since) q = q.gte("updated_at", since);

    const { data, error } = await q.limit(100);
    if (error) continue;

    const parentIds = [...new Set((data ?? []).map((r) => r[cfg.parentColumn] as string))];
    const parentSelect = cfg.parentSearchKeyColumn
      ? `id, ${cfg.parentLabelColumn}, ${cfg.parentSearchKeyColumn}`
      : `id, ${cfg.parentLabelColumn}`;
    const { data: parents } = await supabase.from(cfg.parentTable).select(parentSelect).in("id", parentIds);
    const parentMap = new Map(
      (parents ?? []).map((p) => {
        const row = p as unknown as Record<string, string>;
        return [
          row.id,
          {
            label: row[cfg.parentLabelColumn] ?? row.id,
            searchKey: cfg.parentSearchKeyColumn ? row[cfg.parentSearchKeyColumn] : undefined,
          },
        ];
      })
    );

    for (const row of data ?? []) {
      if (hits.length >= limit) break;
      const r = row as unknown as Record<string, string>;
      const parent = parentMap.get(r[cfg.parentColumn]) ?? { label: r[cfg.parentColumn], searchKey: undefined };
      const subject = r.subject ?? "";
      const description = r.description ?? "";
      const activityType = r.activity_type ?? "";
      const contactName = r.contact_name ?? "";
      const blob = [subject, description, activityType, contactName, parent.label].join(" ");
      if (query && !matchesQuery(blob, query)) continue;

      hits.push({
        source: cfg.source,
        id: r.id,
        parentId: r[cfg.parentColumn],
        parentLabel: parent.label,
        date: r.activity_date ?? "",
        activityType,
        subject,
        description: description.slice(0, 300),
        updatedAt: r.updated_at ?? "",
        href: cfg.href(r[cfg.parentColumn], parent.searchKey),
      });
    }
  }

  return {
    query,
    updatedWithinHours: hours,
    count: hits.length,
    results: hits,
  };
}
