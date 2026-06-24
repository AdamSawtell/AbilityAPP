-- WP-AG.5–7 — mandatory invoice document on vendor invoice

alter table public.vendor_invoice
  add column if not exists document_storage_path text not null default '',
  add column if not exists document_file_name text not null default '',
  add column if not exists document_mime_type text not null default '',
  add column if not exists document_byte_size bigint not null default 0;

comment on column public.vendor_invoice.document_storage_path is 'Path in the org-documents storage bucket for the vendor-uploaded invoice file.';
comment on column public.vendor_invoice.document_file_name is 'Original file name of the uploaded invoice document.';
