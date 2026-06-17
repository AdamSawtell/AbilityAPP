-- Backfill chart_tier from seed map (migration default 5 applied to all rows).

update public.org_position set chart_tier = 0, updated_at = now() where id = 'pos-org-root';

update public.org_position set chart_tier = 1, updated_at = now() where id = 'pos-board';
update public.org_position set chart_tier = 2, updated_at = now() where id in ('pos-board-1', 'pos-board-2', 'pos-board-3', 'pos-board-4');
update public.org_position set chart_tier = 3, updated_at = now() where id = 'pos-ceo';
update public.org_position set chart_tier = 4, updated_at = now()
  where id in ('pos-exec-ops', 'pos-exec-hr', 'pos-exec-finance', 'pos-exec-ict', 'pos-exec-quality');
update public.org_position set chart_tier = 5, updated_at = now()
  where id in (
    'pos-gm-ops', 'pos-rostering-manager', 'pos-coordinator', 'pos-intake', 'pos-plan-dev',
    'pos-hr-manager', 'pos-hr-officer', 'pos-finance-manager', 'pos-contracts', 'pos-finance-officer',
    'pos-ict-manager', 'pos-ict-officer', 'pos-quality-manager', 'pos-quality-officer', 'pos-rostering-officer'
  );
update public.org_position set chart_tier = 6, updated_at = now() where id like 'pos-team-%';
update public.org_position set chart_tier = 7, updated_at = now()
  where id like 'pos-sw-%' or id = 'pos-support-worker';
