/**
 * Analytics engine for the four drill-down pages. Pure functions over a set of
 * already-period-filtered, *seen* screenings. Returns nulls / empty collections
 * where a figure is undefined; the UI renders "Insufficient data" below a
 * threshold rather than inventing a value.
 */
import {
  format,
  getDay,
  getHours,
  startOfWeek,
  differenceInCalendarWeeks,
  parseISO,
} from "date-fns";
import type { Screening, ScreenFormat, Theater } from "@/lib/types";

export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const TIME_BUCKETS = ["Morning", "Afternoon", "Evening", "Night"] as const;
export type TimeBucket = (typeof TIME_BUCKETS)[number];

export function timeBucket(hour: number): TimeBucket {
  if (hour >= 5 && hour <= 11) return "Morning";
  if (hour >= 12 && hour <= 16) return "Afternoon";
  if (hour >= 17 && hour <= 20) return "Evening";
  return "Night";
}

export interface Counted<T extends string = string> {
  key: T;
  label: string;
  count: number;
}

function topOf<T extends string>(counts: Map<T, number>): Counted<T> | null {
  let best: Counted<T> | null = null;
  for (const [key, count] of counts) {
    if (!best || count > best.count) best = { key, label: key, count };
  }
  return best;
}

function sortedCounts<T extends string>(counts: Map<T, number>): Counted<T>[] {
  return [...counts.entries()]
    .map(([key, count]) => ({ key, label: key, count }))
    .sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------------
// What I Watch
// ---------------------------------------------------------------------------
export interface WatchStats {
  uniqueFormats: number;
  watchedIn3D: number;
  moviesWatched: number;
  watchedInPlf: number;
  rewatches: number;
  avgRating: number | null;
  favoriteGenre: string | null;
  formatMix: Counted<ScreenFormat>[];
  topGenres: Counted[];
}

export function watchStats(seen: Screening[]): WatchStats {
  const formats = new Map<ScreenFormat, number>();
  const genres = new Map<string, number>();
  const titleCounts = new Map<string, number>();
  let ratingSum = 0;
  let ratingN = 0;

  for (const s of seen) {
    formats.set(s.screen_format, (formats.get(s.screen_format) ?? 0) + 1);
    for (const g of s.genres) genres.set(g, (genres.get(g) ?? 0) + 1);
    const tk = (s.tmdb_id ? String(s.tmdb_id) : s.title.toLowerCase()).trim();
    titleCounts.set(tk, (titleCounts.get(tk) ?? 0) + 1);
    if (s.rating != null) {
      ratingSum += s.rating;
      ratingN += 1;
    }
  }

  const rewatches = [...titleCounts.values()].reduce(
    (sum, n) => sum + Math.max(0, n - 1),
    0,
  );

  return {
    uniqueFormats: formats.size,
    watchedIn3D: seen.filter((s) => s.is_3d).length,
    moviesWatched: seen.length,
    watchedInPlf: seen.filter((s) => s.is_plf || s.screen_format === "PLF").length,
    rewatches,
    avgRating: ratingN > 0 ? ratingSum / ratingN : null,
    favoriteGenre: topOf(genres)?.key ?? null,
    formatMix: sortedCounts(formats),
    topGenres: sortedCounts(genres).slice(0, 6),
  };
}

// ---------------------------------------------------------------------------
// Where I Watch
// ---------------------------------------------------------------------------
export interface PlaceStats {
  uniqueTheaters: number;
  mostVisitedChain: string | null;
  mostVisitedTheater: string | null;
  mostVisitedAuditorium: string | null;
  theaterVisits: Counted[]; // label is theater name, count is visits
}

export function placeStats(seen: Screening[], theaters: Theater[]): PlaceStats {
  const byId = new Map(theaters.map((t) => [t.id, t]));
  const theaterCounts = new Map<string, number>();
  const chainCounts = new Map<string, number>();
  const audCounts = new Map<string, number>();

  for (const s of seen) {
    if (s.theater_id) {
      const t = byId.get(s.theater_id);
      const name = t?.name ?? "Unknown theater";
      theaterCounts.set(name, (theaterCounts.get(name) ?? 0) + 1);
      if (t) chainCounts.set(t.chain, (chainCounts.get(t.chain) ?? 0) + 1);
    }
    if (s.auditorium) {
      audCounts.set(s.auditorium, (audCounts.get(s.auditorium) ?? 0) + 1);
    }
  }

  return {
    uniqueTheaters: theaterCounts.size,
    mostVisitedChain: topOf(chainCounts)?.key ?? null,
    mostVisitedTheater: topOf(theaterCounts)?.key ?? null,
    mostVisitedAuditorium: topOf(audCounts)?.key ?? null,
    theaterVisits: sortedCounts(theaterCounts),
  };
}

// ---------------------------------------------------------------------------
// When I Watched
// ---------------------------------------------------------------------------
export interface TimeStats {
  currentStreakWeeks: number;
  longestStreakWeeks: number;
  mostFrequentDay: string | null;
  mostFrequentTime: TimeBucket | null;
  mostInADay: number;
  doubleFeatures: number; // days with 2+ screenings
  perMonth: { key: string; label: string; count: number }[];
  byDay: Counted[]; // 7 entries Sun..Sat
  byTime: Counted[]; // 4 entries
  heatmap: number[][]; // [day 0..6][timeBucket 0..3]
}

export function timeStats(seen: Screening[], now: Date): TimeStats {
  const dayCounts = new Array(7).fill(0) as number[];
  const timeCounts = new Map<TimeBucket, number>();
  const heatmap: number[][] = DAYS.map(() => [0, 0, 0, 0]);
  const perDay = new Map<string, number>(); // yyyy-mm-dd -> count
  const perMonth = new Map<string, number>(); // yyyy-mm -> count

  for (const s of seen) {
    const d = parseISO(s.showtime);
    const dow = getDay(d);
    dayCounts[dow] = (dayCounts[dow] ?? 0) + 1;
    const tb = timeBucket(getHours(d));
    timeCounts.set(tb, (timeCounts.get(tb) ?? 0) + 1);
    const tbIdx = TIME_BUCKETS.indexOf(tb);
    const row = heatmap[dow];
    if (row) row[tbIdx] = (row[tbIdx] ?? 0) + 1;
    perDay.set(format(d, "yyyy-MM-dd"), (perDay.get(format(d, "yyyy-MM-dd")) ?? 0) + 1);
    perMonth.set(format(d, "yyyy-MM"), (perMonth.get(format(d, "yyyy-MM")) ?? 0) + 1);
  }

  // Weekly streaks (A-List is a weekly cadence): a "week with ≥1 movie".
  const weeks = new Set<number>();
  for (const s of seen) {
    const w = startOfWeek(parseISO(s.showtime), { weekStartsOn: 0 }).getTime();
    weeks.add(w);
  }
  const sortedWeeks = [...weeks].sort((a, b) => a - b);
  let longest = 0;
  let run = 0;
  let prev: number | null = null;
  for (const w of sortedWeeks) {
    if (prev !== null && differenceInCalendarWeeks(new Date(w), new Date(prev), { weekStartsOn: 0 }) === 1) {
      run += 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prev = w;
  }
  // Current streak = consecutive weeks ending at this week (or last week).
  let current = 0;
  const thisWeek = startOfWeek(now, { weekStartsOn: 0 }).getTime();
  let probe = thisWeek;
  if (!weeks.has(probe)) probe -= 7 * 24 * 3600 * 1000; // allow "this week not yet"
  while (weeks.has(startOfWeek(new Date(probe), { weekStartsOn: 0 }).getTime())) {
    current += 1;
    probe -= 7 * 24 * 3600 * 1000;
  }

  const byDay: Counted[] = DAYS.map((label, i) => ({
    key: label,
    label,
    count: dayCounts[i] ?? 0,
  }));
  const byTime: Counted[] = TIME_BUCKETS.map((label) => ({
    key: label,
    label,
    count: timeCounts.get(label) ?? 0,
  }));

  const mostFrequentDayIdx = dayCounts.reduce(
    (best, c, i) => (c > (dayCounts[best] ?? 0) ? i : best),
    0,
  );

  const perMonthArr = [...perMonth.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, count]) => ({
      key: k,
      label: format(parseISO(`${k}-01`), "MMM ''yy"),
      count,
    }));

  const mostInADay = perDay.size ? Math.max(...perDay.values()) : 0;
  const doubleFeatures = [...perDay.values()].filter((c) => c >= 2).length;

  return {
    currentStreakWeeks: current,
    longestStreakWeeks: longest,
    mostFrequentDay: seen.length ? (DAYS[mostFrequentDayIdx] ?? null) : null,
    mostFrequentTime: topOf(timeCounts)?.key ?? null,
    mostInADay,
    doubleFeatures,
    perMonth: perMonthArr,
    byDay,
    byTime,
    heatmap,
  };
}

// ---------------------------------------------------------------------------
// How I Spend (supplemental, beyond the savings summary)
// ---------------------------------------------------------------------------
export interface SpendStats {
  boughtConcessionsPct: number | null; // % of visits with concessions > 0
  nonMembershipMovies: number;
  extraTickets: number;
}

export function spendStats(seen: Screening[]): SpendStats {
  const withConcessions = seen.filter(
    (s) => (s.concessions_spend ?? 0) > 0,
  ).length;
  return {
    boughtConcessionsPct: seen.length ? withConcessions / seen.length : null,
    nonMembershipMovies: seen.filter((s) => !s.membership_program_id).length,
    extraTickets: seen.reduce((sum, s) => sum + s.additional_tickets, 0),
  };
}
