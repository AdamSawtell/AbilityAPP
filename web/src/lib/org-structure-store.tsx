"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  initialOrgPositions,
  initialOrgReportingLines,
  initialPositionAssignments,
  newOrgPositionId,
  newOrgReportingLineId,
  newPositionAssignmentId,
  normalizeOrgPosition,
  normalizePositionAssignment,
  normalizePositionReportingLine,
  type OrgPositionRecord,
  type OrgPositionReportingLineRecord,
  type PositionAssignmentRecord,
} from "@/lib/org-structure";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  deleteOrgPosition,
  deleteOrgReportingLine,
  deletePositionAssignment,
  fetchOrgStructure,
  saveOrgPosition,
  saveOrgReportingLine,
  savePositionAssignment,
} from "@/lib/supabase/org-structure-api";

type OrgStructureStore = {
  positions: OrgPositionRecord[];
  assignments: PositionAssignmentRecord[];
  reportingLines: OrgPositionReportingLineRecord[];
  hydrated: boolean;
  source: "supabase" | "local";
  upsertPosition: (record: OrgPositionRecord) => void;
  removePosition: (id: string) => void;
  reparentPosition: (positionId: string, newParentId: string) => void;
  assignPrimary: (positionId: string, employeeId: string, effectiveFrom?: string) => void;
  clearPrimary: (positionId: string) => void;
  assignActing: (positionId: string, employeeId: string, effectiveFrom?: string, effectiveTo?: string) => void;
  clearActing: (positionId: string) => void;
  addPosition: (partial: Omit<OrgPositionRecord, "id">) => OrgPositionRecord;
  addDottedReportingLine: (positionId: string, reportsToPositionId: string, label?: string) => void;
  removeDottedReportingLine: (id: string) => void;
};

const OrgStructureContext = createContext<OrgStructureStore | null>(null);

export function OrgStructureProvider({ children }: { children: React.ReactNode }) {
  const [positions, setPositions] = useState<OrgPositionRecord[]>(initialOrgPositions);
  const [assignments, setAssignments] = useState<PositionAssignmentRecord[]>(initialPositionAssignments);
  const [reportingLines, setReportingLines] =
    useState<OrgPositionReportingLineRecord[]>(initialOrgReportingLines);
  const [hydrated, setHydrated] = useState(false);
  const [source, setSource] = useState<"supabase" | "local">("local");

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const data = await fetchOrgStructure(supabase);
          if (!cancelled && data.positions.length) {
            setPositions(data.positions);
            setAssignments(data.assignments);
            setReportingLines(data.reportingLines);
            setSource("supabase");
            setHydrated(true);
            return;
          }
        } catch {
          // fall back
        }
      }

      if (!cancelled) {
        setPositions(initialOrgPositions);
        setAssignments(initialPositionAssignments);
        setReportingLines(initialOrgReportingLines);
        setSource("local");
        setHydrated(true);
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistPosition = useCallback(
    (record: OrgPositionRecord) => {
      if (source === "supabase" && isSupabaseConfigured()) {
        const supabase = createClient();
        void saveOrgPosition(supabase, record);
      }
    },
    [source]
  );

  const persistAssignment = useCallback(
    (record: PositionAssignmentRecord) => {
      if (source === "supabase" && isSupabaseConfigured()) {
        const supabase = createClient();
        void savePositionAssignment(supabase, record);
      }
    },
    [source]
  );

  const persistReportingLine = useCallback(
    (record: OrgPositionReportingLineRecord) => {
      if (source === "supabase" && isSupabaseConfigured()) {
        const supabase = createClient();
        void saveOrgReportingLine(supabase, record);
      }
    },
    [source]
  );

  const upsertPosition = useCallback(
    (record: OrgPositionRecord) => {
      const normalized = normalizeOrgPosition(record);
      setPositions((prev) => {
        const exists = prev.some((p) => p.id === normalized.id);
        return exists ? prev.map((p) => (p.id === normalized.id ? normalized : p)) : [...prev, normalized];
      });
      persistPosition(normalized);
    },
    [persistPosition]
  );

  const removePosition = useCallback(
    (id: string) => {
      if (id === "pos-org-root") return;
      setPositions((prev) => prev.filter((p) => p.id !== id));
      setAssignments((prev) => prev.filter((a) => a.positionId !== id));
      setReportingLines((prev) =>
        prev.filter((line) => line.positionId !== id && line.reportsToPositionId !== id)
      );
      if (source === "supabase" && isSupabaseConfigured()) {
        const supabase = createClient();
        void deleteOrgPosition(supabase, id);
      }
    },
    [source]
  );

  const reparentPosition = useCallback(
    (positionId: string, newParentId: string) => {
      setPositions((prev) => {
        const current = prev.find((p) => p.id === positionId);
        if (!current) return prev;
        const updated = normalizeOrgPosition({
          ...current,
          parentPositionId: newParentId,
        });
        persistPosition(updated);
        return prev.map((p) => (p.id === positionId ? updated : p));
      });
    },
    [persistPosition]
  );

  const assignPrimary = useCallback(
    (positionId: string, employeeId: string, effectiveFrom = new Date().toISOString().slice(0, 10)) => {
      const existing = assignments.find(
        (a) => a.positionId === positionId && a.assignmentType === "primary" && !a.effectiveTo
      );

      let nextAssignment: PositionAssignmentRecord;
      if (existing) {
        nextAssignment = normalizePositionAssignment({
          ...existing,
          employeeId,
          effectiveFrom,
        });
      } else {
        nextAssignment = normalizePositionAssignment({
          id: newPositionAssignmentId(),
          positionId,
          employeeId,
          assignmentType: "primary",
          effectiveFrom,
          effectiveTo: "",
          notes: "",
        });
      }

      setAssignments((prev) => {
        const filtered = prev.filter((a) => a.id !== existing?.id);
        return [...filtered, nextAssignment];
      });
      persistAssignment(nextAssignment);

      setPositions((prev) => {
        const current = prev.find((p) => p.id === positionId);
        if (!current) return prev;
        const updated = normalizeOrgPosition({
          ...current,
          primaryEmployeeId: employeeId,
          status: employeeId ? "filled" : current.status,
        });
        persistPosition(updated);
        return prev.map((p) => (p.id === positionId ? updated : p));
      });
    },
    [assignments, persistAssignment, persistPosition]
  );

  const clearPrimary = useCallback(
    (positionId: string) => {
      const existing = assignments.filter(
        (a) => a.positionId === positionId && a.assignmentType === "primary"
      );
      setAssignments((prev) => prev.filter((a) => !existing.some((e) => e.id === a.id)));
      if (source === "supabase" && isSupabaseConfigured()) {
        const supabase = createClient();
        for (const a of existing) {
          void deletePositionAssignment(supabase, a.id);
        }
      }

      setPositions((prev) => {
        const current = prev.find((p) => p.id === positionId);
        if (!current) return prev;
        const updated = normalizeOrgPosition({
          ...current,
          primaryEmployeeId: "",
          status: current.status === "filled" ? "vacant" : current.status,
        });
        persistPosition(updated);
        return prev.map((p) => (p.id === positionId ? updated : p));
      });
    },
    [assignments, persistPosition, source]
  );

  const assignActing = useCallback(
    (positionId: string, employeeId: string, effectiveFrom = new Date().toISOString().slice(0, 10), effectiveTo = "") => {
      const existing = assignments.filter(
        (a) => a.positionId === positionId && a.assignmentType === "acting" && !a.effectiveTo
      );
      const nextAssignment = normalizePositionAssignment({
        id: existing[0]?.id ?? newPositionAssignmentId(),
        positionId,
        employeeId,
        assignmentType: "acting",
        effectiveFrom,
        effectiveTo,
        notes: "",
      });
      setAssignments((prev) => {
        const filtered = prev.filter((a) => !existing.some((e) => e.id === a.id));
        return [...filtered, nextAssignment];
      });
      persistAssignment(nextAssignment);
    },
    [assignments, persistAssignment]
  );

  const clearActing = useCallback(
    (positionId: string) => {
      const existing = assignments.filter(
        (a) => a.positionId === positionId && a.assignmentType === "acting" && !a.effectiveTo
      );
      if (!existing.length) return;
      const today = new Date().toISOString().slice(0, 10);
      const ended = existing.map((a) =>
        normalizePositionAssignment({ ...a, effectiveTo: today })
      );
      setAssignments((prev) => {
        const ids = new Set(existing.map((e) => e.id));
        return [...prev.filter((a) => !ids.has(a.id)), ...ended];
      });
      for (const row of ended) persistAssignment(row);
    },
    [assignments, persistAssignment]
  );

  const addPosition = useCallback(
    (partial: Omit<OrgPositionRecord, "id">) => {
      const created = normalizeOrgPosition({
        ...partial,
        id: newOrgPositionId(),
      });
      upsertPosition(created);
      return created;
    },
    [upsertPosition]
  );

  const addDottedReportingLine = useCallback(
    (positionId: string, reportsToPositionId: string, label = "") => {
      if (!positionId || !reportsToPositionId || positionId === reportsToPositionId) return;
      const created = normalizePositionReportingLine({
        id: newOrgReportingLineId(),
        positionId,
        reportsToPositionId,
        lineType: "dotted",
        label,
        sortOrder: 0,
      });
      setReportingLines((prev) => {
        if (
          prev.some(
            (line) =>
              line.positionId === created.positionId &&
              line.reportsToPositionId === created.reportsToPositionId &&
              line.lineType === "dotted"
          )
        ) {
          return prev;
        }
        return [...prev, created];
      });
      persistReportingLine(created);
    },
    [persistReportingLine]
  );

  const removeDottedReportingLine = useCallback(
    (id: string) => {
      setReportingLines((prev) => prev.filter((line) => line.id !== id));
      if (source === "supabase" && isSupabaseConfigured()) {
        const supabase = createClient();
        void deleteOrgReportingLine(supabase, id);
      }
    },
    [source]
  );

  const value = useMemo(
    () => ({
      positions,
      assignments,
      reportingLines,
      hydrated,
      source,
      upsertPosition,
      removePosition,
      reparentPosition,
      assignPrimary,
      clearPrimary,
      assignActing,
      clearActing,
      addPosition,
      addDottedReportingLine,
      removeDottedReportingLine,
    }),
    [
      positions,
      assignments,
      reportingLines,
      hydrated,
      source,
      upsertPosition,
      removePosition,
      reparentPosition,
      assignPrimary,
      clearPrimary,
      assignActing,
      clearActing,
      addPosition,
      addDottedReportingLine,
      removeDottedReportingLine,
    ]
  );

  return <OrgStructureContext.Provider value={value}>{children}</OrgStructureContext.Provider>;
}

export function useOrgStructure() {
  const ctx = useContext(OrgStructureContext);
  if (!ctx) throw new Error("useOrgStructure must be used within OrgStructureProvider");
  return ctx;
}
