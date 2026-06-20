-- Scope-aligned consent status on client consent lines.

alter table public.client_consent
  add column if not exists consent_status text not null default 'Pending';

comment on column public.client_consent.consent_status is
  'Granted | Refused | Pending | Not required | Expired';

-- Align legacy consent type labels with scope vocabulary
update public.client_consent
set consent_type = 'Photography and video'
where consent_type = 'Photo / video';

update public.client_consent
set consent_type = 'Information collection and sharing'
where consent_type = 'Information sharing';

-- Infer status from existing rows
update public.client_consent
set consent_status = 'Refused'
where consent_status = 'Pending'
  and (
    name ilike '%no photo%'
    or name ilike '%not provided%'
    or name ilike '%declined%'
    or name ilike '%refused%'
  );

update public.client_consent
set consent_status = 'Granted'
where consent_status = 'Pending'
  and (
    name ilike '%on file%'
    or name ilike '%signed%'
    or description ilike '%signed%'
  );

-- Demo client Bernadette — photo consent refused
update public.client_consent
set
  consent_type = 'Photography and video',
  consent_status = 'Refused'
where id = 'consent-photo';

-- Ensure core consent placeholders exist for Bern (service + information)
insert into public.client_consent (
  id,
  client_id,
  line_no,
  consent_type,
  consent_status,
  show_as_alert,
  name,
  description,
  valid_from,
  valid_to
)
values
  (
    'consent-bern-service',
    'bp-bern',
    2,
    'Service delivery',
    'Granted',
    'No',
    'Service delivery consent',
    'Participant consented to NDIS support delivery at intake.',
    '2021-01-05',
    null
  ),
  (
    'consent-bern-information',
    'bp-bern',
    3,
    'Information collection and sharing',
    'Granted',
    'No',
    'Information sharing consent',
    'Consent to collect and share information with NDIS and plan manager.',
    '2021-01-05',
    null
  )
on conflict (id) do nothing;

update public.client_consent
set line_no = 1
where id = 'consent-photo' and client_id = 'bp-bern';
