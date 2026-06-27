-- Roster Sessions v1 — multi-client / multi-worker support on a single live shift.
-- Master RoC lines gain default worker, support ratio, and session grouping key.

alter table public.roster_shift
  add column if not exists session_key text not null default '',
  add column if not exists required_worker_count integer not null default 1;

comment on column public.roster_shift.session_key is 'Groups master/live session lines that publish to the same shift block.';
comment on column public.roster_shift.required_worker_count is 'Minimum workers required for this session block.';

create table if not exists public.roster_shift_client_line (
  id text primary key,
  roster_shift_id text not null references public.roster_shift (id) on delete cascade,
  line_no integer not null default 1,
  client_id text references public.client (id) on delete set null,
  service_booking_id text references public.service_booking (id) on delete set null,
  service_agreement_line_id text,
  support_ratio text not null default '1:1',
  billable_hours numeric,
  notes text not null default ''
);

create index if not exists roster_shift_client_line_parent_idx
  on public.roster_shift_client_line (roster_shift_id);

create table if not exists public.roster_shift_worker_line (
  id text primary key,
  roster_shift_id text not null references public.roster_shift (id) on delete cascade,
  line_no integer not null default 1,
  employee_id text references public.employee (id) on delete set null,
  role_required text not null default '',
  status text not null default 'assigned',
  notes text not null default '',
  checked_in_at timestamptz,
  checked_out_at timestamptz
);

create index if not exists roster_shift_worker_line_parent_idx
  on public.roster_shift_worker_line (roster_shift_id);

comment on table public.roster_shift_client_line is 'Billable client participants on a roster session shift.';
comment on table public.roster_shift_worker_line is 'Paid workers assigned to a roster session shift.';

alter table public.roster_of_care_line
  add column if not exists default_employee_id text references public.employee (id) on delete set null,
  add column if not exists support_ratio text not null default '1:1',
  add column if not exists session_key text not null default '';

comment on column public.roster_of_care_line.default_employee_id is 'Preferred worker on the master roster line.';
comment on column public.roster_of_care_line.support_ratio is 'NDIS group ratio billed for this client on the session (e.g. 1:4).';
comment on column public.roster_of_care_line.session_key is 'Lines with the same key at the same time/location publish to one live session.';

-- Backfill legacy single-client / single-worker shifts into line tables.
insert into public.roster_shift_client_line (
  id, roster_shift_id, line_no, client_id, service_booking_id, support_ratio, notes
)
select
  'rscl-' || rs.id,
  rs.id,
  1,
  rs.client_id,
  rs.service_booking_id,
  '1:1',
  ''
from public.roster_shift rs
where rs.client_id is not null
  and not exists (
    select 1 from public.roster_shift_client_line cl where cl.roster_shift_id = rs.id
  );

insert into public.roster_shift_worker_line (
  id, roster_shift_id, line_no, employee_id, role_required, status, notes, checked_in_at, checked_out_at
)
select
  'rswl-' || rs.id,
  rs.id,
  1,
  rs.employee_id,
  '',
  case when rs.employee_id is null then 'required' else 'assigned' end,
  '',
  rs.checked_in_at,
  rs.checked_out_at
from public.roster_shift rs
where not exists (
  select 1 from public.roster_shift_worker_line wl where wl.roster_shift_id = rs.id
);
