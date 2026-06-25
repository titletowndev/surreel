/**
 * Savings engine — deterministic. Every figure traces to summed rows or the
 * fixed formulas in the spec. No estimates. All arithmetic in integer cents.
 *
 *   gross_ticket_value = Σ ticket_value over screenings in R
 *   membership_paid    = Σ charges.amount in R
 *   net_savings        = gross_ticket_value − membership_paid − Σ amount_paid
 *   pct_savings        = net_savings / gross_ticket_value
 *   bonus_fees_saved   = Σ fees_saved in R                      (separate stat)
 *   cost_per_movie     = membership_paid / count(movies in R)
 *   cost_per_hour      = membership_paid / (Σ runtime_min / 60)
 *   break_even         = gross_ticket_value ≥ membership_paid
 */
import type { MembershipCharge, Screening } from "@/lib/types";
import type { PeriodRange } from "@/lib/period";
import { inPeriod, isScreeningSeen } from "@/lib/period";
import { toCents } from "@/lib/format";

export interface SavingsSummary {
  grossTicketValueCents: number;
  membershipPaidCents: number;
  amountPaidCents: number;
  totalSpentCents: number;
  netSavingsCents: number;
  pctSavings: number; // 0..1, NaN-safe (0 when no gross)
  bonusFeesSavedCents: number;
  costPerMovieCents: number; // 0 when no movies
  costPerHourCents: number; // 0 when no runtime
  moviesWatched: number;
  totalRuntimeMin: number;
  breakEven: boolean;
}

export interface SpendBreakdown {
  subscriptionsCents: number;
  ticketsPaidCents: number;
  concessionsCents: number;
  extraTicketsCents: number;
  miscCents: number;
  totalCents: number;
}

/** Seen screenings (not upcoming) whose showtime falls within the range. */
export function seenInPeriod(
  screenings: Screening[],
  range: PeriodRange,
): Screening[] {
  return screenings.filter(
    (s) => isScreeningSeen(s) && inPeriod(s.showtime, range),
  );
}

export function chargesInPeriod(
  charges: MembershipCharge[],
  range: PeriodRange,
): MembershipCharge[] {
  // charge_date is a date string; treat as midday to avoid TZ edge flips.
  return charges.filter((c) => inPeriod(`${c.charge_date}T12:00:00`, range));
}

export function computeSavings(
  screenings: Screening[],
  charges: MembershipCharge[],
  range: PeriodRange,
): SavingsSummary {
  const seen = seenInPeriod(screenings, range);
  const periodCharges = chargesInPeriod(charges, range);

  const grossTicketValueCents = seen.reduce(
    (sum, s) => sum + toCents(s.ticket_value) + toCents(s.additional_tickets_value),
    0,
  );
  const membershipPaidCents = periodCharges.reduce(
    (sum, c) => sum + toCents(c.amount),
    0,
  );
  const amountPaidCents = seen.reduce(
    (sum, s) => sum + toCents(s.amount_paid) + toCents(s.additional_tickets_cost),
    0,
  );
  const totalSpentCents = membershipPaidCents + amountPaidCents;
  const bonusFeesSavedCents = seen.reduce(
    (sum, s) => sum + toCents(s.fees_saved),
    0,
  );
  const totalRuntimeMin = seen.reduce(
    (sum, s) => sum + (s.runtime_min ?? 0),
    0,
  );

  const moviesWatched = seen.length;
  const netSavingsCents = grossTicketValueCents - totalSpentCents;

  return {
    grossTicketValueCents,
    membershipPaidCents,
    amountPaidCents,
    totalSpentCents,
    netSavingsCents,
    pctSavings:
      grossTicketValueCents > 0 ? netSavingsCents / grossTicketValueCents : 0,
    bonusFeesSavedCents,
    costPerMovieCents:
      moviesWatched > 0 ? Math.round(totalSpentCents / moviesWatched) : 0,
    costPerHourCents:
      totalRuntimeMin > 0
        ? Math.round(totalSpentCents / (totalRuntimeMin / 60))
        : 0,
    moviesWatched,
    totalRuntimeMin,
    breakEven: grossTicketValueCents >= totalSpentCents,
  };
}

export function computeSpendBreakdown(
  screenings: Screening[],
  charges: MembershipCharge[],
  range: PeriodRange,
): SpendBreakdown {
  const seen = seenInPeriod(screenings, range);
  const subscriptionsCents = chargesInPeriod(charges, range).reduce(
    (s, c) => s + toCents(c.amount),
    0,
  );
  const ticketsPaidCents = seen.reduce(
    (s, x) => s + toCents(x.amount_paid),
    0,
  );
  const concessionsCents = seen.reduce(
    (s, x) => s + toCents(x.concessions_spend),
    0,
  );
  const extraTicketsCents = seen.reduce(
    (s, x) => s + toCents(x.additional_tickets_cost),
    0,
  );
  const miscCents = seen.reduce((s, x) => s + toCents(x.misc_spend), 0);

  return {
    subscriptionsCents,
    ticketsPaidCents,
    concessionsCents,
    extraTicketsCents,
    miscCents,
    totalCents:
      subscriptionsCents +
      ticketsPaidCents +
      concessionsCents +
      extraTicketsCents +
      miscCents,
  };
}

// ---------------------------------------------------------------------------
// Best value − the single screening with the highest retail-minus-paid spread.
// Per-screening, membership monthly fee is a period-level offset, not assignable
// to one row, so saved here is (value) - (out of pocket) for that seat + guests.
// ---------------------------------------------------------------------------
export interface BestValue {
  screening: Screening;
  valueCents: number;
  paidCents: number;
  savedCents: number;
}

export function screeningSavedCents(s: Screening): number {
  return (
    toCents(s.ticket_value) +
    toCents(s.additional_tickets_value) -
    toCents(s.amount_paid) -
    toCents(s.additional_tickets_cost)
  );
}

export function bestValueScreening(seen: Screening[]): BestValue | null {
  let best: BestValue | null = null;
  for (const s of seen) {
    const valueCents =
      toCents(s.ticket_value) + toCents(s.additional_tickets_value);
    const paidCents =
      toCents(s.amount_paid) + toCents(s.additional_tickets_cost);
    const savedCents = valueCents - paidCents;
    if (!best || savedCents > best.savedCents) {
      best = { screening: s, valueCents, paidCents, savedCents };
    }
  }
  return best;
}
