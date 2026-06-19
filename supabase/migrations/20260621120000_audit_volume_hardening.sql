-- Audit volume hardening: risk queue, archive, indexes, scheduled cleanup

-- ─── Risk assessment queue (processed by /api/system/audit-maintenance) ─────

create table if not exists public.audit_risk_queue (
  id text primary key,
  audit_type text not null check (audit_type in ('session', 'process', 'ai_query')),
  target_id text not null,
  payload jsonb not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  attempts integer not null default 0,
  last_error text not null default '',
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists audit_risk_queue_pending_idx
  on public.audit_risk_queue (created_at)
  where status = 'pending';

-- ─── Archive before retention purge ──────────────────────────────────────────

create table if not exists public.audit_archive (
  id text primary key,
  record_type text not null,
  source_id text not null,
  archived_at timestamptz not null default now(),
  payload jsonb not null
);

create index if not exists audit_archive_record_type_idx on public.audit_archive (record_type, archived_at desc);
create index if not exists audit_archive_source_id_idx on public.audit_archive (source_id);

-- ─── Composite list indexes ──────────────────────────────────────────────────

create index if not exists process_audit_started_user_idx
  on public.process_audit (started_at desc, user_id);

create index if not exists process_audit_process_started_idx
  on public.process_audit (process_id, started_at desc);

create index if not exists user_session_login_user_idx
  on public.user_session (login_at desc, user_id);

create index if not exists ai_chat_log_created_user_idx
  on public.app_ai_chat_log (created_at desc, user_id);

create index if not exists ai_query_meta_created_idx
  on public.ai_query_audit_meta (created_at desc);

-- Full-text search on AI user messages (investigation search at scale)
create index if not exists app_ai_chat_log_user_message_gin
  on public.app_ai_chat_log using gin (to_tsvector('english', coalesce(user_message, '')));

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table public.audit_risk_queue enable row level security;
alter table public.audit_archive enable row level security;

drop policy if exists audit_risk_queue_all on public.audit_risk_queue;
create policy audit_risk_queue_all on public.audit_risk_queue for all using (true) with check (true);

drop policy if exists audit_archive_all on public.audit_archive;
create policy audit_archive_all on public.audit_archive for all using (true) with check (true);

-- ─── Purge completed risk queue rows older than 7 days (SQL-only maintenance) ─

create extension if not exists pg_cron with schema extensions;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid)
    from cron.job
    where jobname = 'audit-risk-queue-cleanup';

    perform cron.schedule(
      'audit-risk-queue-cleanup',
      '0 3 * * *',
      $job$ delete from public.audit_risk_queue
        where status in ('completed', 'failed')
          and processed_at is not null
          and processed_at < now() - interval '7 days' $job$
    );
  end if;
exception
  when others then
    raise notice 'pg_cron schedule skipped: %', sqlerrm;
end $$;
