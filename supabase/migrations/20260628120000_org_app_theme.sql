-- AB-0017 Phase 1 — per-organisation app colour theme (nullable = system default).

alter table public.app_organization
  add column if not exists theme_primary_colour text not null default '',
  add column if not exists theme_accent_colour text not null default '',
  add column if not exists theme_background_colour text not null default '',
  add column if not exists theme_text_colour text not null default '';

comment on column public.app_organization.theme_primary_colour is 'App shell primary brand colour (#RRGGBB). Empty = AbilityVua default.';
comment on column public.app_organization.theme_accent_colour is 'App shell accent / login gradient colour (#RRGGBB). Empty = default.';
comment on column public.app_organization.theme_background_colour is 'Optional workspace background (#RRGGBB). Empty = default.';
comment on column public.app_organization.theme_text_colour is 'Optional primary text colour (#RRGGBB). Empty = default.';
