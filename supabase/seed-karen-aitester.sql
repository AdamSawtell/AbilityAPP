-- Karen AiTester — support-worker daily flow test data.
-- Run: npm run supabase:seed-karen
-- Safe to re-run (fixed ids). Sets up a full day on Bernadette Rose (bp-bern) for
-- the automated browser tester to exercise these flows:
--   1 view today's schedule, 2 view client profile, 3 clock on, 4 care plan + risks,
--   5 case note, 6 goal progress, 9 report incident, 10 finish shift + submit timesheet.
-- Flows 7 (medication assistance) and 8 (travel/km) are backlog — no feature yet.
--
-- Login: KarenAiTester / welcome (role Support Worker).
-- Shift dates are relative to the day you run the seed, so re-running keeps two
-- "today" shifts plus two completed days of history — TEST-066 stays valid over time.
-- Reuses an existing KarenAiTester login if one exists (matches on username), otherwise
-- creates a clean emp-karen / user-karen pair. Shift/timesheet/incident rows are attached
-- to whichever employee the KarenAiTester login points at (linked to emp-karen if unset).

-- 1. Ensure a clean employee + login exist on a fresh DB (no-ops if already present).
insert into public.employee (
  id, search_key, business_partner_group, name, first_name, last_name,
  preferred_name, middle_name, email, phone, mobile, job_title, department,
  employment_status, employment_type, start_date, end_date, probation_end_date, confirmation_date, notice_days,
  site_branch, cost_centre, gender, birthday, employee_number, reports_to_id,
  driver_licence_class, driver_licence_expiry, visa_subclass, visa_expiry, work_rights_notes,
  bank_name, bank_bsb, bank_account_number, pay_method, tfn, tax_declaration, super_fund, super_member_number,
  standard_hours_per_week, fte, leave_policy, medical_restrictions_notes, notes, created_by, updated_by
)
values (
  'emp-karen', 'KarAi', 'Employee', 'Karen Aitester', 'Karen', 'Aitester',
  'Karen', '', 'karen.aitester@abilityvua.local', '', '0400 200 200', 'Support Worker', 'Operations',
  'Active', 'Casual', '2023-01-10', null, null, null, null,
  'Glenelg', 'CC-OPS', 'Female', '1990-05-20', 'EMP-2001', 'emp-oliver',
  'C', '2028-06-30', '', null, 'Australian citizen',
  'Commonwealth Bank', '065-000', '20002001', 'Bank', '', 'Tax-free threshold claimed', 'Australian Super', 'AS-20001',
  null, 0, 'Casual — no paid leave accrual', '', 'Karen AiTester automated support-worker test login', 'SuperUser', 'SuperUser'
)
on conflict (id) do nothing;

insert into public.app_user (
  id, username, email, first_name, last_name, phone, active, employee_bp_id, notes
)
values (
  'user-karen', 'KarenAiTester', 'karen.aitester@abilityvua.local', 'Karen', 'Aitester', '', true, 'emp-karen',
  'Karen AiTester automated support-worker test login'
)
on conflict (username) do update set
  active = true,
  -- keep an existing employee link, otherwise link to emp-karen so the session resolves an employee
  employee_bp_id = coalesce(nullif(public.app_user.employee_bp_id, ''), excluded.employee_bp_id);

-- 2. Role + known password for whichever KarenAiTester row exists.
insert into public.app_user_role (user_id, role_id)
select id, 'role-support-worker' from public.app_user where username = 'KarenAiTester'
on conflict do nothing;

update public.app_user
set password = '$2b$10$vSD4b8JZ5h3uer1aEL5vburGk9nznIsOZ6mCIXjMxO7NNomJK1liq' -- welcome
where username = 'KarenAiTester';

-- 3. Attach the day's data to whichever employee the KarenAiTester login points at.
do $$
declare
  v_emp text;
  v_today date := current_date;
  v_d1 date := current_date - 1; -- yesterday (completed)
  v_d2 date := current_date - 2; -- two days ago (completed)
begin
  select coalesce(nullif(employee_bp_id, ''), 'emp-karen') into v_emp
  from public.app_user where username = 'KarenAiTester' limit 1;
  if v_emp is null then v_emp := 'emp-karen'; end if;

  -- Roster shifts: two completed past shifts (history + timesheet source) and two Published today.
  insert into public.roster_shift (
    id, shift_ref, client_id, employee_id, location_id, service_booking_id,
    shift_date, start_time, end_time, shift_type, status, notes,
    checked_in_at, checked_out_at, created_by, updated_by
  )
  values
    ('rs-karen-jun24', 'KAREN-D2', 'bp-bern', v_emp, 'loc-glenelg-sil', 'sb-50145',
      v_d2, '09:00', '15:00', 'Standard', 'Completed', 'Morning SIL support — personal care and breakfast',
      (v_d2 + time '09:03'), (v_d2 + time '15:02'), 'Karen Aitester', 'Karen Aitester'),
    ('rs-karen-jun25', 'KAREN-D1', 'bp-bern', v_emp, 'loc-adelaide-hub', 'sb-50145',
      v_d1, '09:00', '15:00', 'Standard', 'Completed', 'Community access — day hub program',
      (v_d1 + time '09:01'), (v_d1 + time '15:00'), 'Karen Aitester', 'Karen Aitester'),
    ('rs-karen-jun26-am', 'KAREN-TODAY-AM', 'bp-bern', v_emp, 'loc-glenelg-sil', 'sb-50145',
      v_today, '09:00', '15:00', 'Standard', 'Published', 'Morning SIL support — personal care, breakfast, and goals',
      null, null, 'Karen Aitester', 'Karen Aitester'),
    ('rs-karen-jun26-pm', 'KAREN-TODAY-PM', 'bp-bern', v_emp, 'loc-adelaide-hub', 'sb-50145',
      v_today, '15:30', '18:00', 'Standard', 'Published', 'Afternoon community access — bus travel practice (goal 2)',
      null, null, 'Karen Aitester', 'Karen Aitester')
  on conflict (id) do update set
    shift_date = excluded.shift_date,
    status = excluded.status,
    employee_id = excluded.employee_id,
    checked_in_at = excluded.checked_in_at,
    checked_out_at = excluded.checked_out_at,
    updated_by = excluded.updated_by;

  -- Draft timesheet for the two completed shifts (so Karen can submit it).
  insert into public.timesheet (
    id, document_no, employee_id, period_start, period_end, status, total_hours, notes,
    payroll_export_status, created_by, updated_by
  )
  values (
    'ts-karen-jun', 'TS-KAREN-JUN', v_emp,
    date_trunc('month', v_today)::date, (date_trunc('month', v_today) + interval '1 month - 1 day')::date,
    'Draft', 12, 'Karen AiTester timesheet — ready to submit', 'Not exported', 'Karen Aitester', 'Karen Aitester'
  )
  on conflict (id) do update set
    employee_id = excluded.employee_id,
    period_start = excluded.period_start,
    period_end = excluded.period_end,
    status = 'Draft',
    total_hours = excluded.total_hours,
    updated_by = excluded.updated_by;

  insert into public.timesheet_line (
    id, timesheet_id, line_no, roster_shift_id, client_id, location_id, service_booking_id,
    shift_date, start_time, end_time, shift_type, hours, notes
  )
  values
    ('tsl-karen-jun-1', 'ts-karen-jun', 1, 'rs-karen-jun24', 'bp-bern', 'loc-glenelg-sil', 'sb-50145',
      v_d2, '09:00', '15:00', 'Standard', 6, ''),
    ('tsl-karen-jun-2', 'ts-karen-jun', 2, 'rs-karen-jun25', 'bp-bern', 'loc-adelaide-hub', 'sb-50145',
      v_d1, '09:00', '15:00', 'Standard', 6, '')
  on conflict (id) do update set
    shift_date = excluded.shift_date,
    hours = excluded.hours,
    roster_shift_id = excluded.roster_shift_id;

  -- Incident history reported by Karen (flow 9 also works create-from-scratch).
  insert into public.incident (
    id, document_no, title, status, severity, category, service_type,
    is_reportable, reportable_type, restrictive_practice_caused_harm,
    occurred_at, aware_at, reported_at, report_deadline_at,
    ndis_notified_at, ndis_notification_ref,
    primary_client_id, primary_employee_id, primary_location_id,
    linked_restrictive_practice_id, manager_reviewed_at, manager_reviewed_by,
    description, immediate_actions, investigation_summary, corrective_actions, lessons_learned,
    created_by, updated_by
  )
  values (
    'inc-karen-1', 'INC-KAREN-1', 'Minor skin graze during shower transfer',
    'Under investigation', 'Low', 'Near miss', 'SIL',
    false, '', false,
    (v_d2 + time '10:15'), (v_d2 + time '10:20'), v_d2, null,
    null, '',
    'bp-bern', v_emp, 'loc-glenelg-sil',
    '', null, '',
    'During an assisted shower transfer Bernie grazed her forearm on the chair arm. Minor; cleaned and dressed, no further care needed.',
    'Cleaned and dressed the graze, reassured Bernie, padded the chair arm.',
    '', '', '',
    'Karen Aitester', 'Karen Aitester'
  )
  on conflict (id) do update set
    status = excluded.status,
    primary_employee_id = excluded.primary_employee_id,
    description = excluded.description,
    updated_by = excluded.updated_by;
end $$;

-- 4. Case notes / activity history on Bernadette (line 1 = seeded act1).
insert into public.client_activity (
  id, client_id, line_no, activity_date, activity_type, subject, description, created_by
)
values
  ('act-karen-1', 'bp-bern', 2, (current_date - 2), 'Case note', 'Morning SIL support',
    'Assisted with personal care and breakfast. Bernie in good spirits. Used Salbutamol puffer once before the community outing.', 'Karen Aitester'),
  ('act-karen-2', 'bp-bern', 3, (current_date - 1), 'Case note', 'Community access',
    'Practised the bus route to the day hub. Bernie anxious boarding but settled quickly. Progress against goal 2 (catch the bus).', 'Karen Aitester'),
  ('act-karen-3', 'bp-bern', 4, (current_date - 3), 'Case note', 'Medication prompt',
    'Reminded Bernie to keep her Salbutamol puffer accessible during transfers. No issues observed.', 'Karen Aitester')
on conflict (id) do update set
  description = excluded.description,
  subject = excluded.subject;

-- 5. Goal progress history against goal-1 (transfers).
insert into public.support_plan_goal_progress_review (
  id, goal_id, line_no, progress_review_type, review_date, goal_progress, progress_taken, receiver_feeling, next_steps, created_by, updated_by
)
values (
  'gpr-karen-goal1', 'goal-1', 1, 'Weekly progress note', (current_date - 2), 'Improving',
  'Bernie completed two assisted wheelchair-to-shower-chair transfers with standby support and verbal cues. Upper-arm strength is building.',
  'Positive — proud of the progress.',
  'Continue OT-recommended exercises; trial one transfer with reduced support next week.',
  'Karen Aitester', 'Karen Aitester'
)
on conflict (id) do update set
  goal_progress = excluded.goal_progress,
  next_steps = excluded.next_steps,
  updated_by = excluded.updated_by;
