import { useMemo } from "react";
import { useData } from "@/state/data";
import { usePeriod } from "@/state/period";
import { PeriodSwitcher } from "@/components/ui/PeriodSwitcher";
import { StatTile, SectionTitle, Pill } from "@/components/ui/primitives";
import { BarList } from "@/components/ui/charts";
import { seenInPeriod } from "@/engine/savings";
import { watchStats } from "@/engine/stats";
import { AnalyticsHeader } from "./shared";

export function WhatIWatch() {
  const { screenings } = useData();
  const { range } = usePeriod();
  const seen = useMemo(() => seenInPeriod(screenings, range), [screenings, range]);
  const w = useMemo(() => watchStats(seen), [seen]);

  return (
    <div className="space-y-6">
      <AnalyticsHeader title="What I Watch" />
      <div className="flex justify-center">
        <PeriodSwitcher />
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Unique Formats" value={w.uniqueFormats} accent />
        <StatTile label="Watched in 3D" value={w.watchedIn3D} />
        <StatTile label="Movies Watched" value={w.moviesWatched} />
        <StatTile label="Watched in PLF" value={w.watchedInPlf} />
        <StatTile label="Rewatches" value={w.rewatches} />
        <StatTile
          label="Avg Rating"
          value={w.avgRating == null ? "—" : w.avgRating.toFixed(1)}
          insufficient={w.avgRating == null}
        />
      </section>

      <section className="card p-5">
        <SectionTitle action={w.favoriteGenre ? <Pill amber>Favorite: {w.favoriteGenre}</Pill> : undefined}>
          Top Genres
        </SectionTitle>
        {w.topGenres.length === 0 ? (
          <p className="text-sm text-bone-faint">Insufficient data</p>
        ) : (
          <BarList items={w.topGenres.map((g) => ({ label: g.label, value: g.count }))} />
        )}
      </section>

      <section className="card p-5">
        <SectionTitle>Format Mix</SectionTitle>
        {w.formatMix.length === 0 ? (
          <p className="text-sm text-bone-faint">Insufficient data</p>
        ) : (
          <BarList items={w.formatMix.map((f) => ({ label: f.label, value: f.count }))} />
        )}
      </section>
    </div>
  );
}
