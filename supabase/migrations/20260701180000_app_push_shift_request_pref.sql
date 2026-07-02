-- Open shift request status push preference

alter table public.app_push_subscription
  add column if not exists notify_shift_requests boolean not null default true;
