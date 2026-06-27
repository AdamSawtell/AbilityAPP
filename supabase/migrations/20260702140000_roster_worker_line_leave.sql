-- Leave coverage on roster session worker lines: vacant fill slot + planned leave pay.

alter table public.roster_shift_worker_line
  add column if not exists coverage_role text not null default 'fill',
  add column if not exists leave_request_id text;

comment on column public.roster_shift_worker_line.coverage_role is 'fill = worker covering delivery; leave_pay = planned roster pay for absent worker.';
comment on column public.roster_shift_worker_line.leave_request_id is 'Approved leave request driving leave_pay coverage on this line.';
