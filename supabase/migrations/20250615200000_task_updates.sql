-- Task activity updates stored as JSON on each task row

alter table public.app_task
  add column if not exists updates jsonb not null default '[]'::jsonb;
