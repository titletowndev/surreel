-- ============================================================================
-- AMC A-List monthly price by state (3 movies/week plan)
-- ============================================================================
-- AMC prices A-List in three regional tiers. These figures are maintained here
-- as the reference table behind `use_historical_state_pricing`. Two effective
-- dates are seeded so the engine can resolve the price for a historical charge
-- month (a 2025 nationwide adjustment is modeled).
--
-- Tiers (high-cost / mid / value) chosen to match the reference app's $25.99
-- headline for top-tier states.
-- ============================================================================

-- Clear any prior seed (idempotent re-run).
delete from public.amc_alist_state_prices;

-- 2023 baseline (effective 2023-01-01) and a 2025 adjustment (effective 2025-02-01).
with tiers(state, tier) as (
  values
    -- Tier C (high cost)
    ('CA','C'),('NY','C'),('NJ','C'),('CT','C'),('MA','C'),('HI','C'),
    ('WA','C'),('MD','C'),('DC','C'),
    -- Tier B (mid)
    ('IL','B'),('TX','B'),('FL','B'),('CO','B'),('VA','B'),('OR','B'),
    ('PA','B'),('AZ','B'),('GA','B'),('NV','B'),('MN','B'),('NC','B'),
    ('MI','B'),('OH','B'),('WI','B'),('UT','B'),('NM','B'),('RI','B'),
    ('NH','B'),('DE','B'),
    -- Tier A (value)
    ('AL','A'),('AK','A'),('AR','A'),('IA','A'),('ID','A'),('IN','A'),
    ('KS','A'),('KY','A'),('LA','A'),('ME','A'),('MS','A'),('MO','A'),
    ('MT','A'),('NE','A'),('ND','A'),('OK','A'),('SC','A'),('SD','A'),
    ('TN','A'),('VT','A'),('WV','A'),('WY','A')
),
prices(tier, eff, price) as (
  values
    ('A', date '2023-01-01', 19.99), ('A', date '2025-02-01', 21.99),
    ('B', date '2023-01-01', 22.99), ('B', date '2025-02-01', 23.99),
    ('C', date '2023-01-01', 24.99), ('C', date '2025-02-01', 25.99)
)
insert into public.amc_alist_state_prices (state, effective_from, monthly_price, tier)
select t.state, p.eff, p.price, t.tier
from tiers t
join prices p on p.tier = t.tier;
