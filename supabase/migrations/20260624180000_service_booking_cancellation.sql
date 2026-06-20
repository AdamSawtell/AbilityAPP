-- Service booking cancellation policy fields (WP-B.2).

alter table public.service_booking
  add column if not exists cancellation_notice_days integer not null default 7,
  add column if not exists cancelled_at date,
  add column if not exists cancellation_initiated_by text not null default '',
  add column if not exists cancellation_reason text not null default '',
  add column if not exists cancellation_notes text not null default '';

comment on column public.service_booking.cancellation_notice_days is
  'Minimum clear days notice required before service start (NDIS default 7).';
comment on column public.service_booking.cancelled_at is
  'Date the cancellation was recorded or received.';
comment on column public.service_booking.cancellation_initiated_by is
  'Who initiated cancellation: Participant, Provider, NDIA, Mutual agreement.';
comment on column public.service_booking.cancellation_reason is
  'Reason code from reference data bookingCancellationReason.';
