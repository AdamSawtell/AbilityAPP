"use client";

import { useRef, useState } from "react";
import { newLineId } from "@/lib/client-line-tables";
import type { IncidentEvidenceRow } from "@/lib/incident";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

const BUCKET = "incident-evidence";

export function IncidentEvidenceUpload({
  incidentId,
  uploadedBy,
  onUploaded,
}: {
  incidentId: string;
  uploadedBy: string;
  onUploaded: (row: IncidentEvidenceRow) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    if (!file) return;
    setError("");
    setUploading(true);

    try {
      const storagePath = `${incidentId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      let fileUrl = "";

      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
          upsert: false,
          contentType: file.type || undefined,
        });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
        fileUrl = data.publicUrl;
      } else {
        fileUrl = `local://${storagePath}`;
      }

      onUploaded({
        id: newLineId("iev"),
        lineNo: 0,
        actionId: "",
        fileName: file.name,
        fileUrl,
        storagePath,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
        uploadedBy,
        notes: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-900">Upload evidence file</p>
          <p className="text-xs text-slate-500">Photos, statements, or investigation documents (stored in Supabase when linked).</p>
        </div>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Choose file"}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      {error ? <p className="mt-2 text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}
