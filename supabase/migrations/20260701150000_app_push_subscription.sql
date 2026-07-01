-- AB-0004 Phase C — web push subscriptions for employee mobile PWA

create table if not exists public.app_push_subscription (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  employee_id text references public.employee (id) on delete set null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  device_label text not null default '',
  notify_shift_changes boolean not null default true,
  notify_credentials boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (endpoint)
);

create index if not exists app_push_subscription_user_idx
  on public.app_push_subscription (user_id, active);

create index if not exists app_push_subscription_employee_idx
  on public.app_push_subscription (employee_id, active);

comment on table public.app_push_subscription is 'Web push endpoints for employee mobile PWA (one row per browser/device).';

create table if not exists public.mobile_push_log (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  push_type text not null,
  dedupe_key text not null,
  sent_at timestamptz not null default now(),
  unique (user_id, push_type, dedupe_key)
);

create index if not exists mobile_push_log_sent_idx
  on public.mobile_push_log (sent_at desc);

comment on table public.mobile_push_log is 'Idempotent log for scheduled mobile push notifications.';
