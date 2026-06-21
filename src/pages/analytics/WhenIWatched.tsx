import { useMemo } from "react";
import { useData } from "@/state/data";
import { usePeriod } from "@/state/period";
import { PeriodSwitcher } from "@/components/ui/PeriodSwitcher";
import { StatTile, SectionTitle } from "@/components/ui/primitives";
import { VBars, LineArea, Heatmap } from "@/components/ui/charts";
import { seenInPeriod } from "@/engine/savings";
import { timeStats, DAYS, TIME_BUCKETS } from "@/engine/stats";
import { AnalyticsHeader } from "./shared";

export function WhenIWatched() {
  const { screenings } = useData();
  const { range } = usePeriod();
  const seen = useMemo(() => seenInPeriod(screenings, range), [screenings, range]);
  const t = useMemo(() => timeStats(seen, new Date()), [seen]);

  return (
    <div className="space-y-6">
      <AnalyticsHeader title="When I Watched" />
      <div className="flex justify-center">
        <PeriodSwitcher />
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Streak" value={`${t.currentStreakWeeks}w`} accent sub="consecutive weeks" />
        <StatTile label="Most in a Row" value={`${t.longestStreakWeeks}w`} />
        <StatTile
          label="Most Frequent Day"
          value={t.mostFrequentDay ?? "—"}
          insufficient={!t.mostFrequentDay}
        />
        <StatTile
          label="Most Frequent Time"
          value={t.mostFrequentTime ?? "—"}
          insufficient={!t.mostFrequentTime}
        />
        <StatTile label="Most in a Day" value={t.mostInADay} />
        <StatTile label="Double+ Features" value={t.doubleFeatures} />
      </section>

      <section className="card p-5">
        <SectionTitle>Movies Per Month</SectionTitle>
        {t.perMonth.length === 0 ? (
          <p className="text-sm text-bone-faint">Insufficient data</p>
        ) : (
          <LineArea points={t.perMonth.map((m) => ({ label: m.label, value: m.count }))} />
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="card p-5">
          <SectionTitle>Visits by Day</SectionTitle>
          <VBars items={t.byDay.map((d) => ({ label: d.label, value: d.count }))} />
        </section>
        <section className="card p-5">
          <SectionTitle>Visits by Time of Day</SectionTitle>
          <VBars items={t.byTime.map((b) => ({ label: b.label.slice(0, 3), value: b.count }))} />
        </section>
      </div>

      <section className="card p-5">
        <SectionTitle>When I Go</SectionTitle>
        <Heatmap matrix={t.heatmap} rowLabels={DAYS} colLabels={TIME_BUCKETS} />
      </section>
    </div>
  );
}
