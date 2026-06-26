-- SuperUser — grant every active workspace role (idempotent).
-- Runtime also grants all roles via web/src/lib/access/superuser.ts.
insert into public.app_user_role (user_id, role_id)
select u.id, r.id
from public.app_user u
cross join public.app_role r
where u.username = 'SuperUser'
  and r.active = true
on conflict do nothing;
