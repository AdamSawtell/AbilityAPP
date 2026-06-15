-- Enquiry activity lines (carry over to client_activity on convert-to-client).

create table if not exists public.enquiry_activity (
  id text primary key,
  enquiry_id text not null references public.enquiry (id) on delete cascade,
  line_no integer not null default 1,
  activity_date date,
  activity_type text not null default '',
  subject text not null default '',
  description text not null default '',
  created_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists enquiry_activity_enquiry_id_idx on public.enquiry_activity (enquiry_id);

drop trigger if exists enquiry_activity_updated_at on public.enquiry_activity;
create trigger enquiry_activity_updated_at
  before update on public.enquiry_activity
  for each row execute function public.set_updated_at();

alter table public.enquiry_activity enable row level security;

drop policy if exists enquiry_activity_select on public.enquiry_activity;
drop policy if exists enquiry_activity_write on public.enquiry_activity;
create policy enquiry_activity_select on public.enquiry_activity for select to anon, authenticated using (true);
create policy enquiry_activity_write on public.enquiry_activity for all to anon, authenticated using (true) with check (true);
