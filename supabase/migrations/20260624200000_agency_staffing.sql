-- AB-0019 Agency staffing — agency workers, shift requests, site orientation, roster shift coverage

create table if not exists public.agency_worker (
  id text primary key,
  search_key text not null default '',
  vendor_bp_id text not null references public.business_partner (id) on delete restrict,
  first_name text not null default '',
  last_name text not null default '',
  name text not null default '',
  email text not null default '',
  phone text not null default '',
  qualifications text not null default '',
  skills text not null default '',
  tools_notes text not null default '',
  active boolean not null default true,
  notes text not null default '',
  created_by text not null default '',
  updated_by text not null default ''
);

create index if not exists agency_worker_vendor_bp_id_idx on public.agency_worker (vendor_bp_id);

comment on table public.agency_worker is 'Agency-employed worker — not a full employee; linked to staffing vendor business partner.';

create table if not exists public.agency_shift_request (
  id text primary key,
  document_no text not null default '',
  roster_shift_id text not null references public.roster_shift (id) on delete cascade,
  vendor_bp_id text not null references public.business_partner (id) on delete restrict,
  agency_worker_id text references public.agency_worker (id) on delete set null,
  status text not null default 'Draft',
  skills_required text not null default '',
  client_advised_at timestamptz,
  sent_at timestamptz,
  confirmed_at timestamptz,
  completed_at timestamptz,
  continuity_notes text not null default '',
  vendor_invoice_ref text not null default '',
  vendor_invoice_status text not null default '',
  notes text not null default '',
  created_by text not null default '',
  updated_by text not null default ''
);

create index if not exists agency_shift_request_shift_idx on public.agency_shift_request (roster_shift_id);
create index if not exists agency_shift_request_vendor_idx on public.agency_shift_request (vendor_bp_id);

comment on table public.agency_shift_request is 'Workflow from vacant roster shift through vendor pack to confirmed agency coverage.';

create table if not exists public.site_orientation (
  id text primary key,
  worker_type text not null default 'agency',
  worker_id text not null,
  location_id text not null references public.support_location (id) on delete cascade,
  oriented_at date not null,
  expires_at date,
  acknowledged_by text not null default '',
  notes text not null default '',
  created_by text not null default '',
  updated_by text not null default ''
);

create index if not exists site_orientation_worker_idx on public.site_orientation (worker_type, worker_id);
create index if not exists site_orientation_location_idx on public.site_orientation (location_id);

comment on table public.site_orientation is 'Site orientation record for employees or agency workers at a support location (AB-0018 gate).';

alter table public.roster_shift
  add column if not exists coverage_source text not null default 'internal',
  add column if not exists agency_worker_id text references public.agency_worker (id) on delete set null,
  add column if not exists vendor_bp_id text references public.business_partner (id) on delete set null,
  add column if not exists agency_request_id text references public.agency_shift_request (id) on delete set null;

comment on column public.roster_shift.coverage_source is 'internal | agency — how the shift is staffed.';

-- Staffing vendor + agency workers
insert into public.business_partner (
  id, search_key, name, partner_type, status, email, phone, mobile, abn,
  address1, address2, city, state, postcode, country,
  preferred_communication_method, invoice_delivery_method, statement_delivery_method,
  payment_terms, bank_bsb, bank_account_number, bank_account_name, remittance_email, notes,
  created_by, updated_by
) values (
  'bp-staffplus', 'StaffPlus Agency', 'StaffPlus Agency Pty Ltd', 'NDIS agency', 'Active',
  'roster@staffplus.example', '08 8400 4400', '', '11 222 333 444',
  '50 Pirie Street', '', 'Adelaide', 'SA', '5000', 'Australia',
  'Email', 'Email', 'Email', '14 days', '', '', '', 'roster@staffplus.example',
  'Primary agency staffing partner for relief and SIL coverage.',
  'SuperUser', 'SuperUser'
) on conflict (id) do nothing;

insert into public.agency_worker (
  id, search_key, vendor_bp_id, first_name, last_name, name, email, phone,
  qualifications, skills, tools_notes, active, notes, created_by, updated_by
) values
  (
    'aw-sp-jane', 'Jane Agency', 'bp-staffplus', 'Jane', 'Agency', 'Jane Agency',
    'jane.agency@staffplus.example', '0400 111 222',
    'Cert III Individual Support', 'SIL, personal care, manual handling', 'Own vehicle', true,
    'Regular relief at Glenelg SIL.',
    'SuperUser', 'SuperUser'
  ),
  (
    'aw-sp-mike', 'Mike Relief', 'bp-staffplus', 'Mike', 'Relief', 'Mike Relief',
    'mike.relief@staffplus.example', '0400 333 444',
    'Cert IV Disability', 'Community access, behaviour support', '', true,
    'Weekend relief pool.',
    'SuperUser', 'SuperUser'
  )
on conflict (id) do nothing;

-- Vacant shift for agency workflow demo
insert into public.roster_shift (
  id, shift_ref, client_id, employee_id, location_id, service_booking_id,
  shift_date, start_time, end_time, shift_type, status, notes,
  coverage_source, created_by, updated_by
) values (
  'rs-bern-tue-vac', 'BERN-TUE-VAC', 'bp-bern', null, 'loc-glenelg-sil', 'sb-50145',
  '2025-10-07', '09:00', '15:00', 'Standard', 'Published', 'Vacant — agency coverage candidate',
  'internal', 'Isla Robinson', 'Isla Robinson'
) on conflict (id) do nothing;

insert into public.site_orientation (
  id, worker_type, worker_id, location_id, oriented_at, expires_at, acknowledged_by, notes, created_by, updated_by
) values (
  'so-aw-jane-glenelg', 'agency', 'aw-sp-jane', 'loc-glenelg-sil', '2025-09-01', '2026-09-01',
  'Isla Robinson', 'Initial site orientation — fire exits and client routines.',
  'SuperUser', 'SuperUser'
) on conflict (id) do nothing;
