"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  entityTypeLabel,
  searchTaskEntities,
  taskEntitySearchMinLength,
  type TaskEntityIndex,
  type TaskEntityOption,
} from "@/lib/task-entities";
import { entityHref, TASK_ENTITY_TYPES, type TaskEntityType } from "@/lib/task";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

type TaskEntitySearchPickerProps = {
  index: TaskEntityIndex;
  value: TaskEntityOption | null;
  onChange: (value: TaskEntityOption | null) => void;
  entityTypeFilter?: TaskEntityType | "";
  onEntityTypeFilterChange?: (type: TaskEntityType | "") => void;
  showTypeFilter?: boolean;
  label?: string;
};

export function TaskEntitySearchPicker({
  index,
  value,
  onChange,
  entityTypeFilter = "",
  onEntityTypeFilterChange,
  showTypeFilter = true,
  label = "Link to record (optional)",
}: TaskEntitySearchPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(
    () => searchTaskEntities(index, deferredQuery, entityTypeFilter),
    [index, deferredQuery, entityTypeFilter]
  );

  const showResults = open && deferredQuery.trim().length >= taskEntitySearchMinLength;
  const isStale = query !== deferredQuery;

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(option: TaskEntityOption) {
    onChange(option);
    setOpen(false);
    setQuery("");
  }

  function clear() {
    onChange(null);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="sm:col-span-2 space-y-3">
      {showTypeFilter && onEntityTypeFilterChange ? (
        <label>
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Record type</span>
          <select
            className={inputClass}
            value={entityTypeFilter}
            onChange={(e) => {
              onEntityTypeFilterChange(e.target.value as TaskEntityType | "");
              setQuery("");
              onChange(null);
            }}
          >
            <option value="">All types</option>
            {TASK_ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {entityTypeLabel(t)}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div>
        <span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>
        {value ? (
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {entityTypeLabel(value.entityType)}
              </p>
              <Link
                href={entityHref(value.entityType, value.entityId)}
                className="mt-0.5 block truncate font-medium text-[#b51266] hover:underline"
              >
                {value.label}
              </Link>
            </div>
            <button
              type="button"
              onClick={clear}
              className="shrink-0 rounded px-2 py-1 text-xs text-slate-500 hover:bg-white hover:text-slate-800"
            >
              Clear
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Search by name, key, or document number…"
              className={inputClass}
              autoComplete="off"
            />
            {showResults ? (
              <ul
                className={`absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg ${
                  isStale ? "opacity-70" : ""
                }`}
              >
                {results.map((row) => (
                  <li key={`${row.entityType}:${row.entityId}`}>
                    <button
                      type="button"
                      onClick={() => pick(row)}
                      className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      <span className="font-medium text-slate-900">{row.label}</span>
                      <span className="text-xs text-slate-500">{entityTypeLabel(row.entityType)}</span>
                    </button>
                  </li>
                ))}
                {!isStale && results.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-slate-500">No records match “{deferredQuery.trim()}”.</li>
                ) : null}
              </ul>
            ) : open && query.trim().length > 0 && query.trim().length < taskEntitySearchMinLength ? (
              <p className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-lg">
                Type at least {taskEntitySearchMinLength} characters to search.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
