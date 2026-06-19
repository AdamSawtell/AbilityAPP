"use client";

import { useReferenceData } from "@/lib/config-store";
import { withDraftHighlight } from "@/lib/ai/draft-field-highlight";
import type { EnquiryRecord, FormSection } from "@/lib/enquiry";

function Field({
  field,
  value,
  onChange,
  highlightFields,
  readOnly = false,
}: {
  field: FormSection["fields"][number];
  value: string;
  onChange: (key: keyof EnquiryRecord, value: string) => void;
  highlightFields?: Set<string>;
  readOnly?: boolean;
}) {
  const { getOptions } = useReferenceData();
  const base =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20 disabled:bg-slate-50 disabled:text-slate-500";
  const fieldClass = withDraftHighlight(base, String(field.key), highlightFields);

  if (field.readOnly || readOnly) {
    return <input className={fieldClass} value={value || "—"} readOnly disabled />;
  }

  if (field.type === "textarea") {
    return (
      <textarea
        className={`${fieldClass} min-h-[96px] resize-y`}
        value={value}
        onChange={(e) => onChange(field.key, e.target.value)}
      />
    );
  }

  if (field.type === "select" && field.optionsKey) {
    const options = getOptions(field.optionsKey);
    return (
      <select
        className={fieldClass}
        value={value}
        onChange={(e) => onChange(field.key, e.target.value)}
      >
        <option value="">Select…</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      className={fieldClass}
      type={field.type}
      value={value}
      onChange={(e) => onChange(field.key, e.target.value)}
    />
  );
}

export function EnquiryForm({
  record,
  sections,
  onChange,
  activeSection,
  highlightFields,
  readOnly = false,
}: {
  record: EnquiryRecord;
  sections: FormSection[];
  onChange: (key: keyof EnquiryRecord, value: string) => void;
  activeSection?: string | null;
  highlightFields?: Set<string>;
  readOnly?: boolean;
}) {
  const visibleSections = activeSection ? sections.filter((s) => s.title === activeSection) : sections;

  return (
    <div className="space-y-6">
      {visibleSections.map((section) => (
        <section
          key={section.title}
          id={`enquiry-section-${section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-800">{section.title}</h2>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            {section.fields.map((field) => (
              <label
                key={field.key}
                className={`block ${field.type === "textarea" ? "sm:col-span-2" : ""}`}
              >
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  {field.label}
                </span>
                <Field field={field} value={String(record[field.key] ?? "")} onChange={onChange} highlightFields={highlightFields} readOnly={readOnly} />
              </label>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
