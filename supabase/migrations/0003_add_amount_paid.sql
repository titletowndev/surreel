-- Surreel: broaden the cost model beyond A-List.
-- amount_paid = actual out-of-pocket per screening (retail stays in ticket_value).
-- acquisition = how the ticket was obtained (validated in the app).
-- Existing rows default amount_paid to 0, so no backfill is needed.
alter table public.screenings
  add column if not exists amount_paid numeric(10,2) not null default 0,
  add column if not exists acquisition text;
