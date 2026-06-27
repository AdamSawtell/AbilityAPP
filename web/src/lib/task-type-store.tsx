"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  INITIAL_TASK_TYPES,
  normalizeTaskType,
  sortTaskTypes,
  type TaskTypeRecord,
} from "@/lib/task-type";

type TaskTypeStore = {
  taskTypes: TaskTypeRecord[];
  hydrated: boolean;
  getTaskTypeById: (id: string) => TaskTypeRecord | undefined;
  getTaskTypeName: (id: string) => string;
  upsertTaskType: (type: TaskTypeRecord) => void;
  resetTaskTypes: () => void;
};

const TaskTypeContext = createContext<TaskTypeStore | null>(null);
const STORAGE_KEY = "abilityerp-task-types";

function loadStoredTypes(): TaskTypeRecord[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw?.trim()) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.map((row) => normalizeTaskType(row as TaskTypeRecord));
  } catch {
    return null;
  }
}

function mergeWithInitialTypes(types: TaskTypeRecord[]): TaskTypeRecord[] {
  const byId = new Map(INITIAL_TASK_TYPES.map((type) => [type.id, normalizeTaskType(type)]));
  for (const type of types) {
    const normalized = normalizeTaskType(type);
    byId.set(normalized.id, normalized);
  }
  return sortTaskTypes([...byId.values()]);
}

export function TaskTypeProvider({ children }: { children: React.ReactNode }) {
  const [taskTypes, setTaskTypes] = useState<TaskTypeRecord[]>(INITIAL_TASK_TYPES);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      const stored = loadStoredTypes();
      setTaskTypes(mergeWithInitialTypes(stored ?? []));
      setHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(taskTypes));
    } catch {
      // ignore
    }
  }, [taskTypes, hydrated]);

  const getTaskTypeById = useCallback(
    (id: string) => taskTypes.find((t) => t.id === id),
    [taskTypes]
  );

  const getTaskTypeName = useCallback(
    (id: string) => getTaskTypeById(id)?.name ?? id,
    [getTaskTypeById]
  );

  const upsertTaskType = useCallback((type: TaskTypeRecord) => {
    const next = normalizeTaskType(type);
    setTaskTypes((prev) => {
      const exists = prev.some((t) => t.id === next.id);
      const merged = exists ? prev.map((t) => (t.id === next.id ? next : t)) : [...prev, next];
      return sortTaskTypes(merged);
    });
  }, []);

  const resetTaskTypes = useCallback(() => {
    setTaskTypes([...INITIAL_TASK_TYPES]);
  }, []);

  const value = useMemo(
    () => ({
      taskTypes,
      hydrated,
      getTaskTypeById,
      getTaskTypeName,
      upsertTaskType,
      resetTaskTypes,
    }),
    [taskTypes, hydrated, getTaskTypeById, getTaskTypeName, upsertTaskType, resetTaskTypes]
  );

  return <TaskTypeContext.Provider value={value}>{children}</TaskTypeContext.Provider>;
}

export function useTaskTypes() {
  const ctx = useContext(TaskTypeContext);
  if (!ctx) throw new Error("useTaskTypes must be used within TaskTypeProvider");
  return ctx;
}
