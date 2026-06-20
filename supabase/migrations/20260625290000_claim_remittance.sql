-- NDIS remittance import batches and claim payment reconciliation.

alter table public.claim
  add column if not exists remittance_status text not null default 'Not imported',
  add column if not exists remittance_paid_amount numeric(12, 2) not null default 0,
  add column if not exists remittance_payment_ref text not null default '',
  add column if not exists remittance_imported_at timestamptz;

comment on column public.claim.remittance_status is 'Not imported | Pending | Matched | Variance | Partial';

create table if not exists public.claim_remittance (
  id text primary key,
  document_no text not null,
  source_filename text not null default '',
  payment_reference text not null default '',
  remittance_date date,
  total_paid numeric(12, 2) not null default 0,
  matched_count integer not null default 0,
  unmatched_count integer not null default 0,
  variance_count integer not null default 0,
  created_by text not null default '',
  updated_by text not null default ''
);

create table if not exists public.claim_remittance_line (
  id text primary key,
  remittance_id text not null references public.claim_remittance (id) on delete cascade,
  line_no integer not null,
  participant_ndis_number text not null default '',
  support_item_number text not null default '',
  service_date date,
  claimed_amount numeric(12, 2) not null default 0,
  paid_amount numeric(12, 2) not null default 0,
  gateway_claim_ref text not null default '',
  match_status text not null default 'Pending',
  match_message text not null default '',
  claim_id text,
  claim_line_id text
);

create index if not exists claim_remittance_line_remittance_id_idx on public.claim_remittance_line (remittance_id);
create index if not exists claim_remittance_payment_ref_idx on public.claim_remittance (payment_reference);

comment on table public.claim_remittance is 'Imported NDIS remittance / payment advice batch.';
comment on table public.claim_remittance_line is 'Remittance line with match result against claim lines.';
