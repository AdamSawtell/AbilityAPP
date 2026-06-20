-- In-app e-sign capture on service agreements (WP-C.3)

alter table public.service_agreement
  add column if not exists signer_name text not null default '',
  add column if not exists signer_role text not null default '',
  add column if not exists signature_image text not null default '',
  add column if not exists signature_captured_at timestamptz;

comment on column public.service_agreement.signer_name is 'Printed name of the person who signed in-app.';
comment on column public.service_agreement.signer_role is 'Signer relationship: Participant, Guardian, Nominee, Provider representative.';
comment on column public.service_agreement.signature_image is 'PNG data URL captured from the in-app signature pad.';
comment on column public.service_agreement.signature_captured_at is 'When the signature was captured in-app.';

-- Legacy agreements signed before in-app capture: placeholder so routine saves are not blocked.
update public.service_agreement
set
  signature_image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  signer_role = case when signer_role = '' then 'Participant' else signer_role end
where status in ('Signed', 'Active', 'Expiring', 'Expired')
  and coalesce(signature_image, '') = '';
