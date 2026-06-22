-- Surreel: retail value of additional (guest) tickets, so group savings can be
-- computed as (their value minus what you paid for them). Nullable; existing
-- rows are null and contribute nothing.
alter table public.screenings
  add column if not exists additional_tickets_value numeric(10,2);
