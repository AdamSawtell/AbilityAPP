-- Mock incident records for dashboard / analytics testing
-- Re-run: npx supabase db query --linked -f supabase/seed-incidents.sql
-- Requires: seed-entities, seed-employees, seed-locations applied first

delete from public.incident_notification where incident_id like 'inc-100000%';
delete from public.incident_action where incident_id like 'inc-100000%';
delete from public.incident_party where incident_id like 'inc-100000%';
delete from public.incident_evidence where incident_id like 'inc-100000%';
delete from public.incident where id like 'inc-100000%';

insert into public.incident (
  id, document_no, title, status, severity, category, service_type,
  is_reportable, reportable_type, restrictive_practice_caused_harm,
  occurred_at, aware_at, reported_at, report_deadline_at,
  ndis_notified_at, ndis_notification_ref,
  primary_client_id, primary_employee_id, primary_location_id,
  linked_restrictive_practice_id, manager_reviewed_at, manager_reviewed_by,
  description, immediate_actions, investigation_summary, corrective_actions, lessons_learned,
  created_by, updated_by
) values
  (
    'inc-1000001', 'INC-1000001', 'Minor slip in day program kitchen',
    'Under investigation', 'Low', 'Near miss', 'SIL',
    false, '', false,
    '2026-06-10T10:30:00+00', '2026-06-10T10:45:00+00', '2026-06-10', null,
    null, '',
    'bp-bern', 'emp-isla', 'loc-glenelg-sil',
    '', null, '',
    'Participant slipped on a wet floor near the kitchenette. No injury; first aid not required. Floor had just been mopped without signage.',
    'Area cordoned, wet floor sign placed, participant checked and comforted.',
    'Reviewing cleaning roster and signage procedure with site lead.',
    'Update mop schedule to avoid peak meal times.', '',
    'SuperUser', 'Isla Robinson'
  ),
  (
    'inc-1000002', 'INC-1000002', 'Participant missed transport connection',
    'Closed', 'Low', 'Operational', 'Transport',
    false, '', false,
    '2026-05-18T08:15:00+00', '2026-05-18T08:20:00+00', '2026-05-18', null,
    null, '',
    null, 'emp-oliver', 'loc-adelaide-hub',
    '', '2026-05-20T14:00:00+00', 'Michael Smith',
    'Day program participant arrived late to hub; missed scheduled community transport by 12 minutes.',
    'Staff arranged taxi at provider cost; participant attended afternoon activity.',
    'Roster reviewed. No harm; participant satisfied with resolution.',
    'Earlier check-in call added for transport days.', 'Confirm transport bookings night prior.',
    'Isla Robinson', 'SuperUser'
  ),
  (
    'inc-1000003', 'INC-1000003', 'Fall from wheelchair — skin tear',
    'Submitted', 'High', 'Injury', 'SIL',
    true, 'Serious injury', false,
    '2026-06-01T16:45:00+00', '2026-06-01T16:50:00+00', '2026-06-01', '2026-06-02T16:50:00+00',
    null, '',
    'bp-bern', 'emp-gabriela', 'loc-glenelg-sil',
    '', null, '',
    'While transferring to bed, participant slid from slide board; small skin tear on elbow. First aid applied.',
    'First aid, GP appointment booked, family notified by phone.',
    '', '', '',
    'Gabriela Wilson', 'Gabriela Wilson'
  ),
  (
    'inc-1000004', 'INC-1000004', 'Verbal aggression between housemates',
    'Under investigation', 'Medium', 'Behaviour', 'SIL',
    false, '', false,
    '2026-05-28T19:10:00+00', '2026-05-28T19:15:00+00', '2026-05-29', null,
    null, '',
    'bp-bern', 'emp-isla', 'loc-glenelg-sil',
    '', '2026-05-30T09:00:00+00', 'Michael Smith',
    'Raised voices during evening TV; one participant threw remote (no contact). Staff de-escalated within 5 minutes.',
    'Separated participants, completed behaviour notes, manager notified.',
    'Behaviour support practitioner engaged; house meeting scheduled.',
    'Review evening routine and shared space rules.', '',
    'Isla Robinson', 'Isla Robinson'
  ),
  (
    'inc-1000005', 'INC-1000005', 'Second behaviour incident — same week',
    'Actions in progress', 'Medium', 'Behaviour', 'SIL',
    false, '', false,
    '2026-06-02T20:30:00+00', '2026-06-02T20:35:00+00', '2026-06-03', null,
    null, '',
    'bp-bern', 'emp-gabriela', 'loc-glenelg-sil',
    '', '2026-06-03T08:30:00+00', 'Michael Smith',
    'Follow-up incident: participant refused medication and swore at staff. No physical contact.',
    'Medication deferred per PRN plan; on-call coordinator contacted.',
    'BSP review in progress; temporary increased staffing on evenings.',
    '', '',
    'Gabriela Wilson', 'Isla Robinson'
  ),
  (
    'inc-1000006', 'INC-1000006', 'Unauthorised chemical restraint — PR review',
    'Commission notified', 'Critical', 'Restrictive practice', 'SIL',
    true, 'Unauthorised restrictive practice', true,
    '2026-05-10T14:00:00+00', '2026-05-10T15:30:00+00', '2026-05-10', '2026-05-11T15:30:00+00',
    '2026-05-11T10:00:00+00', 'NDIS-REF-2026-00482',
    'bp-bern', 'emp-isla', 'loc-glenelg-sil',
    '', '2026-05-10T18:00:00+00', 'Michael Smith',
    'PRN medication administered without completing behaviour support plan checklist. No physical harm; participant drowsy 2 hours.',
    'Ceased shift for staff pending review; participant monitored; GP clearance obtained.',
    'Commission notified within 24h. Internal RP audit commenced.',
    'Mandatory RP refresher for all SIL staff.', 'Never administer PRN without authorised plan step.',
    'Isla Robinson', 'SuperUser'
  ),
  (
    'inc-1000007', 'INC-1000007', 'Vehicle minor bumper contact in car park',
    'Draft', 'Low', 'Property damage', 'Transport',
    false, '', false,
    '2026-06-14T11:00:00+00', '2026-06-14T11:05:00+00', '2026-06-14', null,
    null, '',
    null, 'emp-oliver', 'loc-adelaide-hub',
    '', null, '',
    'Support vehicle reversed into bollard at day hub; cosmetic damage to bumper only. No injuries.',
    'Vehicle taken out of service; incident photos taken.',
    '', '', '',
    'Oliver Williams', 'Oliver Williams'
  ),
  (
    'inc-1000008', 'INC-1000008', 'Allegation of rough handling during transfer',
    'Manager reviewed', 'High', 'Behaviour', 'Community Participation',
    true, 'Abuse or neglect', false,
    '2026-04-20T13:00:00+00', '2026-04-20T16:00:00+00', '2026-04-21', '2026-04-21T16:00:00+00',
    null, '',
    'bp-bern', 'emp-oliver', 'loc-adelaide-hub',
    '', '2026-04-22T11:00:00+00', 'Michael Smith',
    'Family member reported participant appeared distressed after community outing. No visible injuries.',
    'Staff stood down from client roster pending investigation; welfare check completed.',
    'CCTV from vehicle unavailable. Staff interview and witness statements collected.',
    '', '',
    'Isla Robinson', 'Michael Smith'
  ),
  (
    'inc-1000009', 'INC-1000009', 'Broken window in activity room',
    'Closed', 'Medium', 'Property damage', 'Community Participation',
    false, '', false,
    '2026-03-15T15:45:00+00', '2026-03-15T15:50:00+00', '2026-03-16', null,
    null, '',
    null, 'emp-michael', 'loc-adelaide-hub',
    '', '2026-03-17T09:00:00+00', 'Michael Smith',
    'Participant accidentally struck window with mobility aid during activity. Glass contained; area cleared.',
    'Area isolated; glazier attended same day; incident report to landlord.',
    'Completed. Replacement safety film applied to lower panes.',
    'Activity layout adjusted to widen pathways.', 'Use portable screens near glass walls.',
    'Michael Smith', 'SuperUser'
  ),
  (
    'inc-1000010', 'INC-1000010', 'Medication signing error — wrong chart',
    'Closed', 'Medium', 'Operational', 'NDIS Support',
    false, '', false,
    '2026-06-08T07:30:00+00', '2026-06-08T07:35:00+00', '2026-06-08', null,
    null, '',
    'bp-bern', 'emp-gabriela', 'loc-glenelg-sil',
    '', '2026-06-08T12:00:00+00', 'Isla Robinson',
    'Staff signed evening dose on morning chart in error. Dose not given twice; pharmacist confirmed no double dose.',
    'RN contacted; medication chart corrected; participant monitored.',
    'Medication competency refresh completed with staff.',
    'Two-person check for chart changes introduced.', 'Label charts with AM/PM colour tabs.',
    'Gabriela Wilson', 'SuperUser'
  )
on conflict (id) do update set
  document_no = excluded.document_no,
  title = excluded.title,
  status = excluded.status,
  severity = excluded.severity,
  category = excluded.category,
  service_type = excluded.service_type,
  is_reportable = excluded.is_reportable,
  reportable_type = excluded.reportable_type,
  occurred_at = excluded.occurred_at,
  aware_at = excluded.aware_at,
  reported_at = excluded.reported_at,
  report_deadline_at = excluded.report_deadline_at,
  ndis_notified_at = excluded.ndis_notified_at,
  primary_client_id = excluded.primary_client_id,
  primary_employee_id = excluded.primary_employee_id,
  primary_location_id = excluded.primary_location_id,
  description = excluded.description,
  investigation_summary = excluded.investigation_summary,
  updated_by = excluded.updated_by;

insert into public.incident_party (id, incident_id, line_no, party_type, entity_id, party_name, role_in_incident, notes) values
  ('ip-1000001-1', 'inc-1000001', 1, 'Client', 'bp-bern', '', 'Affected person', ''),
  ('ip-1000001-2', 'inc-1000001', 2, 'Employee', 'emp-isla', '', 'Staff on duty', 'Responded immediately'),
  ('ip-1000003-1', 'inc-1000003', 1, 'Client', 'bp-bern', '', 'Affected person', 'Skin tear left elbow'),
  ('ip-1000003-2', 'inc-1000003', 2, 'Employee', 'emp-gabriela', '', 'Staff on duty', 'Assisted transfer'),
  ('ip-1000003-3', 'inc-1000003', 3, 'Witness', '', 'Housemate', 'Witness', 'Heard call for help'),
  ('ip-1000004-1', 'inc-1000004', 1, 'Client', 'bp-bern', '', 'Involved', ''),
  ('ip-1000005-1', 'inc-1000005', 1, 'Client', 'bp-bern', '', 'Involved', 'Repeat behaviour week'),
  ('ip-1000006-1', 'inc-1000006', 1, 'Client', 'bp-bern', '', 'Affected person', ''),
  ('ip-1000006-2', 'inc-1000006', 2, 'Employee', 'emp-isla', '', 'Staff on duty', 'Administered PRN'),
  ('ip-1000008-1', 'inc-1000008', 1, 'Client', 'bp-bern', '', 'Affected person', ''),
  ('ip-1000008-2', 'inc-1000008', 2, 'Employee', 'emp-oliver', '', 'Staff on duty', 'Under investigation'),
  ('ip-1000010-1', 'inc-1000010', 1, 'Client', 'bp-bern', '', 'Affected person', 'No harm')
on conflict (id) do nothing;

insert into public.incident_action (id, incident_id, line_no, action_date, action_type, description, evidence_ref, owner, outcome) values
  ('ia-1000001-1', 'inc-1000001', 1, '2026-06-10', 'Immediate response', 'Cordoned area and placed signage', 'Site log #442', 'Isla Robinson', 'Area made safe'),
  ('ia-1000003-1', 'inc-1000003', 1, '2026-06-01', 'First aid', 'Cleaned and dressed skin tear', 'First aid register', 'Gabriela Wilson', 'GP review booked'),
  ('ia-1000006-1', 'inc-1000006', 1, '2026-05-10', 'Immediate response', 'Participant monitored; GP called', 'Clinical notes', 'Isla Robinson', 'Stable vitals'),
  ('ia-1000006-2', 'inc-1000006', 2, '2026-05-11', 'Corrective action', 'RP refresher scheduled for SIL team', 'Training calendar', 'Michael Smith', 'Scheduled'),
  ('ia-1000009-1', 'inc-1000009', 1, '2026-03-16', 'Immediate response', 'Glazier engaged; area secured', 'Invoice #9921', 'Michael Smith', 'Window replaced'),
  ('ia-1000010-1', 'inc-1000010', 1, '2026-06-08', 'Clinical review', 'RN verified no double dose', 'Medication chart', 'Isla Robinson', 'No adverse effect')
on conflict (id) do nothing;

insert into public.incident_notification (id, incident_id, line_no, notified_at, notify_target, method, notified_by, reference, notes) values
  ('in-1000006-1', 'inc-1000006', 1, '2026-05-11T10:00:00+00', 'NDIS Quality and Safeguards Commission', 'NDIS portal', 'Michael Smith', 'NDIS-REF-2026-00482', 'Initial notification submitted'),
  ('in-1000006-2', 'inc-1000006', 2, '2026-05-10T17:00:00+00', 'Participant family', 'Phone', 'Isla Robinson', '', 'Mother informed'),
  ('in-1000003-1', 'inc-1000003', 1, '2026-06-01T17:30:00+00', 'Participant family', 'Phone', 'Gabriela Wilson', '', 'Family notified of minor injury'),
  ('in-1000008-1', 'inc-1000008', 1, '2026-04-21T09:00:00+00', 'Internal — Quality manager', 'Email', 'Isla Robinson', '', 'Investigation commenced')
on conflict (id) do nothing;
