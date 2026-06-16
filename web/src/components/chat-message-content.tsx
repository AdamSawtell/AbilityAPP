import Link from "next/link";
import type { ReactNode } from "react";
import type { ChatDisplayAttachment } from "@/lib/ai/types";

const LINK_RE = /\[([^\]]+)\]\((\/[^)]+)\)/g;
const PATH_RE = /(\/(?:clients|enquiries|employees|locations|tasks)[^\s),]*)/g;

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
          {attachment.type === "table" && attachment.columns && attachment.rows ? (
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
      ))}
    </div>
  );
}
