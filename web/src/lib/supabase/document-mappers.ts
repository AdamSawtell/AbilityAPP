import type {
  DocumentClass,
  DocumentTemplateBlockRecord,
  DocumentTemplateRecord,
  GeneratedDocumentRecord,
  ProcessDocumentBindingRecord,
} from "@/lib/document-template";
import { normalizeDocumentTemplate } from "@/lib/document-template";

export type DocumentTemplateRow = {
  id: string;
  name: string;
  description?: string;
  document_class: string;
  active: boolean;
  is_default: boolean;
  title_text?: string;
  footer_text?: string;
  created_by?: string;
  updated_by?: string;
};

export type DocumentTemplateBlockRow = {
  id: string;
  template_id: string;
  block_type: string;
  label?: string;
  content_html?: string;
  sort_order: number;
  locked: boolean;
};

export type ProcessDocumentBindingRow = {
  id: string;
  process_id: string;
  entity_type: string;
  template_id: string;
  is_default: boolean;
  allow_user_override: boolean;
};

export type GeneratedDocumentRow = {
  id: string;
  document_no: string;
  template_id: string;
  document_class: string;
  entity_type: string;
  entity_id: string;
  entity_label?: string;
  batch_id?: string;
  storage_path?: string;
  file_name?: string;
  mime_type?: string;
  byte_size?: number;
  status: string;
  generated_by?: string;
  generated_at?: string;
};

export function documentTemplateFromRow(
  row: DocumentTemplateRow,
  blocks: DocumentTemplateBlockRow[]
): DocumentTemplateRecord {
  return normalizeDocumentTemplate({
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    documentClass: row.document_class as DocumentClass,
    active: row.active,
    isDefault: row.is_default,
    titleText: row.title_text ?? "",
    footerText: row.footer_text ?? "",
    blocks: blocks.map(
      (block): DocumentTemplateBlockRecord => ({
        id: block.id,
        templateId: block.template_id,
        blockType: block.block_type as DocumentTemplateBlockRecord["blockType"],
        label: block.label ?? "",
        contentHtml: block.content_html ?? "",
        sortOrder: block.sort_order,
        locked: block.locked,
      })
    ),
    createdBy: row.created_by ?? "",
    updatedBy: row.updated_by ?? "",
  });
}

export function documentTemplateToRow(record: DocumentTemplateRecord): DocumentTemplateRow {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    document_class: record.documentClass,
    active: record.active,
    is_default: record.isDefault,
    title_text: record.titleText,
    footer_text: record.footerText,
    created_by: record.createdBy,
    updated_by: record.updatedBy,
  };
}

export function documentTemplateBlockToRow(block: DocumentTemplateBlockRecord): DocumentTemplateBlockRow {
  return {
    id: block.id,
    template_id: block.templateId,
    block_type: block.blockType,
    label: block.label,
    content_html: block.contentHtml,
    sort_order: block.sortOrder,
    locked: block.locked,
  };
}

export function processDocumentBindingFromRow(row: ProcessDocumentBindingRow): ProcessDocumentBindingRecord {
  return {
    id: row.id,
    processId: row.process_id,
    entityType: row.entity_type,
    templateId: row.template_id,
    isDefault: row.is_default,
    allowUserOverride: row.allow_user_override,
  };
}

export function processDocumentBindingToRow(record: ProcessDocumentBindingRecord): ProcessDocumentBindingRow {
  return {
    id: record.id,
    process_id: record.processId,
    entity_type: record.entityType,
    template_id: record.templateId,
    is_default: record.isDefault,
    allow_user_override: record.allowUserOverride,
  };
}

export function generatedDocumentFromRow(row: GeneratedDocumentRow): GeneratedDocumentRecord {
  return {
    id: row.id,
    documentNo: row.document_no,
    templateId: row.template_id,
    documentClass: row.document_class as DocumentClass,
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityLabel: row.entity_label ?? "",
    batchId: row.batch_id ?? "",
    storagePath: row.storage_path ?? "",
    fileName: row.file_name ?? "",
    mimeType: row.mime_type ?? "text/html",
    byteSize: row.byte_size ?? 0,
    status: (row.status as GeneratedDocumentRecord["status"]) ?? "final",
    generatedBy: row.generated_by ?? "",
    generatedAt: row.generated_at ?? "",
  };
}

export function generatedDocumentToRow(record: GeneratedDocumentRecord): GeneratedDocumentRow {
  return {
    id: record.id,
    document_no: record.documentNo,
    template_id: record.templateId,
    document_class: record.documentClass,
    entity_type: record.entityType,
    entity_id: record.entityId,
    entity_label: record.entityLabel,
    batch_id: record.batchId,
    storage_path: record.storagePath,
    file_name: record.fileName,
    mime_type: record.mimeType,
    byte_size: record.byteSize,
    status: record.status,
    generated_by: record.generatedBy,
    generated_at: record.generatedAt,
  };
}
