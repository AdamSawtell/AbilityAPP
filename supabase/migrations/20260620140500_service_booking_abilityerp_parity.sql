-- Realign service booking with AbilityERP: document header + service booking lines.

drop table if exists public.service_booking_staff;
drop table if exists public.service_booking;

create table if not exists public.service_booking (
  id text primary key,
  document_no text not null default '',
  organization text not null default 'AbilityVua',
  description text not null default '',
  target_document_type text not null default 'Service Booking - Standard',
  is_template boolean not null default false,
  ready_to_claim_rule text not null default 'Manual Tick',
  program_of_supports boolean not null default false,
  date_ordered date,
  date_promised date,
  start_date date,
  end_date date,
  client_id text references public.client (id) on delete set null,
  invoice_partner text not null default '',
  service_agreement_id text references public.service_agreement (id) on delete set null,
  booking_generator_ref text not null default '',
  total_lines numeric(14, 2),
  grand_total numeric(14, 2),
  document_status text not null default 'Drafted',
  created_by text not null default '',
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_booking_line (
  id text primary key,
  service_booking_id text not null references public.service_booking (id) on delete cascade,
  line_no integer not null default 10,
  manual_hold boolean not null default false,
  ready_to_claim boolean not null default false,
  ordered_quantity numeric(10, 4) not null default 1,
  quantity_invoiced numeric(10, 4) not null default 0,
  date_promised date,
  product_id text references public.product (id) on delete set null,
  claim_type text not null default '',
  use_time_based_quantity boolean not null default false,
  start_date date,
  end_date date,
  uom text not null default 'Week',
  price numeric(14, 2),
  line_amount numeric(14, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists service_booking_client_id_idx on public.service_booking (client_id);
create index if not exists service_booking_date_promised_idx on public.service_booking (date_promised desc);
create index if not exists service_booking_document_status_idx on public.service_booking (document_status);
create index if not exists service_booking_line_booking_id_idx on public.service_booking_line (service_booking_id);

drop trigger if exists service_booking_updated_at on public.service_booking;
create trigger service_booking_updated_at
  before update on public.service_booking
  for each row execute function public.set_updated_at();

drop trigger if exists service_booking_line_updated_at on public.service_booking_line;
create trigger service_booking_line_updated_at
  before update on public.service_booking_line
  for each row execute function public.set_updated_at();

alter table public.service_booking enable row level security;
alter table public.service_booking_line enable row level security;

drop policy if exists service_booking_select on public.service_booking;
drop policy if exists service_booking_write on public.service_booking;
create policy service_booking_select on public.service_booking for select to anon, authenticated using (true);
create policy service_booking_write on public.service_booking for all to anon, authenticated using (true) with check (true);

drop policy if exists service_booking_line_select on public.service_booking_line;
drop policy if exists service_booking_line_write on public.service_booking_line;
create policy service_booking_line_select on public.service_booking_line for select to anon, authenticated using (true);
create policy service_booking_line_write on public.service_booking_line for all to anon, authenticated using (true) with check (true);
