"use client";

import { useEffect, useRef, useState } from "react";
import type { EmployeeRecord } from "@/lib/employee";

export function EmployeePhotoUpload({
  pictureUrl,
  displayName,
  onUpdated,
  compact = false,
}: {
  pictureUrl?: string;
  displayName?: string;
  onUpdated: (employee: EmployeeRecord) => void;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState(pictureUrl?.trim() ?? "");

  useEffect(() => {
    setPreviewUrl(pictureUrl?.trim() ?? "");
  }, [pictureUrl]);

  async function uploadFile(file: File) {
    setError("");
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch("/api/my/profile/photo", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const body = (await res.json()) as { error?: string; employee?: EmployeeRecord; pictureUrl?: string };
      if (!res.ok) throw new Error(body.error ?? "Upload failed");
      if (body.employee) onUpdated(body.employee);
      setPreviewUrl(body.pictureUrl?.trim() || body.employee?.pictureUrl?.trim() || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function removePhoto() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/my/profile/photo", {
        method: "DELETE",
        credentials: "include",
      });
      const body = (await res.json()) as { error?: string; employee?: EmployeeRecord };
      if (!res.ok) throw new Error(body.error ?? "Could not remove photo");
      if (body.employee) onUpdated(body.employee);
      setPreviewUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove photo");
    } finally {
      setBusy(false);
    }
  }

  const initial = (displayName?.trim() || "E").slice(0, 1).toUpperCase();
  const photo = previewUrl || pictureUrl?.trim();

  return (
    <section
      id="profile-photo"
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${compact ? "p-4" : "p-5"}`}
    >
      <h2 className="font-semibold text-slate-900">Profile photo</h2>
      <p className="mt-1 text-sm text-slate-600">
        Shown on your Digital Worker ID and employee record. JPG, PNG, or WebP up to 5 MB.
      </p>
      <div className={`mt-4 flex items-center gap-4 ${compact ? "flex-col sm:flex-row" : "flex-col sm:flex-row sm:items-start"}`}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt=""
            className={`rounded-2xl object-cover ring-2 ring-[#fdf2f8] ${compact ? "h-24 w-24" : "h-28 w-28"}`}
          />
        ) : (
          <div
            className={`flex items-center justify-center rounded-2xl bg-[#fdf2f8] font-bold text-[#b51266] ${compact ? "h-24 w-24 text-2xl" : "h-28 w-28 text-3xl"}`}
          >
            {initial}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="min-h-11 rounded-xl bg-[#b51266] px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Uploading…" : photo ? "Change photo" : "Upload photo"}
          </button>
          {photo ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void removePhoto()}
              className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 disabled:opacity-60"
            >
              Remove photo
            </button>
          ) : null}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void uploadFile(file);
        }}
      />
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </section>
  );
}
