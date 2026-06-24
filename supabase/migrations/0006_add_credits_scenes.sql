-- add per-screening during/after credits-scene tracking (nullable boolean: null unmarked, true has scene, false confirmed none)
alter table public.screenings
  add column if not exists during_credits boolean,
  add column if not exists after_credits boolean;
