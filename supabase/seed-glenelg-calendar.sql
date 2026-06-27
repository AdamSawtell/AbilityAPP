-- Glenelg calendar/review demo signals for record calendars and fortnight review.

delete from public.app_task where id like 'task-glen-cal-%';
delete from public.client_activity where id like 'act-glen-cal-%';
delete from public.employee_activity where id like 'emp-act-glen-cal-%';
delete from public.support_location_activity where id like 'loc-act-glen-cal-%';

insert into public.app_task (
  id, document_no, title, description, status, action_type, task_type_id, priority, due_date,
  assignment_type, assignee_user_id, assignee_role_id, entity_type, entity_id, entity_label,
  created_by_user_id, created_by, updated_by, completed_by, completed_at, resolution_notes, updates
) values
  (
    'task-glen-cal-bern-med-review',
    'REQ-GLEN-001',
    'Confirm epilepsy medication plan for Glenelg fortnight',
    'Calendar demo task linked to Bernadette Rose for the next Glenelg SIL roster cycle.',
    'Open', 'Review', 'tt-review', 'High', '2026-06-29',
    'role', null, 'role-rostering-manager', 'client', 'bp-bern', 'Bern — Bernadette Rose',
    'user-superuser', 'Super User', 'Super User', '', null, '',
    '[{"id":"tu-glen-cal-1","at":"2026-06-27T09:00:00.000Z","byUserId":"user-superuser","byName":"Super User","action":"created","summary":"Created for Glenelg calendar smoke","detail":"Confirm epilepsy medication handover before rollover review."}]'::jsonb
  ),
  (
    'task-glen-cal-jason-supervision',
    'REQ-GLEN-002',
    'Jason Brown fortnight supervision check-in',
    'Calendar demo task linked to Jason Brown for employee calendar review.',
    'In progress', 'Check', 'tt-check', 'Normal', '2026-07-02',
    'user', 'user-isla', null, 'employee', 'emp-jason-brown', 'Jason Brown',
    'user-superuser', 'Super User', 'Isla Robinson', '', null, '',
    '[{"id":"tu-glen-cal-2","at":"2026-06-27T09:00:00.000Z","byUserId":"user-superuser","byName":"Super User","action":"created","summary":"Created for Glenelg calendar smoke","detail":"Check roster load and sleepover fatigue risks."}]'::jsonb
  ),
  (
    'task-glen-cal-location-fire-drill',
    'REQ-GLEN-003',
    'Glenelg SIL House fire drill roster check',
    'Calendar demo task linked to Glenelg SIL House for location calendar review.',
    'Open', 'Check', 'tt-check', 'Normal', '2026-07-06',
    'role', null, 'role-rostering-manager', 'location', 'loc-glenelg-sil', 'GLEN-SIL — Glenelg SIL House',
    'user-superuser', 'Super User', 'Super User', '', null, '',
    '[{"id":"tu-glen-cal-3","at":"2026-06-27T09:00:00.000Z","byUserId":"user-superuser","byName":"Super User","action":"created","summary":"Created for Glenelg calendar smoke","detail":"Coordinate fire drill coverage with live roster."}]'::jsonb
  );

insert into public.client_activity (id, client_id, line_no, activity_date, activity_type, subject, description, created_by)
values
  ('act-glen-cal-bern-1', 'bp-bern', 91, '2026-06-30', 'Case note', 'Fortnight roster preference check', 'Bernie prefers Jason on Wednesday morning and Noah on Monday morning where possible.', 'Isla Robinson'),
  ('act-glen-cal-marcus-1', 'cli-glen-marcus', 92, '2026-07-01', 'Behaviour support', 'Evening routine review', 'Marcus responds well to a quiet transition after dinner before the PM shift handover.', 'Isla Robinson'),
  ('act-glen-cal-priya-1', 'cli-glen-priya', 93, '2026-07-03', 'Health', 'Seizure plan handover', 'Confirm night staff have read the updated epilepsy response notes.', 'Isla Robinson');

insert into public.employee_activity (id, employee_id, line_no, activity_date, activity_type, subject, description, created_by)
values
  ('emp-act-glen-cal-jason-1', 'emp-jason-brown', 51, '2026-07-02', 'Supervision', 'Fortnight roster load check', 'Reviewed 30-hour target and sleepover recovery time with Jason.', 'Ivy Reed');

insert into public.support_location_activity (id, location_id, line_no, activity_date, activity_type, subject, description, created_by)
values
  ('loc-act-glen-cal-1', 'loc-glenelg-sil', 51, '2026-07-06', 'Site visit', 'Fortnight roster review', 'Reviewed live roster coverage, fire drill timing, and day-program transport handover.', 'Ivy Reed');
