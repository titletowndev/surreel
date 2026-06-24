-- drop the legacy single-quoted screen_format CHECK enum; allowed values are enforced app-side via the ScreenFormat union
alter table public.screenings
  drop constraint if exists screenings_screen_format_check;
