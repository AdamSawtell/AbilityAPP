"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EmployeeRecordLink } from "@/components/record-link";
import type { EmployeeRecord } from "@/lib/employee";

type Props = {
  employees: EmployeeRecord[];
  value: string;
  onChange: (employeeId: string) => void;
  linkedUserId?: string;
  userIdByEmployeeId?: Map<string, string>;
  label?: string;
  allowClear?: boolean;
};

export function EmployeePicker({
  employees,
  value,
  onChange,
  linkedUserId,
  userIdByEmployeeId,
  label = "Linked employee",
  allowClear = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = employees.find((e) => e.id === value);

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = [...employees].sort((a, b) => a.name.localeCompare(b.name, "en-AU"));
    if (q) {
      rows = rows.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.searchKey.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.jobTitle.toLowerCase().includes(q)
      );
    }
    return rows.slice(0, 12);
  }, [employees, query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(id: string) {
    onChange(id);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {selected ? (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="min-w-0 flex-1">
            <EmployeeRecordLink
              id={selected.id}
              searchKey={selected.searchKey}
              name={selected.name}
              className="font-medium text-[#b51266] hover:underline"
            />
            <p className="truncate text-xs text-slate-500">
              {selected.jobTitle}
              {selected.department ? ` · ${selected.department}` : ""}
            </p>
          </div>
          {allowClear ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="shrink-0 rounded px-2 py-1 text-xs text-slate-500 hover:bg-white hover:text-slate-800"
            >
              Clear
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search by name, key, or email…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#d4147a]"
          />
          {open && options.length > 0 ? (
            <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              {options.map((e) => {
                const takenBy = userIdByEmployeeId?.get(e.id);
                const taken = Boolean(takenBy && takenBy !== linkedUserId);
                return (
                  <li key={e.id}>
                    <button
                      type="button"
                      disabled={taken}
                      onClick={() => pick(e.id)}
                      className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="font-medium text-slate-900">
                        {e.name}{" "}
                        <span className="font-normal text-slate-400">({e.searchKey})</span>
                      </span>
                      <span className="text-xs text-slate-500">
                        {e.jobTitle || "No title"}
                        {taken ? " · already linked to another user" : ""}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
          {open && query && options.length === 0 ? (
            <p className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-lg">
              No employees match “{query}”.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
