-- Service agreement lifecycle timestamps (WP-C.2).

alter table public.service_agreement
  add column if not exists sent_at date,
  add column if not exists signed_at date,
  add column if not exists activated_at date;

comment on column public.service_agreement.sent_at is 'Date agreement was sent to participant for signing.';
comment on column public.service_agreement.signed_at is 'Date agreement was signed.';
comment on column public.service_agreement.activated_at is 'Date agreement became active for service delivery.';
