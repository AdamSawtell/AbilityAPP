-- Service bookings — scheduled NDIS service delivery (AbilityERP Service Booking parity).

create table if not exists public.service_booking (
  id text primary key,
  document_no text not null default '',
  search_key text not null default '',
  name text not null default '',
  description text not null default '',
  client_id text references public.client (id) on delete set null,
  location_id text references public.support_location (id) on delete set null,
  service_agreement_id text references public.service_agreement (id) on delete set null,
  agreement_line_id text references public.service_agreement_line (id) on delete set null,
  product_id text references public.product (id) on delete set null,
  primary_employee_id text references public.employee (id) on delete set null,
  booking_type text not null default 'Individual',
  status text not null default 'Draft',
  service_date date,
  start_time text not null default '',
  end_time text not null default '',
  duration_minutes integer,
  units numeric(10, 4),
  unit_price numeric(14, 2),
  total_amount numeric(14, 2),
  funding_type text not null default '',
  notes text not null default '',
  cancellation_reason text not null default '',
  created_by text not null default '',
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_booking_staff (
  id text primary key,
  service_booking_id text not null references public.service_booking (id) on delete cascade,
  line_no integer not null default 1,
  employee_id text references public.employee (id) on delete set null,
  employee_name text not null default '',
  staff_role text not null default 'Support worker',
  hours numeric(8, 2),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists service_booking_client_id_idx on public.service_booking (client_id);
create index if not exists service_booking_location_id_idx on public.service_booking (location_id);
create index if not exists service_booking_service_date_idx on public.service_booking (service_date desc);
create index if not exists service_booking_status_idx on public.service_booking (status);
create index if not exists service_booking_staff_booking_id_idx on public.service_booking_staff (service_booking_id);

drop trigger if exists service_booking_updated_at on public.service_booking;
create trigger service_booking_updated_at
  before update on public.service_booking
  for each row execute function public.set_updated_at();

drop trigger if exists service_booking_staff_updated_at on public.service_booking_staff;
create trigger service_booking_staff_updated_at
  before update on public.service_booking_staff
  for each row execute function public.set_updated_at();

alter table public.service_booking enable row level security;
alter table public.service_booking_staff enable row level security;

drop policy if exists service_booking_select on public.service_booking;
drop policy if exists service_booking_write on public.service_booking;
create policy service_booking_select on public.service_booking for select to anon, authenticated using (true);
create policy service_booking_write on public.service_booking for all to anon, authenticated using (true) with check (true);

drop policy if exists service_booking_staff_select on public.service_booking_staff;
drop policy if exists service_booking_staff_write on public.service_booking_staff;
create policy service_booking_staff_select on public.service_booking_staff for select to anon, authenticated using (true);
create policy service_booking_staff_write on public.service_booking_staff for all to anon, authenticated using (true) with check (true);
