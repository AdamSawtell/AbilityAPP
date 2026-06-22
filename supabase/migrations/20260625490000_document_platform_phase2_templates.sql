-- Document platform D9 — Phase 2 templates (claim batch, incident notification, audit pack, consent schedule, HR separation)

insert into public.app_document_template (
  id, name, description, document_class, active, is_default, title_text, footer_text, created_by, updated_by
)
values
  (
    'dclaim-batch-v1',
    'NDIS claim batch summary',
    'Cover sheet and line summary for an NDIS claim batch before or after gateway submission.',
    'claim-batch-summary',
    true,
    true,
    'Claim batch summary',
    '',
    'SuperUser',
    'SuperUser'
  ),
  (
    'dincident-notification-v1',
    'Incident notification letter',
    'Formal notification letter scaffold for participant, nominee, or regulator contact.',
    'incident-notification-letter',
    true,
    true,
    'Incident notification',
    '',
    'SuperUser',
    'SuperUser'
  ),
  (
    'daudit-pack-v1',
    'NDIS audit pack report',
    'Printable compliance readiness report for a selected audit month.',
    'audit-pack-report',
    true,
    true,
    'NDIS audit pack',
    '',
    'SuperUser',
    'SuperUser'
  ),
  (
    'dconsent-schedule-v1',
    'Consent and information sharing schedule',
    'Schedule of participant consents and information sharing permissions.',
    'consent-schedule',
    true,
    true,
    'Consent and information sharing schedule',
    '',
    'SuperUser',
    'SuperUser'
  ),
  (
    'dhr-letter-separation-v1',
    'Separation letter',
    'Letter confirming employment separation and final obligations.',
    'hr-letter-separation',
    true,
    true,
    'Separation letter',
    '',
    'SuperUser',
    'SuperUser'
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  document_class = excluded.document_class,
  active = excluded.active,
  is_default = excluded.is_default,
  title_text = excluded.title_text;

insert into public.app_document_template_block (id, template_id, block_type, label, content_html, sort_order, locked)
values
  ('dtblk-claim-header', 'dclaim-batch-v1', 'org-header', 'Organisation header', '', 1, true),
  ('dtblk-claim-title', 'dclaim-batch-v1', 'title', 'Document title', 'Claim batch summary', 2, false),
  ('dtblk-claim-meta', 'dclaim-batch-v1', 'metadata', 'Batch details', '', 3, false),
  ('dtblk-claim-lines', 'dclaim-batch-v1', 'line-table', 'Claim lines', '', 4, true),
  ('dtblk-claim-footer', 'dclaim-batch-v1', 'org-footer', 'Organisation footer', '', 5, true),
  ('dtblk-incident-header', 'dincident-notification-v1', 'org-header', 'Organisation header', '', 1, true),
  ('dtblk-incident-title', 'dincident-notification-v1', 'title', 'Document title', 'Incident notification', 2, false),
  ('dtblk-incident-parties', 'dincident-notification-v1', 'parties', 'Recipient', '', 3, false),
  ('dtblk-incident-body', 'dincident-notification-v1', 'rich-text', 'Notification', '<p>This letter confirms notification regarding the incident referenced below. {{org.tradingName}} is committed to participant safety and will keep you informed as the matter is managed.</p>', 4, false),
  ('dtblk-incident-footer', 'dincident-notification-v1', 'org-footer', 'Organisation footer', '', 5, true),
  ('dtblk-audit-header', 'daudit-pack-v1', 'org-header', 'Organisation header', '', 1, true),
  ('dtblk-audit-title', 'daudit-pack-v1', 'title', 'Document title', 'NDIS audit pack', 2, false),
  ('dtblk-audit-body', 'daudit-pack-v1', 'rich-text', 'Readiness summary', '', 3, false),
  ('dtblk-audit-footer', 'daudit-pack-v1', 'org-footer', 'Organisation footer', '', 4, true),
  ('dtblk-consent-header', 'dconsent-schedule-v1', 'org-header', 'Organisation header', '', 1, true),
  ('dtblk-consent-title', 'dconsent-schedule-v1', 'title', 'Document title', 'Consent and information sharing schedule', 2, false),
  ('dtblk-consent-parties', 'dconsent-schedule-v1', 'parties', 'Participant', '', 3, false),
  ('dtblk-consent-lines', 'dconsent-schedule-v1', 'line-table', 'Consent lines', '', 4, true),
  ('dtblk-consent-footer', 'dconsent-schedule-v1', 'org-footer', 'Organisation footer', '', 5, true),
  ('dtblk-hr-sep-header', 'dhr-letter-separation-v1', 'org-header', 'Organisation header', '', 1, true),
  ('dtblk-hr-sep-title', 'dhr-letter-separation-v1', 'title', 'Document title', 'Separation letter', 2, false),
  ('dtblk-hr-sep-parties', 'dhr-letter-separation-v1', 'parties', 'Recipient', '', 3, false),
  ('dtblk-hr-sep-meta', 'dhr-letter-separation-v1', 'metadata', 'Separation details', '', 4, false),
  ('dtblk-hr-sep-body', 'dhr-letter-separation-v1', 'rich-text', 'Separation terms', '<p>This letter confirms the end of your employment with {{org.tradingName}} and outlines final pay, return of property, and confidentiality obligations.</p>', 5, false),
  ('dtblk-hr-sep-footer', 'dhr-letter-separation-v1', 'org-footer', 'Organisation footer', '', 6, true)
on conflict (id) do nothing;

insert into public.app_process_document_binding (id, process_id, entity_type, template_id, is_default, allow_user_override)
values
  ('pdb-print-claim-batch', 'print-claim-batch', 'claim', 'dclaim-batch-v1', true, true),
  ('pdb-print-incident-notification', 'print-incident-notification', 'incident', 'dincident-notification-v1', true, true),
  ('pdb-print-audit-pack', 'print-audit-pack', 'audit-pack', 'daudit-pack-v1', true, true),
  ('pdb-print-consent-schedule', 'print-consent-schedule', 'client', 'dconsent-schedule-v1', true, true),
  ('pdb-print-employee-separation', 'print-employee-separation', 'employee', 'dhr-letter-separation-v1', true, true)
on conflict (id) do update set
  template_id = excluded.template_id,
  allow_user_override = excluded.allow_user_override;

insert into public.app_role_process (role_id, process_id)
select r.role_id, p.process_id
from (values ('role-admin'), ('role-coordinator'), ('role-finance-officer'), ('role-finance-manager'), ('role-hr-manager'), ('role-hr-officer')) as r(role_id)
cross join (values
  ('print-claim-batch'),
  ('print-incident-notification'),
  ('print-audit-pack'),
  ('print-consent-schedule'),
  ('print-employee-separation')
) as p(process_id)
on conflict (role_id, process_id) do nothing;
