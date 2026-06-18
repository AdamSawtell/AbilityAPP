-- Repair demo employee credentials wiped by earlier full-record saves from My workplace

insert into public.employee_credential (
  id, employee_id, line_no, credential_type, credential_number, issuing_body,
  issue_date, expiry_date, status, document_ref, notes, created_by, updated_by
)
select v.id, v.employee_id, v.line_no, v.credential_type, v.credential_number, v.issuing_body,
  v.issue_date::date, v.expiry_date::date, v.status, v.document_ref, v.notes, v.created_by, v.updated_by
from (
  values
    ('cred-isla-wwcc', 'emp-isla', 1, 'Working with Children Check', 'WWCC-88421', 'SA Department for Education', '2023-04-01', '2028-04-01', 'Current', 'DOC-WWCC-88421', '', 'SuperUser', 'SuperUser'),
    ('cred-isla-ndis', 'emp-isla', 2, 'NDIS Worker Screening', 'NDIS-WS-442901', 'NDIS Worker Screening Unit', '2022-11-15', '2027-11-15', 'Current', 'DOC-NDIS-442901', '', 'SuperUser', 'SuperUser')
) as v(id, employee_id, line_no, credential_type, credential_number, issuing_body, issue_date, expiry_date, status, document_ref, notes, created_by, updated_by)
where exists (select 1 from public.employee e where e.id = v.employee_id)
and not exists (select 1 from public.employee_credential c where c.id = v.id);
