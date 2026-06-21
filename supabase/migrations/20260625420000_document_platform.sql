-- Document platform — templates, process bindings, generated document registry, org brand kit

alter table public.app_organization
  add column if not exists bank_bsb text not null default '',
  add column if not exists bank_account text not null default '',
  add column if not exists bank_account_name text not null default '',
  add column if not exists remittance_email text not null default '',
  add column if not exists document_footer_text text not null default '',
  add column if not exists gst_registered boolean not null default false;

create table if not exists public.app_document_template (
  id text primary key,
  name text not null,
  description text not null default '',
  document_class text not null,
  active boolean not null default true,
  is_default boolean not null default false,
  title_text text not null default '',
  footer_text text not null default '',
  created_by text not null default '',
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_document_template_block (
  id text primary key,
  template_id text not null references public.app_document_template (id) on delete cascade,
  block_type text not null,
  label text not null default '',
  content_html text not null default '',
  sort_order integer not null default 1,
  locked boolean not null default false
);

create index if not exists app_document_template_block_template_idx
  on public.app_document_template_block (template_id, sort_order);

create table if not exists public.app_process_document_binding (
  id text primary key,
  process_id text not null,
  entity_type text not null,
  template_id text not null references public.app_document_template (id) on delete restrict,
  is_default boolean not null default true,
  allow_user_override boolean not null default true,
  unique (process_id, entity_type, template_id)
);

create index if not exists app_process_document_binding_process_idx
  on public.app_process_document_binding (process_id, entity_type);

create table if not exists public.app_generated_document (
  id text primary key,
  document_no text not null,
  template_id text not null references public.app_document_template (id) on delete restrict,
  document_class text not null,
  entity_type text not null,
  entity_id text not null,
  entity_label text not null default '',
  batch_id text not null default '',
  storage_path text not null default '',
  file_name text not null default '',
  mime_type text not null default 'text/html',
  byte_size integer not null default 0,
  status text not null default 'final',
  generated_by text not null default '',
  generated_at timestamptz not null default now(),
  constraint app_generated_document_status check (status in ('draft', 'final', 'superseded'))
);

create index if not exists app_generated_document_entity_idx
  on public.app_generated_document (entity_type, entity_id, generated_at desc);
create index if not exists app_generated_document_batch_idx
  on public.app_generated_document (batch_id) where batch_id <> '';

drop trigger if exists app_document_template_updated_at on public.app_document_template;
create trigger app_document_template_updated_at
  before update on public.app_document_template
  for each row execute function public.set_updated_at();

alter table public.app_document_template enable row level security;
alter table public.app_document_template_block enable row level security;
alter table public.app_process_document_binding enable row level security;
alter table public.app_generated_document enable row level security;

drop policy if exists app_document_template_select on public.app_document_template;
drop policy if exists app_document_template_write on public.app_document_template;
create policy app_document_template_select on public.app_document_template for select to anon, authenticated using (true);
create policy app_document_template_write on public.app_document_template for all to anon, authenticated using (true) with check (true);

drop policy if exists app_document_template_block_select on public.app_document_template_block;
drop policy if exists app_document_template_block_write on public.app_document_template_block;
create policy app_document_template_block_select on public.app_document_template_block for select to anon, authenticated using (true);
create policy app_document_template_block_write on public.app_document_template_block for all to anon, authenticated using (true) with check (true);

drop policy if exists app_process_document_binding_select on public.app_process_document_binding;
drop policy if exists app_process_document_binding_write on public.app_process_document_binding;
create policy app_process_document_binding_select on public.app_process_document_binding for select to anon, authenticated using (true);
create policy app_process_document_binding_write on public.app_process_document_binding for all to anon, authenticated using (true) with check (true);

drop policy if exists app_generated_document_select on public.app_generated_document;
drop policy if exists app_generated_document_write on public.app_generated_document;
create policy app_generated_document_select on public.app_generated_document for select to anon, authenticated using (true);
create policy app_generated_document_write on public.app_generated_document for all to anon, authenticated using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('org-documents', 'org-documents', false)
on conflict (id) do update set public = false;

drop policy if exists org_documents_storage_select on storage.objects;
create policy org_documents_storage_select on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'org-documents');

drop policy if exists org_documents_storage_insert on storage.objects;
create policy org_documents_storage_insert on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'org-documents');

drop policy if exists org_documents_storage_update on storage.objects;
create policy org_documents_storage_update on storage.objects
  for update to anon, authenticated
  using (bucket_id = 'org-documents')
  with check (bucket_id = 'org-documents');

drop policy if exists org_documents_storage_delete on storage.objects;
create policy org_documents_storage_delete on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'org-documents');

insert into public.app_document_template (
  id, name, description, document_class, active, is_default, title_text, footer_text, created_by, updated_by
)
values (
  'dtax-invoice-ndis-v1',
  'NDIS participant invoice',
  'Standard tax invoice layout for NDIS plan-managed and self-managed participants.',
  'tax-invoice-ndis',
  true,
  true,
  'Invoice',
  '',
  'SuperUser',
  'SuperUser'
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  document_class = excluded.document_class,
  active = excluded.active,
  is_default = excluded.is_default,
  title_text = excluded.title_text;

insert into public.app_document_template_block (id, template_id, block_type, label, content_html, sort_order, locked)
values
  ('dtblk-invoice-header', 'dtax-invoice-ndis-v1', 'org-header', 'Organisation header', '', 1, true),
  ('dtblk-invoice-title', 'dtax-invoice-ndis-v1', 'title', 'Document title', 'Invoice', 2, false),
  ('dtblk-invoice-parties', 'dtax-invoice-ndis-v1', 'parties', 'Bill to', '', 3, false),
  ('dtblk-invoice-lines', 'dtax-invoice-ndis-v1', 'line-table', 'Line items', '', 4, true),
  ('dtblk-invoice-totals', 'dtax-invoice-ndis-v1', 'totals', 'Totals', '', 5, true),
  ('dtblk-invoice-payment', 'dtax-invoice-ndis-v1', 'payment', 'Payment details', '', 6, false),
  ('dtblk-invoice-footer', 'dtax-invoice-ndis-v1', 'org-footer', 'Organisation footer', '', 7, true)
on conflict (id) do nothing;

insert into public.app_process_document_binding (id, process_id, entity_type, template_id, is_default, allow_user_override)
values
  ('pdb-print-invoice', 'print-invoice', 'invoice', 'dtax-invoice-ndis-v1', true, true),
  ('pdb-batch-print-invoices', 'batch-print-invoices', 'invoice', 'dtax-invoice-ndis-v1', true, true)
on conflict (id) do update set
  template_id = excluded.template_id,
  allow_user_override = excluded.allow_user_override;

comment on table public.app_document_template is 'Print and PDF document templates managed in System';
comment on table public.app_generated_document is 'Registry of generated documents stored in org-documents bucket';
