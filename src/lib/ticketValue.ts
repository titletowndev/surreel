import type {
  AmcStatePrice,
  Screening,
  ScreenFormat,
  Theater,
} from "@/lib/types";
import { isScreeningSeen } from "@/lib/period";

/**
 * Suggest a default Ticket Value (the counterfactual "what one ticket would
 * have cost without A-List") for a screening being entered.
 *
 * Strategy, most-trusted first:
 *   1. Carry-forward - the most recent *seen* screening whose value > 0 that
 *      matches the current (theater, format) context, relaxing the match
 *      step by step. This reflects the user's own real local prices.
 *   2. Cold start - once a theater (hence a state) is known but there is no
 *      history to draw on, estimate from the state's A-List pricing tier
 *      (a cost-of-living proxy) plus a rough premium-format upcharge.
 *
 * Returns null when there is nothing to base a suggestion on (no theater
 * chosen and no prior screenings) so the field is simply left for the user.
 * Every figure is an editable default, never a locked value.
 */

// Cold-start base ticket price by A-List membership tier. Tier C = high-cost
// metros, B = mid, A = value. Rough adult-evening estimates; tune freely.
const TIER_BASE: Record<string, number> = { C: 16, B: 14, A: 12 };
const DEFAULT_BASE = 14;

// Rough premium-format upcharges over a standard ticket (estimates, tunable).
function formatUpcharge(fmt: ScreenFormat, is3d: boolean, isPlf: boolean): number {
  let up = 0;
  if (fmt === "IMAX") up += 6;
  else if (fmt === "Dolby") up += 5;
  else if (fmt === "ScreenX") up += 5;
  else if (fmt === "PLF") up += 4;
  else if (fmt === "Prime at AMC") up += 5;
  // Separate PLF toggle, when the format itself isn't already large-format.
  if (isPlf && fmt !== "PLF" && fmt !== "IMAX" && fmt !== "Dolby" && fmt !== "Prime at AMC") up += 4;
  // 3D surcharge (either the RealD3D format or the standalone 3D toggle).
  if (is3d || fmt === "RealD3D") up += 3;
  return up;
}

function tierForState(
  state: string | null | undefined,
  priceTable: AmcStatePrice[],
): string | null {
  if (!state) return null;
  const row = priceTable.find((p) => p.state === state);
  return row?.tier ?? null;
}

export interface SuggestTicketValueArgs {
  theaterId: string | null;
  screenFormat: ScreenFormat;
  is3d: boolean;
  isPlf: boolean;
  theaters: Theater[];
  screenings: Screening[];
  priceTable: AmcStatePrice[];
}

export function suggestTicketValue(args: SuggestTicketValueArgs): number | null {
  const { theaterId, screenFormat, is3d, isPlf, theaters, screenings, priceTable } = args;

  const theater = theaters.find((t) => t.id === theaterId) ?? null;
  const state = theater?.state ?? null;

  // Most recent seen screenings that carry a real entered value.
  const seen = screenings
    .filter((s) => Number(s.ticket_value) > 0 && isScreeningSeen(s))
    .slice()
    .sort((a, b) => b.showtime.localeCompare(a.showtime));

  const sameFormat = (s: Screening): boolean =>
    s.screen_format === screenFormat && s.is_3d === is3d && s.is_plf === isPlf;

  const sameState = (s: Screening): boolean => {
    if (!state) return false;
    const th = theaters.find((t) => t.id === s.theater_id);
    return th?.state === state;
  };

  // Relax the match step by step: exact theater+format, then state+format,
  // then format anywhere, then same theater any format, then most recent.
  const candidate =
    seen.find((s) => s.theater_id === theaterId && sameFormat(s)) ??
    seen.find((s) => sameState(s) && sameFormat(s)) ??
    seen.find((s) => sameFormat(s)) ??
    seen.find((s) => s.theater_id === theaterId) ??
    seen[0];

  if (candidate) return Number(candidate.ticket_value);

  // No history to learn from: only estimate once we at least know the location.
  if (!theater) return null;

  const tier = tierForState(state, priceTable);
  const base = (tier && TIER_BASE[tier]) || DEFAULT_BASE;
  return base + formatUpcharge(screenFormat, is3d, isPlf);
}
