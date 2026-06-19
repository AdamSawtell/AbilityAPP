-- Demo employment contract PDFs for My Workplace viewers.

insert into public.employee_document (
  id, employee_id, line_no, document_type, name, document_ref, issue_date, expiry_date, status, notes, staff_visible, requires_acknowledgement
)
values
  (
    'doc-gab-contract',
    'emp-gabriela',
    1,
    'Employment contract',
    'Part-time employment agreement',
    'https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf',
    '2020-06-15',
    null,
    'Current',
    '',
    true,
    true
  ),
  (
    'emp-doc-sw-001-contract',
    'emp-sw-001',
    1,
    'Employment contract',
    'Casual employment agreement',
    'https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf',
    '2024-03-01',
    null,
    'Current',
    'Review terms and acknowledge in My workplace.',
    true,
    true
  )
on conflict (id) do update set
  document_ref = excluded.document_ref,
  staff_visible = excluded.staff_visible,
  requires_acknowledgement = excluded.requires_acknowledgement,
  name = excluded.name;

update public.employee_document
set document_ref = 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf',
    staff_visible = true,
    requires_acknowledgement = true
where id = 'emp-doc-sw-001-contract';
