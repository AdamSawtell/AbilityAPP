-- Client lifecycle aligned with scope Stage 1 (Intake → Onboarding → Active → Plan review → Exit).
-- Keeps existing `status` column for AbilityERP parity.

alter table public.client
  add column if not exists lifecycle_status text not null default 'intake',
  add column if not exists plan_review_due_date date,
  add column if not exists lifecycle_exit_reason text not null default '';

comment on column public.client.lifecycle_status is
  'Scope lifecycle: intake | onboarding | active | plan_review | exit';
comment on column public.client.plan_review_due_date is
  'Next plan review date when lifecycle_status is plan_review or active monitoring';
comment on column public.client.lifecycle_exit_reason is
  'Reason when lifecycle_status is exit (transition, withdrawal, deceased, etc.)';

-- Backfill from legacy AbilityERP status values
update public.client
set lifecycle_status = case
  when status ilike '%deceased%' or status ilike '%inactive%' or status ilike '%exiting%' then 'exit'
  when status ilike '%active%' then 'active'
  when status ilike '%prospect%' then 'intake'
  else 'intake'
end
where lifecycle_status = 'intake';

-- Sample client Bernadette Rose — active receiving support
update public.client
set lifecycle_status = 'active'
where id = 'bp-bern' and status ilike '%active%';
