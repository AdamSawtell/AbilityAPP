-- Tighten workforce review access: HR and line managers only (not coordinators or general executives).

delete from public.app_role_process
where process_id in ('review-employee-credential', 'approve-leave-request')
  and role_id in (
    'role-coordinator',
    'role-intake',
    'role-support-worker',
    'role-exec-operations',
    'role-exec-finance',
    'role-exec-ict',
    'role-exec-quality',
    'role-rostering-officer',
    'role-finance-manager',
    'role-finance-officer',
    'role-quality-manager',
    'role-quality-officer',
    'role-ict-manager',
    'role-ict-officer'
  );

insert into public.app_role_process (role_id, process_id)
select r.id, p.process_id
from public.app_role r
cross join (values ('review-employee-credential')) as p(process_id)
where r.id in ('role-ceo', 'role-exec-hr', 'role-hr-manager', 'role-hr-officer')
on conflict do nothing;

insert into public.app_role_process (role_id, process_id)
select r.id, p.process_id
from public.app_role r
cross join (values ('approve-leave-request')) as p(process_id)
where r.id in (
  'role-ceo',
  'role-exec-hr',
  'role-hr-manager',
  'role-hr-officer',
  'role-rostering-manager',
  'role-team-leader'
)
on conflict do nothing;

-- Isla demo contract: viewable PDF URL for My Workplace contract viewer.
update public.employee_document
set
  document_ref = 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf',
  staff_visible = true,
  requires_acknowledgement = true
where id = 'doc-isla-contract';
