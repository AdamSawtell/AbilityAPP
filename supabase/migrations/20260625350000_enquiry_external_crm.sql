-- WP-0.5: external CRM sync metadata on enquiries

alter table public.enquiry
  add column if not exists external_crm_provider text not null default '',
  add column if not exists external_crm_id text not null default '',
  add column if not exists external_crm_synced_at timestamptz;
