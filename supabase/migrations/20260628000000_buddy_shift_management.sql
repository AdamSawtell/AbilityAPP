-- AB-0022 — Buddy shift management: org pay policy, roster classification, timesheet pay status

alter table public.app_organization
  add column if not exists buddy_shift_pay_policy text not null default 'ask';

comment on column public.app_organization.buddy_shift_pay_policy is
  'always_pay | dont_pay | ask — default pay handling for buddy/orientation roster shifts';

update public.app_organization
set buddy_shift_pay_policy = 'ask'
where buddy_shift_pay_policy is null or buddy_shift_pay_policy = '';

alter table public.roster_shift
  add column if not exists shift_purpose text not null default 'service_delivery',
  add column if not exists billing_classification text not null default 'billable',
  add column if not exists pay_status text not null default 'payable',
  add column if not exists primary_roster_shift_id text references public.roster_shift (id) on delete set null,
  add column if not exists buddy_reason text not null default '';

create index if not exists roster_shift_primary_shift_idx on public.roster_shift (primary_roster_shift_id);
create index if not exists roster_shift_purpose_idx on public.roster_shift (shift_purpose);

comment on column public.roster_shift.shift_purpose is 'service_delivery | buddy_shadow | orientation_training';
comment on column public.roster_shift.billing_classification is 'billable | non_billable_internal_cost';
comment on column public.roster_shift.pay_status is 'payable | non_payable for timesheet and payroll export';

alter table public.timesheet_line
  add column if not exists shift_purpose text not null default 'service_delivery',
  add column if not exists billing_classification text not null default 'billable',
  add column if not exists pay_status text not null default 'payable';

-- Demo buddy shift — Oliver shadows Isla on Bern Monday AM (non-payable, non-billable)
insert into public.roster_shift (
  id, shift_ref, client_id, employee_id, location_id, service_booking_id,
  shift_date, start_time, end_time, shift_type, status, notes,
  shift_purpose, billing_classification, pay_status, primary_roster_shift_id, buddy_reason,
  created_by, updated_by
) values (
  'rs-bern-mon-buddy',
  'BERN-MON-BUDDY',
  'bp-bern',
  'emp-oliver',
  'loc-glenelg-sil',
  'sb-50145',
  '2025-10-06',
  '09:00',
  '15:00',
  'Standard',
  'Published',
  'Buddy shadow — site orientation with Isla on SIL morning',
  'buddy_shadow',
  'non_billable_internal_cost',
  'non_payable',
  'rs-bern-mon-am',
  'New worker site orientation',
  'Riley Shaw',
  'Riley Shaw'
)
on conflict (id) do update set
  shift_purpose = excluded.shift_purpose,
  billing_classification = excluded.billing_classification,
  pay_status = excluded.pay_status,
  primary_roster_shift_id = excluded.primary_roster_shift_id,
  buddy_reason = excluded.buddy_reason,
  notes = excluded.notes;

-- Team Leader can roster buddy shifts (care manager persona)
insert into public.app_role_window (role_id, window_key, access_level)
values ('role-team-leader', 'rostering', 'write')
on conflict (role_id, window_key) do update set access_level = excluded.access_level;
