-- Document platform D7 — extended templates (enquiry, remittance, participant statement, board report)

insert into public.app_document_template (
  id, name, description, document_class, active, is_default, title_text, footer_text, created_by, updated_by
)
values
  (
    'denquiry-ack-v1',
    'Enquiry acknowledgement',
    'Acknowledgement letter for new NDIS enquiries.',
    'enquiry-letter',
    true,
    true,
    'Enquiry acknowledgement',
    '',
    'SuperUser',
    'SuperUser'
  ),
  (
    'dremittance-cover-v1',
    'Remittance advice cover',
    'Cover sheet listing invoices included in a remittance or month-end billing run.',
    'remittance-cover',
    true,
    true,
    'Remittance advice',
    '',
    'SuperUser',
    'SuperUser'
  ),
  (
    'dparticipant-statement-v1',
    'Participant service statement',
    'Summary of services and invoices for a participant over a period.',
    'participant-statement',
    true,
    true,
    'Participant service statement',
    '',
    'SuperUser',
    'SuperUser'
  ),
  (
    'dboard-report-v1',
    'Board report pack',
    'Print wrapper for generated board report packs.',
    'board-report',
    true,
    true,
    'Board report',
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
  ('dtblk-enquiry-header', 'denquiry-ack-v1', 'org-header', 'Organisation header', '', 1, true),
  ('dtblk-enquiry-title', 'denquiry-ack-v1', 'title', 'Document title', 'Enquiry acknowledgement', 2, false),
  ('dtblk-enquiry-parties', 'denquiry-ack-v1', 'parties', 'Recipient', '', 3, false),
  ('dtblk-enquiry-body', 'denquiry-ack-v1', 'rich-text', 'Acknowledgement', '<p>Thank you for contacting {{org.tradingName}}. We have received your enquiry and will respond within two business days.</p>', 4, false),
  ('dtblk-enquiry-footer', 'denquiry-ack-v1', 'org-footer', 'Organisation footer', '', 5, true),
  ('dtblk-remittance-header', 'dremittance-cover-v1', 'org-header', 'Organisation header', '', 1, true),
  ('dtblk-remittance-title', 'dremittance-cover-v1', 'title', 'Document title', 'Remittance advice', 2, false),
  ('dtblk-remittance-lines', 'dremittance-cover-v1', 'line-table', 'Invoice list', '', 3, true),
  ('dtblk-remittance-footer', 'dremittance-cover-v1', 'org-footer', 'Organisation footer', '', 4, true),
  ('dtblk-statement-header', 'dparticipant-statement-v1', 'org-header', 'Organisation header', '', 1, true),
  ('dtblk-statement-title', 'dparticipant-statement-v1', 'title', 'Document title', 'Participant service statement', 2, false),
  ('dtblk-statement-parties', 'dparticipant-statement-v1', 'parties', 'Participant', '', 3, false),
  ('dtblk-statement-lines', 'dparticipant-statement-v1', 'line-table', 'Services summary', '', 4, true),
  ('dtblk-statement-footer', 'dparticipant-statement-v1', 'org-footer', 'Organisation footer', '', 5, true),
  ('dtblk-board-header', 'dboard-report-v1', 'org-header', 'Organisation header', '', 1, true),
  ('dtblk-board-title', 'dboard-report-v1', 'title', 'Document title', 'Board report', 2, false),
  ('dtblk-board-body', 'dboard-report-v1', 'rich-text', 'Report body', '', 3, false),
  ('dtblk-board-footer', 'dboard-report-v1', 'org-footer', 'Organisation footer', '', 4, true)
on conflict (id) do nothing;

insert into public.app_process_document_binding (id, process_id, entity_type, template_id, is_default, allow_user_override)
values
  ('pdb-print-enquiry-ack', 'print-enquiry-acknowledgement', 'enquiry', 'denquiry-ack-v1', true, true),
  ('pdb-print-remittance-cover', 'print-remittance-cover', 'invoice', 'dremittance-cover-v1', true, true),
  ('pdb-print-participant-statement', 'print-participant-statement', 'client', 'dparticipant-statement-v1', true, true),
  ('pdb-print-board-report', 'print-board-report', 'board-report', 'dboard-report-v1', true, true)
on conflict (id) do update set
  template_id = excluded.template_id,
  allow_user_override = excluded.allow_user_override;

insert into public.app_role_process (role_id, process_id)
select r.role_id, p.process_id
from (values ('role-admin'), ('role-coordinator'), ('role-finance-officer'), ('role-finance-manager')) as r(role_id)
cross join (values
  ('print-enquiry-acknowledgement'),
  ('print-remittance-cover'),
  ('print-participant-statement'),
  ('print-board-report'),
  ('send-invoice')
) as p(process_id)
on conflict (role_id, process_id) do nothing;
