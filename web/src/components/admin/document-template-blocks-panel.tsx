"use client";

import type { DocumentTemplateBlockRecord, DocumentTemplateBlockType } from "@/lib/document-template";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

const BLOCK_TYPE_LABELS: Record<DocumentTemplateBlockType, string> = {
  "org-header": "Organisation header",
  "org-footer": "Organisation footer",
  title: "Title",
  parties: "Parties",
  "line-table": "Line table",
  totals: "Totals",
  payment: "Payment",
  "rich-text": "Rich text clause",
  signature: "Signature",
  metadata: "Metadata",
};

function canEditContent(block: DocumentTemplateBlockRecord): boolean {
  return !block.locked && (block.blockType === "rich-text" || block.blockType === "title");
}

export function DocumentTemplateBlocksPanel({
  blocks,
  onChange,
}: {
  blocks: DocumentTemplateBlockRecord[];
  onChange: (blocks: DocumentTemplateBlockRecord[]) => void;
}) {
  const sorted = [...blocks].sort((a, b) => a.sortOrder - b.sortOrder);

  function updateBlock(id: string, patch: Partial<DocumentTemplateBlockRecord>) {
    onChange(blocks.map((block) => (block.id === id ? { ...block, ...patch } : block)));
  }

  function moveBlock(id: string, direction: -1 | 1) {
    const index = sorted.findIndex((b) => b.id === id);
    const swapIndex = index + direction;
    if (index < 0 || swapIndex < 0 || swapIndex >= sorted.length) return;
    const current = sorted[index];
    const swap = sorted[swapIndex];
    if (current.locked || swap.locked) return;
    const reordered = sorted.map((block, i) => {
      if (i === index) return { ...swap, sortOrder: current.sortOrder };
      if (i === swapIndex) return { ...current, sortOrder: swap.sortOrder };
      return block;
    });
    onChange(reordered);
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Template blocks</h3>
      <p className="mt-1 text-sm text-slate-600">
        Edit clause text on unlocked rich-text blocks. Layout blocks (header, line table, totals) stay fixed per document class.
      </p>
      <ul className="mt-4 space-y-4">
        {sorted.map((block, index) => (
          <li key={block.id} className="rounded-lg border border-slate-100 bg-slate-50/80 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-slate-900">{block.label || BLOCK_TYPE_LABELS[block.blockType]}</p>
                <p className="text-xs text-slate-500">
                  {BLOCK_TYPE_LABELS[block.blockType]}
                  {block.locked ? " · locked layout" : " · editable"}
                </p>
              </div>
              {!block.locked ? (
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={index === 0 || sorted[index - 1]?.locked}
                    onClick={() => moveBlock(block.id, -1)}
                    className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Move up
                  </button>
                  <button
                    type="button"
                    disabled={index === sorted.length - 1 || sorted[index + 1]?.locked}
                    onClick={() => moveBlock(block.id, 1)}
                    className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Move down
                  </button>
                </div>
              ) : null}
            </div>
            {canEditContent(block) ? (
              <>
                <label className="mb-2 block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Block label</span>
                  <input
                    className={inputClass}
                    value={block.label}
                    onChange={(e) => updateBlock(block.id, { label: e.target.value })}
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Clause HTML</span>
                  <textarea
                    className={`${inputClass} min-h-[120px] font-mono text-xs`}
                    value={block.contentHtml}
                    onChange={(e) => updateBlock(block.id, { contentHtml: e.target.value })}
                    placeholder="<p>Payment terms…</p>"
                  />
                </label>
              </>
            ) : (
              <p className="text-xs text-slate-500">This block is rendered by the document engine and cannot be edited here.</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
