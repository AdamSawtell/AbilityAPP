-- Profile photos for clients and employees (parity with support_location.picture_url)

alter table public.client
  add column if not exists picture_url text not null default '';

alter table public.employee
  add column if not exists picture_url text not null default '';

-- Demo portraits from Unsplash (diverse faces — demo data only).
-- bp-bern is intentionally omitted: seed consent alert records no photo consent.

update public.client
set picture_url = 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=320&h=320&fit=crop'
where id = 'bp-bulk-20';

update public.client c
set picture_url = s.urls[1 + mod(abs(hashtext(c.id)), array_length(s.urls, 1))]
from (
  select array[
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=320&h=320&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=320&h=320&fit=crop',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=320&h=320&fit=crop',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=320&h=320&fit=crop',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=320&h=320&fit=crop',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=320&h=320&fit=crop',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=320&h=320&fit=crop',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=320&h=320&fit=crop',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=320&h=320&fit=crop',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=320&h=320&fit=crop'
  ]::text[] as urls
) s
where c.picture_url = ''
  and c.id like 'bp-bulk-%'
  and c.id <> 'bp-bulk-20';

update public.employee set picture_url = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=320&h=320&fit=crop' where id = 'emp-isla';
update public.employee set picture_url = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=320&h=320&fit=crop' where id = 'emp-gabriela';
update public.employee set picture_url = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=320&h=320&fit=crop' where id = 'emp-michael';
update public.employee set picture_url = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=320&h=320&fit=crop' where id = 'emp-oliver';
update public.employee set picture_url = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=320&h=320&fit=crop' where id = 'emp-ceo';
update public.employee set picture_url = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=320&h=320&fit=crop' where id = 'emp-rose';

update public.employee e
set picture_url = s.urls[1 + mod(abs(hashtext(e.id)), array_length(s.urls, 1))]
from (
  select array[
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=320&h=320&fit=crop',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=320&h=320&fit=crop',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=320&h=320&fit=crop',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=320&h=320&fit=crop',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=320&h=320&fit=crop',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=320&h=320&fit=crop',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=320&h=320&fit=crop',
    'https://images.unsplash.com/photo-1554158869-4417437ba2e3?w=320&h=320&fit=crop'
  ]::text[] as urls
) s
where e.picture_url = ''
  and e.id like 'emp-sw-%';
