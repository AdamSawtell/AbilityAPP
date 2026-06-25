-- AB-0021 - Training and meeting scheduling: roster-visible sessions, costing, attendance sign-off

alter table public.roster_shift
  add column if not exists training_session_group_id text not null default '',
  add column if not exists session_title text not null default '',
  add column if not exists session_category text not null default '',
  add column if not exists cost_allocation text not null default 'non_billable',
  add column if not exists cost_centre text not null default '',
  add column if not exists estimated_hourly_cost numeric not null default 0,
  add column if not exists attendance_status text not null default 'Scheduled',
  add column if not exists attendance_signed_off_at timestamptz,
  add column if not exists attendance_signed_off_by text not null default '';

create index if not exists roster_shift_training_group_idx on public.roster_shift (training_session_group_id);
create index if not exists roster_shift_cost_centre_idx on public.roster_shift (cost_centre);

comment on column public.roster_shift.training_session_group_id is 'Shared id tying one group training or meeting session across attendee roster rows.';
comment on column public.roster_shift.session_title is 'Training or meeting title displayed on workforce schedules.';
comment on column public.roster_shift.session_category is 'Internal training | external training | compliance | staff meeting | client-facing training.';
comment on column public.roster_shift.cost_allocation is 'billable | non_billable | admin_costed for management cost reporting.';
comment on column public.roster_shift.cost_centre is 'Cost centre used for training and meeting cost reporting.';
comment on column public.roster_shift.estimated_hourly_cost is 'Planning estimate per attendee hour; payroll remains external.';
comment on column public.roster_shift.attendance_status is 'Scheduled | Attended | Did not attend | Excused.';

insert into public.roster_shift (
  id, shift_ref, client_id, employee_id, location_id, service_booking_id,
  shift_date, start_time, end_time, shift_type, status, notes,
  training_session_group_id, session_title, session_category, cost_allocation, cost_centre,
  estimated_hourly_cost, attendance_status, attendance_signed_off_at, attendance_signed_off_by,
  shift_purpose, billing_classification, pay_status, primary_roster_shift_id, buddy_reason,
  created_by, updated_by
) values
  (
    'rs-train-manual-isla',
    'TRN-MANUAL-ISLA',
    null,
    'emp-isla',
    'loc-glenelg-sil',
    null,
    '2025-10-09',
    '10:00',
    '12:00',
    'Training',
    'Published',
    'Manual handling refresher group session.',
    'tsg-manual-2025-10-09',
    'Manual handling refresher',
    'Mandatory compliance',
    'admin_costed',
    'Training',
    48,
    'Scheduled',
    null,
    '',
    'training_session',
    'admin_costed',
    'payable',
    null,
    '',
    'Riley Shaw',
    'Riley Shaw'
  ),
  (
    'rs-train-manual-gabriela',
    'TRN-MANUAL-GAB',
    null,
    'emp-gabriela',
    'loc-glenelg-sil',
    null,
    '2025-10-09',
    '10:00',
    '12:00',
    'Training',
    'Published',
    'Manual handling refresher group session.',
    'tsg-manual-2025-10-09',
    'Manual handling refresher',
    'Mandatory compliance',
    'admin_costed',
    'Training',
    48,
    'Scheduled',
    null,
    '',
    'training_session',
    'admin_costed',
    'payable',
    null,
    '',
    'Riley Shaw',
    'Riley Shaw'
  )
on conflict (id) do update set
  training_session_group_id = excluded.training_session_group_id,
  session_title = excluded.session_title,
  session_category = excluded.session_category,
  cost_allocation = excluded.cost_allocation,
  cost_centre = excluded.cost_centre,
  estimated_hourly_cost = excluded.estimated_hourly_cost,
  attendance_status = excluded.attendance_status,
  shift_purpose = excluded.shift_purpose,
  billing_classification = excluded.billing_classification,
  pay_status = excluded.pay_status,
  notes = excluded.notes;

insert into public.app_role_window (role_id, window_key, access_level)
values
  ('role-admin', 'training-meetings', 'write'),
  ('role-hr-manager', 'training-meetings', 'write'),
  ('role-rostering-manager', 'training-meetings', 'write'),
  ('role-rostering-officer', 'training-meetings', 'write'),
  ('role-team-leader', 'training-meetings', 'write')
on conflict (role_id, window_key) do update set access_level = excluded.access_level;
