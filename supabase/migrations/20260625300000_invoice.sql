-- NDIS participant invoices for plan-managed and self-managed billing.

create table if not exists public.invoice (
  id text primary key,
  document_no text not null,
  client_id text,
  period_start date not null,
  period_end date not null,
  status text not null default 'Draft',
  plan_management_type text not null default 'Plan managed',
  total_amount numeric(12, 2) not null default 0,
  invoice_to text not null default '',
  invoice_to_email text not null default '',
  due_date date,
  sent_at timestamptz,
  payment_status text not null default 'Unpaid',
  paid_amount numeric(12, 2) not null default 0,
  payment_reference text not null default '',
  notes text not null default '',
  created_by text not null default '',
  updated_by text not null default ''
);

create table if not exists public.invoice_line (
  id text primary key,
  invoice_id text not null references public.invoice (id) on delete cascade,
  line_no integer not null,
  timesheet_id text,
  timesheet_line_id text,
  roster_shift_id text,
  client_id text,
  employee_id text,
  service_booking_id text,
  product_id text,
  ndis_support_item text not null default '',
  support_category text not null default '',
  service_date date,
  quantity numeric(10, 2) not null default 0,
  unit_price numeric(10, 2) not null default 0,
  line_amount numeric(12, 2) not null default 0,
  line_description text not null default '',
  validation_status text not null default 'pass',
  validation_message text not null default ''
);

create index if not exists invoice_client_id_idx on public.invoice (client_id);
create index if not exists invoice_period_idx on public.invoice (period_start, period_end);
create index if not exists invoice_line_invoice_id_idx on public.invoice_line (invoice_id);
create unique index if not exists invoice_line_timesheet_line_uidx
  on public.invoice_line (timesheet_line_id)
  where timesheet_line_id is not null and timesheet_line_id <> '';

comment on table public.invoice is 'Participant invoice for plan-managed or self-managed NDIS billing.';
comment on table public.invoice_line is 'Invoice line linked to verified timesheet line.';
