import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useData } from "@/state/data";
import { usePeriod } from "@/state/period";
import { PeriodSwitcher } from "@/components/ui/PeriodSwitcher";
import { StatTile, SectionTitle } from "@/components/ui/primitives";
import { Ring, BarList, VBars, Donut, SPEND_COLORS } from "@/components/ui/charts";
import {
  computeSavings,
  computeSpendBreakdown,
  seenInPeriod,
} from "@/engine/savings";
import { watchStats, placeStats, timeStats } from "@/engine/stats";
import { money, percent, hoursDecimal } from "@/lib/format";

export function Home() {
  const { screenings, charges, theaters, loading } = useData();
  const { range } = usePeriod();

  const savings = useMemo(
    () => computeSavings(screenings, charges, range),
    [screenings, charges, range],
  );
  const seen = useMemo(() => seenInPeriod(screenings, range), [screenings, range]);
  const spend = useMemo(
    () => computeSpendBreakdown(screenings, charges, range),
    [screenings, charges, range],
  );
  const watch = useMemo(() => watchStats(seen), [seen]);
  const place = useMemo(() => placeStats(seen, theaters), [seen, theaters]);
  const time = useMemo(() => timeStats(seen, new Date()), [seen]);

  return (
    <div className="space-y-7">
      <div className="flex justify-center">
        <PeriodSwitcher />
      </div>

      {/* Hero — A-List Savings So Far */}
      <section className="card relative overflow-hidden p-[30px] shadow-hero">
        <div className="pointer-events-none absolute -right-16 -top-32 h-80 w-80 rounded-full bg-hero-glow blur-xl" />
        <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <div className="text-xs font-semibold text-bone-dim">Saved So Far</div>
            <div
              className={`display nums mt-2 text-6xl leading-none ${
                savings.netSavingsCents >= 0 ? "text-bone" : "text-negative"
              }`}
            >
              {money(savings.netSavingsCents)}
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              <span className={`pill ${savings.breakEven ? "pill-amber" : ""}`}>
                {savings.breakEven ? "Ahead of membership" : "Not yet broken even"}
              </span>
              <span className="pill">+{money(savings.bonusFeesSavedCents)} waived fees</span>
            </div>
          </div>
          <Ring value={savings.pctSavings} label={percent(savings.pctSavings)} sub="Saved" />
        </div>
      </section>

      {/* Stat grid */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Ticket Value" value={money(savings.grossTicketValueCents)} />
        <StatTile label="Total Spent" value={money(savings.totalSpentCents)} />
        <StatTile
          label="Cost Per Movie"
          value={money(savings.costPerMovieCents)}
          insufficient={savings.moviesWatched === 0}
        />
        <StatTile
          label="Cost Per Hour"
          value={money(savings.costPerHourCents)}
          insufficient={savings.totalRuntimeMin === 0}
        />
        <StatTile label="Movies Watched" value={savings.moviesWatched} />
        <StatTile label="Hours Watched" value={hoursDecimal(savings.totalRuntimeMin)} />
      </section>

      {loading && (
        <p className="text-center text-sm text-bone-faint">Syncing your ledger…</p>
      )}

      {/* Analytics drill-downs */}
      <section className="space-y-4">
        <SectionTitle>The Reel Story</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          {/* How I Spend */}
          <Link to="/spend" className="card card-hover block p-5">
            <PreviewHead title="How I Spend" stat={percent(savings.pctSavings)} statLabel="saved" tone="good" />
            <div className="mt-3">
              <Donut
                size={104}
                stroke={16}
                slices={[
                  { label: "Subscriptions", value: spend.subscriptionsCents, color: SPEND_COLORS.subscriptions },
                  { label: "Concessions", value: spend.concessionsCents, color: SPEND_COLORS.concessions },
                  { label: "Tickets", value: spend.ticketsPaidCents + spend.extraTicketsCents, color: SPEND_COLORS.extraTickets },
                  { label: "Misc", value: spend.miscCents, color: SPEND_COLORS.misc },
                ]}
              />
            </div>
          </Link>

          {/* What I Watch */}
          <Link to="/watch" className="card card-hover block p-5">
            <PreviewHead
              title="What I Watch"
              stat={watch.favoriteGenre ?? "—"}
              statLabel="top genre"
            />
            <div className="mt-3">
              <BarList
                items={watch.topGenres.slice(0, 4).map((g) => ({ label: g.label, value: g.count }))}
              />
            </div>
          </Link>

          {/* Where I Watch */}
          <Link to="/where" className="card card-hover block p-5">
            <PreviewHead
              title="Where I Watch"
              stat={String(place.uniqueTheaters)}
              statLabel="theaters"
            />
            <div className="mt-3">
              <BarList
                items={place.theaterVisits.slice(0, 4).map((t) => ({ label: t.label, value: t.count }))}
              />
            </div>
          </Link>

          {/* When I Watched */}
          <Link to="/when" className="card card-hover block p-5">
            <PreviewHead
              title="When I Watched"
              stat={`${time.currentStreakWeeks}w`}
              statLabel="streak"
            />
            <div className="mt-3">
              <VBars items={time.byDay.map((d) => ({ label: d.label[0] ?? "", value: d.count }))} />
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}

function PreviewHead({
  title,
  stat,
  statLabel,
  tone = "default",
}: {
  title: string;
  stat: string;
  statLabel: string;
  tone?: "default" | "good";
}) {
  return (
    <div className="flex items-start justify-between">
      <h3 className="text-base font-semibold tracking-[-0.02em] text-bone">{title}</h3>
      <div className="text-right">
        <div className={`display nums text-xl ${tone === "good" ? "text-positive" : "text-bone"}`}>{stat}</div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-bone-faint">{statLabel}</div>
      </div>
    </div>
  );
}
