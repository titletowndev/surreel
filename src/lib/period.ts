/**
 * Period switcher — governs every stats / savings surface.
 * `‹ Week / Month / Year / All Time ›` with prev/next navigation by anchor date.
 */
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addWeeks,
  addMonths,
  addYears,
  format,
  isWithinInterval,
} from "date-fns";

export type PeriodKind = "week" | "month" | "year" | "all";

export interface Period {
  kind: PeriodKind;
  /** Anchor date that situates the current window (ignored for "all"). */
  anchor: Date;
}

export interface PeriodRange {
  start: Date | null; // null => unbounded (all time)
  end: Date | null;
  label: string;
}

export const PERIOD_KINDS: { kind: PeriodKind; label: string }[] = [
  { kind: "week", label: "Week" },
  { kind: "month", label: "Month" },
  { kind: "year", label: "Year" },
  { kind: "all", label: "All Time" },
];

const WEEK_OPTS = { weekStartsOn: 0 } as const; // Sunday

export function defaultPeriod(now: Date): Period {
  return { kind: "year", anchor: now };
}

export function rangeFor(period: Period): PeriodRange {
  const { kind, anchor } = period;
  switch (kind) {
    case "week":
      return {
        start: startOfWeek(anchor, WEEK_OPTS),
        end: endOfWeek(anchor, WEEK_OPTS),
        label: `Week of ${format(startOfWeek(anchor, WEEK_OPTS), "MMM d, yyyy")}`,
      };
    case "month":
      return {
        start: startOfMonth(anchor),
        end: endOfMonth(anchor),
        label: format(anchor, "MMMM yyyy"),
      };
    case "year":
      return {
        start: startOfYear(anchor),
        end: endOfYear(anchor),
        label: format(anchor, "yyyy"),
      };
    case "all":
      return { start: null, end: null, label: "All Time" };
  }
}

export function shiftPeriod(period: Period, dir: -1 | 1): Period {
  if (period.kind === "all") return period;
  const { kind, anchor } = period;
  const next =
    kind === "week"
      ? addWeeks(anchor, dir)
      : kind === "month"
        ? addMonths(anchor, dir)
        : addYears(anchor, dir);
  return { ...period, anchor: next };
}

export function setKind(period: Period, kind: PeriodKind): Period {
  return { ...period, kind };
}

/** Whether an ISO timestamp falls within the period (all time = always true). */
export function inPeriod(iso: string, range: PeriodRange): boolean {
  if (!range.start || !range.end) return true;
  const d = new Date(iso);
  return isWithinInterval(d, { start: range.start, end: range.end });
}

/**
 * Derived booked/seen state. A screening counts as upcoming only while it is
 * still flagged booked AND its showtime is in the future. The moment the
 * showtime passes it is treated as seen everywhere (Movies grouping, savings,
 * Rewind, Screens) with no manual flip and no DB write. The stored is_upcoming
 * flag stays the creation-time intent; the clock decides the rest.
 */
export function isScreeningSeen(
  s: { is_upcoming: boolean; showtime: string },
  now: Date = new Date(),
): boolean {
  return !s.is_upcoming || new Date(s.showtime).getTime() <= now.getTime();
}

export function isScreeningUpcoming(
  s: { is_upcoming: boolean; showtime: string },
  now: Date = new Date(),
): boolean {
  return !isScreeningSeen(s, now);
}
