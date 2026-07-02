-- Event-driven mobile push preferences

alter table public.app_push_subscription
  add column if not exists notify_critical_shifts boolean not null default true,
  add column if not exists notify_rostering_replies boolean not null default true;
