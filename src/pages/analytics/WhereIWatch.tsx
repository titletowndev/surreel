import { useMemo } from "react";
import { useData } from "@/state/data";
import { usePeriod } from "@/state/period";
import { PeriodSwitcher } from "@/components/ui/PeriodSwitcher";
import { StatTile, SectionTitle } from "@/components/ui/primitives";
import { BarList } from "@/components/ui/charts";
import { seenInPeriod } from "@/engine/savings";
import { placeStats } from "@/engine/stats";
import { AnalyticsHeader } from "./shared";

export function WhereIWatch() {
  const { screenings, theaters } = useData();
  const { range } = usePeriod();
  const seen = useMemo(() => seenInPeriod(screenings, range), [screenings, range]);
  const p = useMemo(() => placeStats(seen, theaters), [seen, theaters]);

  const totalVisits = p.theaterVisits.reduce((s, t) => s + t.count, 0);

  return (
    <div className="space-y-6">
      <AnalyticsHeader title="Where I Watch" />
      <div className="flex justify-center">
        <PeriodSwitcher />
      </div>

      <section className="grid grid-cols-2 gap-3">
        <StatTile label="Unique Theaters" value={p.uniqueTheaters} accent />
        <StatTile
          label="Most Visited Chain"
          value={p.mostVisitedChain ?? "—"}
          insufficient={!p.mostVisitedChain}
        />
        <StatTile
          label="Most Visited Theater"
          value={p.mostVisitedTheater ?? "—"}
          insufficient={!p.mostVisitedTheater}
        />
        <StatTile
          label="Most Visited Auditorium"
          value={p.mostVisitedAuditorium ?? "—"}
          insufficient={!p.mostVisitedAuditorium}
        />
      </section>

      <section className="card p-5">
        <SectionTitle>Theater Visits</SectionTitle>
        {p.theaterVisits.length === 0 ? (
          <p className="text-sm text-bone-faint">Insufficient data</p>
        ) : (
          <BarList
            items={p.theaterVisits.map((t) => ({ label: t.label, value: t.count }))}
            formatValue={(v) => `${v}`}
          />
        )}
        {totalVisits > 0 && (
          <p className="mt-3 text-xs text-bone-faint">
            {totalVisits} visit{totalVisits === 1 ? "" : "s"} across {p.uniqueTheaters} theater
            {p.uniqueTheaters === 1 ? "" : "s"} this period.
          </p>
        )}
      </section>
    </div>
  );
}
