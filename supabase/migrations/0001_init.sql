-- ============================================================================
-- Reel Ledger — initial schema, RLS, and reference pricing
-- ============================================================================
-- Every user-owned row is scoped to auth.uid() via RLS so data syncs across a
-- single account's devices (and can expand to multiple users later).
--
-- Money is stored as numeric(10,2) dollars to match the product spec defaults
-- (e.g. fees_saved default 2.99). The savings engine converts to integer cents
-- for all arithmetic to avoid floating-point drift, then formats back.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- theaters
-- ---------------------------------------------------------------------------
create table if not exists public.theaters (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  chain       text not null default 'AMC' check (chain in ('AMC', 'Regal', 'Other')),
  city        text,
  state       text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- membership_programs
-- ---------------------------------------------------------------------------
create table if not exists public.membership_programs (
  id                              uuid primary key default gen_random_uuid(),
  user_id                         uuid not null references auth.users (id) on delete cascade,
  name                            text not null,
  use_historical_state_pricing    boolean not null default false,
  state                           text,
  billing_day                     int not null default 1 check (billing_day between 1 and 31),
  monthly_fee                     numeric(10,2) not null default 24.99,
  is_paused                       boolean not null default false,
  start_date                      date not null default current_date,
  created_at                      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- membership_charges
-- ---------------------------------------------------------------------------
create table if not exists public.membership_charges (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  program_id  uuid not null references public.membership_programs (id) on delete cascade,
  charge_date date not null,
  amount      numeric(10,2) not null,
  source      text not null default 'auto' check (source in ('auto', 'manual', 'onboarding')),
  created_at  timestamptz not null default now(),
  -- A given program is charged at most once per calendar date by the auto engine.
  unique (program_id, charge_date)
);

-- ---------------------------------------------------------------------------
-- screenings
-- ---------------------------------------------------------------------------
create table if not exists public.screenings (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null references auth.users (id) on delete cascade,

  -- TMDB metadata snapshot (denormalised so the log is stable if TMDB changes)
  tmdb_id                   bigint,
  title                     text not null,
  poster_path               text,
  backdrop_path             text,
  release_year              int,
  runtime_min               int,
  director                  text,
  mpaa_rating               text,
  genres                    text[] not null default '{}',

  -- Venue + format
  theater_id                uuid references public.theaters (id) on delete set null,
  screen_format             text not null default 'Standard'
                              check (screen_format in
                                ('Standard','IMAX','Dolby','RealD3D','PLF','ScreenX','Other')),
  format_details            text,                    -- e.g. Digital | Laser | 70mm
  is_3d                     boolean not null default false,
  is_plf                    boolean not null default false,
  membership_program_id     uuid references public.membership_programs (id) on delete set null,
  auditorium                text,
  seat                      text,

  -- Timing / status
  showtime                  timestamptz not null default now(),
  is_upcoming               boolean not null default false,

  -- Money (dollars; engine computes in cents)
  ticket_value              numeric(10,2) not null default 0,
  fees_saved                numeric(10,2) not null default 2.99,
  concessions_spend         numeric(10,2),
  misc_spend                numeric(10,2),
  additional_tickets        int not null default 0,
  additional_tickets_cost   numeric(10,2),

  -- Personal
  rating                    numeric(3,1) check (rating is null or (rating >= 0 and rating <= 10)),
  tags                      text[] not null default '{}',
  notes                     text,

  created_at                timestamptz not null default now()
);

create index if not exists screenings_user_showtime_idx
  on public.screenings (user_id, showtime desc);
create index if not exists screenings_user_upcoming_idx
  on public.screenings (user_id, is_upcoming);
create index if not exists charges_user_date_idx
  on public.membership_charges (user_id, charge_date desc);

-- ---------------------------------------------------------------------------
-- amc_alist_state_prices  (maintained global reference table, read-only)
-- ---------------------------------------------------------------------------
-- AMC A-List is priced in three regional tiers. This table records the monthly
-- price (3 movies/week plan) effective from a given month, by US state. The
-- savings engine resolves the price effective for each charge month when a
-- program has use_historical_state_pricing = true.
create table if not exists public.amc_alist_state_prices (
  state           text not null,           -- 2-letter US state code
  effective_from  date not null,           -- first day the price applies
  monthly_price   numeric(10,2) not null,
  tier            text,                     -- informational: A | B | C
  primary key (state, effective_from)
);

-- ============================================================================
-- Row-Level Security
-- ============================================================================
alter table public.theaters             enable row level security;
alter table public.membership_programs  enable row level security;
alter table public.membership_charges   enable row level security;
alter table public.screenings           enable row level security;
alter table public.amc_alist_state_prices enable row level security;

-- Owner-scoped policies (SELECT/INSERT/UPDATE/DELETE) for each user table.
do $$
declare t text;
begin
  foreach t in array array['theaters','membership_programs','membership_charges','screenings']
  loop
    execute format($f$
      drop policy if exists %1$s_select on public.%1$s;
      create policy %1$s_select on public.%1$s
        for select using (auth.uid() = user_id);

      drop policy if exists %1$s_insert on public.%1$s;
      create policy %1$s_insert on public.%1$s
        for insert with check (auth.uid() = user_id);

      drop policy if exists %1$s_update on public.%1$s;
      create policy %1$s_update on public.%1$s
        for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

      drop policy if exists %1$s_delete on public.%1$s;
      create policy %1$s_delete on public.%1$s
        for delete using (auth.uid() = user_id);
    $f$, t);
  end loop;
end $$;

-- Pricing reference is readable by any authenticated user, writable by nobody
-- via the API (maintained through migrations / service role only).
drop policy if exists amc_prices_read on public.amc_alist_state_prices;
create policy amc_prices_read on public.amc_alist_state_prices
  for select using (auth.role() = 'authenticated');

-- ============================================================================
-- Realtime — broadcast row changes so other devices stay in sync
-- ============================================================================
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.screenings;
    alter publication supabase_realtime add table public.theaters;
    alter publication supabase_realtime add table public.membership_programs;
    alter publication supabase_realtime add table public.membership_charges;
  end if;
exception when duplicate_object then
  null;
end $$;
