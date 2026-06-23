-- Document send email templates (subject/body for print-and-send handoff)

create table if not exists public.app_document_email_template (
  id text primary key,
  process_id text not null unique,
  label text not null default '',
  subject text not null default '',
  body text not null default '',
  active boolean not null default true,
  updated_by text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.app_document_email_template enable row level security;

create policy "app_document_email_template read"
  on public.app_document_email_template for select
  using (true);

create policy "app_document_email_template write"
  on public.app_document_email_template for all
  using (true)
  with check (true);

insert into public.app_document_email_template (id, process_id, label, subject, body, active, updated_by, updated_at)
values
  (
    'email-send-support-plan',
    'send-support-plan',
    'Send support plan',
    '{{orgName}} — Support plan {{planDocumentNo}}',
    E'Dear {{recipientName}},\n\nPlease find the support plan ({{planDocumentNo}}) attached.\n\nDocument registry reference: {{documentNo}}.\n\n{{orgName}}',
    true,
    'System',
    now()
  ),
  (
    'email-send-invoice',
    'send-invoice',
    'Issue invoice',
    '{{orgName}} — Invoice {{invoiceDocumentNo}}',
    E'Dear {{recipientName}},\n\nPlease find invoice {{invoiceDocumentNo}} attached.\nPeriod: {{periodStart}} to {{periodEnd}}.\nAmount: {{amount}}.\n\nDocument registry reference: {{documentNo}}.\n\n{{orgName}}',
    true,
    'System',
    now()
  )
on conflict (id) do nothing;

insert into public.app_role_window (role_id, window_key, access_level)
select r.role_id, w.window_key, 'write'
from (values ('role-admin')) as r(role_id)
cross join (values ('admin-document-email')) as w(window_key)
on conflict (role_id, window_key) do update set access_level = excluded.access_level;
