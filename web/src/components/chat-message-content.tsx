import Link from "next/link";
import type { ReactNode } from "react";
import type { ChatDisplayAttachment } from "@/lib/ai/types";

const LINK_RE = /\[([^\]]+)\]\((\/[^)]+)\)/g;
const PATH_RE = /(\/(?:clients|enquiries|employees|locations|tasks|incidents)[^\s),]*)/g;

function renderInlineLinks(text: string) {
  const parts: ReactNode[] = [];
  let last = 0;
  const combined = [...text.matchAll(LINK_RE)];
  if (combined.length) {
    for (const match of combined) {
      const index = match.index ?? 0;
      if (index > last) parts.push(text.slice(last, index));
      parts.push(
        <Link key={`${match[2]}-${index}`} href={match[2]} className="font-medium underline">
          {match[1]}
        </Link>
      );
      last = index + match[0].length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts;
  }

  let pathLast = 0;
  for (const match of text.matchAll(PATH_RE)) {
    const index = match.index ?? 0;
    if (index > pathLast) parts.push(text.slice(pathLast, index));
    parts.push(
      <Link key={`${match[1]}-${index}`} href={match[1]} className="font-medium underline">
        {match[1]}
      </Link>
    );
    pathLast = index + match[0].length;
  }
  if (!parts.length) return text;
  if (pathLast < text.length) parts.push(text.slice(pathLast));
  return parts;
}

function PrepareReviewCard({ attachment }: { attachment: ChatDisplayAttachment }) {
  const prepare = attachment.prepare;
  if (!prepare?.href) return null;
  return (
    <div className="rounded-lg border-2 border-[#d4147a] bg-[#fdf2f8] p-3 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">{prepare.label}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">{prepare.hint}</p>
      <Link
        href={prepare.href}
        className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-[#d4147a] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#b51266]"
      >
        Open form and save
      </Link>
    </div>
  );
}

function RecordCards({ attachment }: { attachment: ChatDisplayAttachment }) {
  if (!attachment.cards?.length) return null;
  return (
    <div className="space-y-2">
      {attachment.cards.map((card, i) => (
        <Link
          key={`${card.href}-${i}`}
          href={card.href}
          className="block rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm transition hover:border-[#f9a8d4] hover:shadow"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{card.title}</p>
              {card.subtitle ? <p className="truncate text-xs text-slate-500">{card.subtitle}</p> : null}
              {card.meta ? <p className="mt-0.5 truncate text-xs text-slate-400">{card.meta}</p> : null}
            </div>
            {card.badge ? (
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                {card.badge}
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-[#b51266]">Open record</p>
        </Link>
      ))}
    </div>
  );
}

export function ChatMessageContent({
  content,
  attachments,
}: {
  content: string;
  attachments?: ChatDisplayAttachment[];
}) {
  return (
    <div className="space-y-3">
      <div className="whitespace-pre-wrap">{renderInlineLinks(content)}</div>
      {attachments?.map((attachment, i) => (
        <div key={`${attachment.title}-${i}`} className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50/80">
          <div className="border-b border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {attachment.title}
          </div>
          <div className="p-2">
            {attachment.type === "prepare" ? (
              <PrepareReviewCard attachment={attachment} />
            ) : attachment.type === "cards" ? (
              <RecordCards attachment={attachment} />
            ) : attachment.type === "table" && attachment.columns && attachment.rows ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-500">
                      {attachment.columns.map((col) => (
                        <th key={col} className="px-3 py-2 font-medium">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {attachment.rows.map((row, ri) => (
                      <tr key={ri} className="border-t border-slate-200 text-slate-700">
                        {attachment.columns!.map((col, ci) => {
                          const cell = row[col] ?? "—";
                          const href = row.href;
                          return (
                            <td key={col} className="px-3 py-2">
                              {ci === 0 && href ? (
                                <Link href={href} className="font-medium text-[#d4147a] underline">
                                  {cell}
                                </Link>
                              ) : (
                                cell
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
