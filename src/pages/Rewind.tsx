import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { parseISO } from "date-fns";
import { useData } from "@/state/data";
import { EmptyState } from "@/components/ui/primitives";
import { rangeFor, isScreeningSeen } from "@/lib/period";
import { computeSavings } from "@/engine/savings";
import { watchStats, placeStats, timeStats } from "@/engine/stats";
import { money, hoursDecimal, percent } from "@/lib/format";

export function Rewind() {
  const { screenings, charges, theaters } = useData();

  const years = useMemo(() => {
    const set = new Set<number>();
    for (const s of screenings) if (isScreeningSeen(s)) set.add(parseISO(s.showtime).getFullYear());
    return [...set].sort((a, b) => b - a);
  }, [screenings]);

  const [year, setYear] = useState<number | null>(years[0] ?? null);
  const activeYear = year ?? years[0] ?? null;

  const recap = useMemo(() => {
    if (activeYear == null) return null;
    const range = rangeFor({ kind: "year", anchor: new Date(activeYear, 5, 1) });
    const seen = screenings.filter(
      (s) => isScreeningSeen(s) && parseISO(s.showtime).getFullYear() === activeYear,
    );
    return {
      savings: computeSavings(screenings, charges, range),
      watch: watchStats(seen),
      place: placeStats(seen, theaters),
      time: timeStats(seen, new Date()),
    };
  }, [activeYear, screenings, charges, theaters]);

  if (activeYear == null || !recap) {
    return (
      <EmptyState
        title="Your Rewind awaits"
        hint="Once you've logged a full season of movies, this becomes your shareable year-in-review."
        action={<Link to="/add" className="btn-primary">+ Add a screening</Link>}
      />
    );
  }

  const { savings, watch, place, time } = recap;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="display text-2xl text-bone">Rewind</h1>
        {years.length > 1 && (
          <select
            className="input w-auto"
            value={activeYear}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        )}
      </div>

      <RecapCard tone="amber">
        <div className="text-xs uppercase tracking-widest text-ink-900/70">{activeYear} in cinema</div>
        <div className="display text-6xl text-ink-900">{savings.moviesWatched}</div>
        <div className="text-lg font-semibold text-ink-900/80">movies on the big screen</div>
        <div className="mt-2 text-sm text-ink-900/70">{hoursDecimal(savings.totalRuntimeMin)} hours in the dark</div>
      </RecapCard>

      <div className="grid gap-4 sm:grid-cols-2">
        <RecapCard>
          <Stat big={money(savings.netSavingsCents)} label="net savings vs. membership" />
          <p className="mt-2 text-sm text-bone-dim">
            {percent(savings.pctSavings)} of your ticket value, covered.
          </p>
        </RecapCard>
        <RecapCard>
          <Stat big={watch.favoriteGenre ?? "—"} label="your top genre" />
          {watch.topGenres[1] && (
            <p className="mt-2 text-sm text-bone-dim">followed by {watch.topGenres[1].label}</p>
          )}
        </RecapCard>
        <RecapCard>
          <Stat big={place.mostVisitedTheater ?? "—"} label="your home theater" />
          <p className="mt-2 text-sm text-bone-dim">
            {place.uniqueTheaters} theater{place.uniqueTheaters === 1 ? "" : "s"} visited
          </p>
        </RecapCard>
        <RecapCard>
          <Stat big={`${time.longestStreakWeeks}w`} label="longest streak" />
          <p className="mt-2 text-sm text-bone-dim">
            Busiest stretch: {time.mostInADay} in a single day
          </p>
        </RecapCard>
      </div>

      <RecapCard tone="velvet">
        <div className="text-xs uppercase tracking-widest text-bone/70">The format you chase</div>
        <div className="display text-3xl text-bone">{watch.formatMix[0]?.label ?? "—"}</div>
        <p className="mt-1 text-sm text-bone/70">
          {watch.watchedInPlf} premium large-format screenings · {watch.watchedIn3D} in 3D
        </p>
      </RecapCard>

      <p className="pb-4 text-center text-xs text-bone-faint">
        Screenshot any card to share your year in film.
      </p>
    </div>
  );
}

function RecapCard({
  children,
  tone = "ink",
}: {
  children: React.ReactNode;
  tone?: "ink" | "amber" | "velvet";
}) {
  const cls =
    tone === "amber"
      ? "bg-gradient-to-br from-amber to-amber-deep"
      : tone === "velvet"
        ? "bg-gradient-to-br from-velvet to-velvet-deep"
        : "card";
  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 shadow-card ${cls}`}>
      <div className="pointer-events-none absolute inset-0 spotlight opacity-40" />
      <div className="relative">{children}</div>
    </div>
  );
}

function Stat({ big, label }: { big: string; label: string }) {
  return (
    <>
      <div className="display text-3xl text-bone">{big}</div>
      <div className="text-xs uppercase tracking-wide text-bone-faint">{label}</div>
    </>
  );
}
