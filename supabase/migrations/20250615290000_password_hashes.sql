-- Hash seed user passwords (bcrypt). Plain-text values are no longer stored.

comment on column public.app_user.password is 'Bcrypt password hash for staff login; replaced by Microsoft SSO later.';

update public.app_user
set password = case username
  when 'SuperUser' then '$2b$10$XppvT0xrf1Gta4vnriXAVeVSfZdGIOhd4khVij/Q/YIjPxQiuPaSm'
  when 'IslaRobinson' then '$2b$10$WCYI3ZRHMNE6gccY5.aTt.N6iQMLxPyX8snQEv8K3W9gZtxRj3Iz2'
  when 'GabrielaWilson' then '$2b$10$WCYI3ZRHMNE6gccY5.aTt.N6iQMLxPyX8snQEv8K3W9gZtxRj3Iz2'
  else password
end
where username in ('SuperUser', 'IslaRobinson', 'GabrielaWilson');
