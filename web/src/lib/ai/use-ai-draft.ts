"use client";

import { useEffect, useState } from "react";

export type AiDraftLoadState = {
  payload: Record<string, unknown> | null;
  entityType: string;
  summary: string;
  loading: boolean;
  error: string;
};

export function useAiDraftLoader(aiDraftId: string | null): AiDraftLoadState {
  const [payload, setPayload] = useState<Record<string, unknown> | null>(null);
  const [entityType, setEntityType] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(Boolean(aiDraftId));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!aiDraftId) {
      setPayload(null);
      setEntityType("");
      setSummary("");
      setLoading(false);
      setError("");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    void (async () => {
      try {
        const res = await fetch(`/api/ai/drafts/${aiDraftId}`, { credentials: "include" });
        const data = (await res.json()) as {
          error?: string;
          payload?: Record<string, unknown>;
          entityType?: string;
          summary?: string;
        };
        if (!res.ok) {
          if (!cancelled) setError(data.error ?? "Could not load AI draft");
          return;
        }
        if (!cancelled) {
          setPayload(data.payload ?? {});
          setEntityType(data.entityType ?? "");
          setSummary(data.summary ?? "");
        }
      } catch {
        if (!cancelled) setError("Could not load AI draft");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [aiDraftId]);

  return { payload, entityType, summary, loading, error };
}
