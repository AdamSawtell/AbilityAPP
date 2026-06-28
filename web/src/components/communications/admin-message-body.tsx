"use client";

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|https?:\/\/[^\s]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (/^https?:\/\//.test(part)) {
      return (
        <a key={i} href={part} className="text-[#b51266] underline" target="_blank" rel="noreferrer">
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function AdminMessageBody({ body, className = "" }: { body: string; className?: string }) {
  const lines = body.split("\n");
  return (
    <div className={`space-y-2 text-sm leading-relaxed text-slate-700 ${className}`}>
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={index} className="h-2" />;
        if (trimmed.startsWith("- ")) {
          return (
            <p key={index} className="flex gap-2 pl-1">
              <span className="text-slate-400">•</span>
              <span>{renderInline(trimmed.slice(2))}</span>
            </p>
          );
        }
        return <p key={index}>{renderInline(trimmed)}</p>;
      })}
    </div>
  );
}
