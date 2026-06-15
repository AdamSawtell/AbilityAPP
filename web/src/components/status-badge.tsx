import { statusTone } from "@/lib/enquiry";

const tones: Record<string, string> = {
  sky: "bg-sky-50 text-sky-800 ring-sky-200",
  amber: "bg-amber-50 text-amber-900 ring-amber-200",
  emerald: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  zinc: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = statusTone(status);
  const label = status.replace(/^\d+_/, "").replace(/_/g, " ");

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}
    >
      {label}
    </span>
  );
}
