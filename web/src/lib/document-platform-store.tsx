"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  initialDocumentTemplates,
  initialProcessDocumentBindings,
  normalizeDocumentTemplate,
  resolveTemplateForProcess,
  templatesForProcess,
  type DocumentTemplateRecord,
  type GeneratedDocumentRecord,
  type ProcessDocumentBindingRecord,
} from "@/lib/document-template";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchDocumentPlatform,
  saveDocumentTemplate,
  saveGeneratedDocument,
  saveProcessDocumentBinding,
} from "@/lib/supabase/data-api";
import { persistRecordAudit } from "@/lib/audit-mutation";

type DocumentPlatformContextValue = {
  templates: DocumentTemplateRecord[];
  bindings: ProcessDocumentBindingRecord[];
  generatedDocuments: GeneratedDocumentRecord[];
  loading: boolean;
  resolveTemplate: (processId: string, entityType: string, templateId?: string) => DocumentTemplateRecord | null;
  listTemplatesForProcess: (processId: string, entityType: string) => DocumentTemplateRecord[];
  upsertTemplate: (record: DocumentTemplateRecord) => Promise<void>;
  upsertBinding: (record: ProcessDocumentBindingRecord) => Promise<void>;
  registerGeneratedDocument: (record: GeneratedDocumentRecord) => Promise<void>;
  reload: () => Promise<void>;
};

const DocumentPlatformContext = createContext<DocumentPlatformContextValue | null>(null);

export function DocumentPlatformProvider({ children }: { children: ReactNode }) {
  const [templates, setTemplates] = useState<DocumentTemplateRecord[]>(initialDocumentTemplates);
  const [bindings, setBindings] = useState<ProcessDocumentBindingRecord[]>(initialProcessDocumentBindings);
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocumentRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const data = await fetchDocumentPlatform(supabase);
      if (data.templates.length) {
        const merged = new Map(data.templates.map((t) => [t.id, normalizeDocumentTemplate(t)]));
        for (const fallback of initialDocumentTemplates) {
          if (!merged.has(fallback.id)) merged.set(fallback.id, fallback);
        }
        setTemplates([...merged.values()]);
      }
      if (data.bindings.length) {
        const mergedBindings = new Map(data.bindings.map((b) => [b.id, b]));
        for (const fallback of initialProcessDocumentBindings) {
          if (!mergedBindings.has(fallback.id)) mergedBindings.set(fallback.id, fallback);
        }
        setBindings([...mergedBindings.values()]);
      }
      setGeneratedDocuments(data.generatedDocuments);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const upsertTemplate = useCallback(async (record: DocumentTemplateRecord) => {
    const normalized = normalizeDocumentTemplate(record);
    const before = templates.find((t) => t.id === normalized.id);
    persistRecordAudit("document-template", normalized, !before, before);
    setTemplates((prev) => {
      const exists = prev.some((t) => t.id === normalized.id);
      return exists ? prev.map((t) => (t.id === normalized.id ? normalized : t)) : [...prev, normalized];
    });
    if (isSupabaseConfigured()) {
      await saveDocumentTemplate(createClient(), normalized);
    }
  }, [templates]);

  const upsertBinding = useCallback(async (record: ProcessDocumentBindingRecord) => {
    if (isSupabaseConfigured()) {
      await saveProcessDocumentBinding(createClient(), record);
    }
    setBindings((prev) => {
      const exists = prev.some((b) => b.id === record.id);
      return exists ? prev.map((b) => (b.id === record.id ? record : b)) : [...prev, record];
    });
  }, []);

  const registerGeneratedDocument = useCallback(async (record: GeneratedDocumentRecord) => {
    persistRecordAudit("generated-document", record, true);
    setGeneratedDocuments((prev) => [record, ...prev]);
    if (isSupabaseConfigured()) {
      await saveGeneratedDocument(createClient(), record);
    }
  }, []);

  const value = useMemo(
    () => ({
      templates,
      bindings,
      generatedDocuments,
      loading,
      resolveTemplate: (processId: string, entityType: string, templateId?: string) =>
        resolveTemplateForProcess(bindings, templates, processId, entityType, templateId),
      listTemplatesForProcess: (processId: string, entityType: string) =>
        templatesForProcess(templates, bindings, processId, entityType),
      upsertTemplate,
      upsertBinding,
      registerGeneratedDocument,
      reload,
    }),
    [templates, bindings, generatedDocuments, loading, upsertTemplate, upsertBinding, registerGeneratedDocument, reload]
  );

  return <DocumentPlatformContext.Provider value={value}>{children}</DocumentPlatformContext.Provider>;
}

export function useDocumentPlatform() {
  const ctx = useContext(DocumentPlatformContext);
  if (!ctx) {
    throw new Error("useDocumentPlatform must be used within DocumentPlatformProvider");
  }
  return ctx;
}
