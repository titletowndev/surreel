/**
 * Membership charge engine.
 *
 * Deterministic billing-day charge generation:
 *  - An `onboarding` charge is recorded for the program's start month.
 *  - An `auto` charge is recorded on each `billing_day` occurrence from the
 *    start date through today (billing_day clamped to the last day of short
 *    months).
 *  - A paused program generates no new charges.
 *  - Amount resolves from the AMC-A-List-by-state table when the program uses
 *    historical state pricing, else from `monthly_fee`.
 *
 * Generation is idempotent: the DB enforces unique(program_id, charge_date),
 * and we only insert dates that are not already present.
 */
import {
  addMonths,
  getDaysInMonth,
  isAfter,
  isBefore,
  parseISO,
  startOfMonth,
} from "date-fns";
import type {
  AmcStatePrice,
  ChargeInput,
  MembershipCharge,
  MembershipProgram,
} from "@/lib/types";
import { toCents } from "@/lib/format";

/** Resolve the monthly price (in cents) for a program on a given charge date. */
export function resolvePriceCents(
  program: MembershipProgram,
  chargeDate: Date,
  priceTable: AmcStatePrice[],
): number {
  if (program.use_historical_state_pricing && program.state) {
    const candidates = priceTable
      .filter((p) => p.state === program.state)
      .filter((p) => !isAfter(parseISO(p.effective_from), chargeDate))
      .sort((a, b) => (a.effective_from < b.effective_from ? 1 : -1));
    if (candidates[0]) return toCents(candidates[0].monthly_price);
  }
  return toCents(program.monthly_fee);
}

function clampedDate(year: number, monthIndex0: number, day: number): Date {
  const probe = new Date(year, monthIndex0, 1);
  const maxDay = getDaysInMonth(probe);
  return new Date(year, monthIndex0, Math.min(day, maxDay));
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Compute the charges that *should* exist for a program from start → now,
 * minus those already recorded. Returns insert payloads only for the gaps.
 */
export function missingChargesFor(
  program: MembershipProgram,
  existing: MembershipCharge[],
  priceTable: AmcStatePrice[],
  now: Date,
): ChargeInput[] {
  if (program.is_paused) return [];

  const start = parseISO(program.start_date);
  if (isAfter(start, now)) return [];

  const have = new Set(
    existing
      .filter((c) => c.program_id === program.id)
      .map((c) => c.charge_date),
  );

  const out: ChargeInput[] = [];

  // 1) Onboarding charge for the start month (recorded on the start date).
  const onboardingDate = isoDate(start);
  if (!have.has(onboardingDate)) {
    out.push({
      program_id: program.id,
      charge_date: onboardingDate,
      amount: round2(resolvePriceCents(program, start, priceTable) / 100),
      source: "onboarding",
    });
    have.add(onboardingDate);
  }

  // 2) Recurring billing-day charges for each subsequent month.
  let cursor = startOfMonth(addMonths(start, 1));
  while (!isAfter(cursor, now)) {
    const chargeDay = clampedDate(
      cursor.getFullYear(),
      cursor.getMonth(),
      program.billing_day,
    );
    if (!isAfter(chargeDay, now) && !isBefore(chargeDay, start)) {
      const key = isoDate(chargeDay);
      if (!have.has(key)) {
        out.push({
          program_id: program.id,
          charge_date: key,
          amount: round2(resolvePriceCents(program, chargeDay, priceTable) / 100),
          source: "auto",
        });
        have.add(key);
      }
    }
    cursor = addMonths(cursor, 1);
  }

  return out;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
