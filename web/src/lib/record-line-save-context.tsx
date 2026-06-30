"use client";

import { createContext, useContext, type ReactNode } from "react";

export type RecordLineSaveActions = {
  onSave: () => boolean | void | Promise<boolean | void>;
  onDiscard: () => void;
  dirty: boolean;
  canSave?: boolean;
  saving?: boolean;
  saveError?: string;
};

const RecordLineSaveContext = createContext<RecordLineSaveActions | null>(null);

export function RecordLineSaveProvider({
  children,
  onSave,
  onDiscard,
  dirty,
  canSave = true,
  saving = false,
  saveError,
}: RecordLineSaveActions & { children: ReactNode }) {
  return (
    <RecordLineSaveContext.Provider value={{ onSave, onDiscard, dirty, canSave, saving, saveError }}>
      {children}
    </RecordLineSaveContext.Provider>
  );
}

/** Parent record save handlers for line drawers (optional — omit on read-only pages). */
export function useRecordLineSaveOptional(): RecordLineSaveActions | null {
  return useContext(RecordLineSaveContext);
}
