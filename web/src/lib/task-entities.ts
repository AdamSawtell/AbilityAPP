"use client";

import { useMemo } from "react";
import { useData } from "@/lib/data-store";
import { TASK_ENTITY_TYPES, taskEntityTypeLabels, type TaskEntityType } from "@/lib/task";

export type TaskEntityOption = {
  entityType: TaskEntityType;
  entityId: string;
  label: string;
};

/** Pre-indexed row for fast client-side search (searchText is lowercase). */
export type TaskEntitySearchEntry = TaskEntityOption & {
  searchText: string;
};

export type TaskEntityIndex = Record<TaskEntityType, TaskEntitySearchEntry[]>;

const MIN_SEARCH_LENGTH = 2;
const DEFAULT_RESULT_LIMIT = 20;

function entry(
  entityType: TaskEntityType,
  entityId: string,
  label: string,
  ...extraSearchParts: string[]
): TaskEntitySearchEntry {
  const searchText = [label, entityType, taskEntityTypeLabels[entityType], ...extraSearchParts]
    .join(" ")
    .toLowerCase();
  return { entityType, entityId, label, searchText };
}

/** Build per-type pools once when source data changes — no global sort. */
export function buildTaskEntityIndex(data: {
  enquiries: { id: string; documentNo: string; firstName: string; lastName: string }[];
  clients: { id: string; searchKey: string; name: string }[];
  employees: { id: string; searchKey: string; name: string; email?: string }[];
  incidents?: { id: string; documentNo: string; title: string }[];
  serviceAgreements: { id: string; searchKey: string; name: string }[];
  serviceBookings?: { id: string; documentNo: string; description: string }[];
  contracts: { id: string; documentNo: string; name: string }[];
  products: { id: string; searchKey: string; name: string }[];
  priceLists: { id: string; name: string }[];
}): TaskEntityIndex {
  const index = {} as TaskEntityIndex;

  index.enquiry = data.enquiries.map((e) =>
    entry("enquiry", e.id, `${e.documentNo} — ${e.firstName} ${e.lastName}`.trim(), e.documentNo, e.firstName, e.lastName)
  );
  index.client = data.clients.map((c) => entry("client", c.id, `${c.searchKey} — ${c.name}`, c.searchKey, c.name));
  index.employee = data.employees.map((e) =>
    entry("employee", e.id, `${e.searchKey} — ${e.name}`, e.searchKey, e.name, e.email ?? "")
  );
  index.incident = (data.incidents ?? []).map((i) =>
    entry("incident", i.id, `${i.documentNo} — ${i.title}`.trim(), i.documentNo, i.title)
  );
  index["service-agreement"] = data.serviceAgreements.map((sa) =>
    entry("service-agreement", sa.id, `${sa.searchKey} — ${sa.name}`, sa.searchKey, sa.name)
  );
  index["service-booking"] = (data.serviceBookings ?? []).map((sb) =>
    entry("service-booking", sb.id, `${sb.documentNo} — ${sb.description || "Service booking"}`.trim(), sb.documentNo, sb.description ?? "")
  );
  index.contract = data.contracts.map((c) =>
    entry("contract", c.id, `${c.documentNo} — ${c.name}`, c.documentNo, c.name)
  );
  index.product = data.products.map((p) =>
    entry("product", p.id, `${p.searchKey} — ${p.name}`, p.searchKey, p.name)
  );
  index["price-list"] = data.priceLists.map((pl) => entry("price-list", pl.id, pl.name, pl.name));

  return index;
}

function rankMatch(entry: TaskEntitySearchEntry, query: string): number {
  const label = entry.label.toLowerCase();
  if (label.startsWith(query)) return 30;
  const parts = entry.searchText.split(" ");
  if (parts.some((p) => p.startsWith(query))) return 20;
  if (entry.searchText.includes(query)) return 10;
  return 0;
}

/**
 * Search indexed records on demand. Scans only the selected type pool(s),
 * ranks matches, and returns a capped list — avoids building or rendering huge lists.
 */
export function searchTaskEntities(
  index: TaskEntityIndex,
  query: string,
  entityType: TaskEntityType | "" = "",
  limit = DEFAULT_RESULT_LIMIT
): TaskEntitySearchEntry[] {
  const q = query.trim().toLowerCase();
  if (q.length < MIN_SEARCH_LENGTH) return [];

  const types = entityType ? [entityType] : TASK_ENTITY_TYPES;
  const ranked: { entry: TaskEntitySearchEntry; score: number }[] = [];

  for (const type of types) {
    for (const row of index[type]) {
      if (!row.searchText.includes(q)) continue;
      ranked.push({ entry: row, score: rankMatch(row, q) });
    }
  }

  ranked.sort((a, b) => b.score - a.score || a.entry.label.localeCompare(b.entry.label, "en-AU"));
  return ranked.slice(0, limit).map((r) => r.entry);
}

export function useTaskEntityIndex(): TaskEntityIndex {
  const { enquiries, clients, employees, incidents, serviceAgreements, serviceBookings, contracts, products, priceLists } = useData();

  return useMemo(
    () =>
      buildTaskEntityIndex({
        enquiries,
        clients,
        employees,
        incidents,
        serviceAgreements,
        serviceBookings,
        contracts,
        products,
        priceLists,
      }),
    [enquiries, clients, employees, incidents, serviceAgreements, serviceBookings, contracts, products, priceLists]
  );
}

export function entityOptionKey(entityType: TaskEntityType | "", entityId: string) {
  return entityType && entityId ? `${entityType}:${entityId}` : "";
}

export function parseEntityOptionKey(key: string): { entityType: TaskEntityType | ""; entityId: string } {
  if (!key) return { entityType: "", entityId: "" };
  const [entityType, ...rest] = key.split(":");
  if (!TASK_ENTITY_TYPES.includes(entityType as TaskEntityType)) {
    return { entityType: "", entityId: "" };
  }
  return { entityType: entityType as TaskEntityType, entityId: rest.join(":") };
}

export function entityTypeLabel(entityType: TaskEntityType | "") {
  return entityType ? taskEntityTypeLabels[entityType] : "No record";
}

export const taskEntitySearchMinLength = MIN_SEARCH_LENGTH;
