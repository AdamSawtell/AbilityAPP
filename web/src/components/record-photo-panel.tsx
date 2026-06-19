"use client";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

export function RecordPhotoPanel({
  pictureUrl,
  onChange,
  title = "Photo",
  description = "Profile image shown on the record header and in lists.",
}: {
  pictureUrl?: string;
  onChange: (url: string) => void;
  title?: string;
  description?: string;
}) {
  const url = pictureUrl ?? "";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
        {url.trim() ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            className="h-36 w-full max-w-xs rounded-xl object-cover ring-1 ring-slate-200"
          />
        ) : (
          <div className="flex h-36 w-full max-w-xs items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
            No photo yet
          </div>
        )}
        <label className="min-w-0 flex-1">
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Photo URL</span>
          <input
            className={inputClass}
            value={url}
            placeholder="https://…"
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}
