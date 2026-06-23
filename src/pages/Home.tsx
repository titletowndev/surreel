import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useData } from "@/state/data";
import { usePeriod } from "@/state/period";
import { PeriodSwitcher } from "@/components/ui/PeriodSwitcher";
import { StatTile, SectionTitle, Poster } from "@/components/ui/primitives";
import { Ring, BarList, VBars, Donut, SPEND_COLORS } from "@/components/ui/charts";
import {
  computeSavings,
  computeSpendBreakdown,
  seenInPeriod,
  bestValueScreening,
  screeningSavedCents,
} from "@/engine/savings";
import { watchStats, placeStats, timeStats } from "@/engine/stats";
import { money, percent, hoursDecimal } from "@/lib/format";
import { format, parseISO } from "date-fns";

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
  const best = useMemo(() => bestValueScreening(seen), [seen]);
  const recent = useMemo(
    () => [...seen].sort((a, b) => (a.showtime < b.showtime ? 1 : -1)).slice(0, 3),
    [seen],
  );
  const theaterById = useMemo(
    () => new Map(theaters.map((t) => [t.id, t])),
    [theaters],
  );
  const reads = useMemo(() => {
    const slices = [
      { label: "subscription", cents: spend.subscriptionsCents },
      { label: "tickets", cents: spend.ticketsPaidCents + spend.extraTicketsCents },
      { label: "concessions", cents: spend.concessionsCents },
      { label: "misc", cents: spend.miscCents },
    ];
    const top = slices.reduce((a, b) => (b.cents > a.cents ? b : a));
    const spendRead =
      spend.totalCents > 0
        ? `Mostly ${top.label}: ${money(top.cents)} of ${money(spend.totalCents)}.`
        : "No spend logged yet.";
    const g0 = watch.topGenres[0];
    const watchRead = g0 ? `${g0.label} leads with ${g0.count}.` : "No genres tagged yet.";
    const t0 = place.theaterVisits[0];
    const whereRead = t0 ? `Most at ${t0.label} (${t0.count}).` : "No theaters logged yet.";
    const whenRead =
      time.currentStreakWeeks >= 1
        ? `Current streak: ${time.currentStreakWeeks} ${time.currentStreakWeeks === 1 ? "week" : "weeks"}.`
        : time.mostFrequentDay
          ? `Mostly ${time.mostFrequentDay}s.`
          : "No screenings yet.";
    return { spendRead, watchRead, whereRead, whenRead };
  }, [spend, watch, place, time]);

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
            <div className="nums mt-2 text-xs font-medium text-bone-dim">
              {money(savings.grossTicketValueCents)} value − {money(savings.totalSpentCents)} spent = {money(savings.netSavingsCents)} saved
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              <span className={`pill ${savings.breakEven ? "pill-amber" : ""}`}>
                {savings.breakEven ? "Net positive" : "Not yet net positive"}
              </span>
              {/* fees-moved-to-tile */}
            </div>
          </div>
          <Ring value={savings.pctSavings} label={percent(savings.pctSavings)} sub="of value saved" />
        </div>
      </section>

      {/* Stat grid */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Ticket Value" value={money(savings.grossTicketValueCents)} />
        <StatTile label="Total Spent" value={<span className="text-sys-orange">{money(savings.totalSpentCents)}</span>} />
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

      {savings.bonusFeesSavedCents > 0 && (
        <div className="card flex items-center justify-between px-5 py-3">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-bone-dim">
            Fees Waived
          </span>
          <span className="nums text-sm font-semibold text-bone">
            +{money(savings.bonusFeesSavedCents)}
          </span>
        </div>
      )}

      {loading && (
        <p className="text-center text-sm text-bone-faint">Syncing your ledger…</p>
      )}

      {best && (
        <Link to={`/movie/${best.screening.id}`} className="card card-hover block p-5">
          <div className="flex items-center gap-4">
            <Poster
              path={best.screening.poster_path}
              title={best.screening.title}
              size="w154"
              className="h-[4.6rem] w-[3.1rem] shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-bone-dim">
                Best value so far
              </div>
              <div className="mt-0.5 truncate text-base font-semibold text-bone">
                {best.screening.title}
              </div>
              <div className="nums mt-1 text-xs font-medium text-bone-dim">
                {money(best.valueCents)} value · {money(best.paidCents)} paid · <span className="text-positive">{money(best.savedCents)} saved</span>
              </div>
            </div>
          </div>
        </Link>
      )}

      {recent.length > 0 && (
        <section className="card p-5">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-bone-dim">
            Recently watched
          </div>
          <div className="mt-3 space-y-3">
            {recent.map((s) => {
              const saved = screeningSavedCents(s);
              const venue = s.theater_id ? theaterById.get(s.theater_id)?.name ?? null : null;
              return (
                <Link
                  key={s.id}
                  to={`/movie/${s.id}`}
                  className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-white/[0.04]"
                >
                  <Poster
                    path={s.poster_path}
                    title={s.title}
                    size="w92"
                    className="h-12 w-8 shrink-0 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-bone">{s.title}</div>
                    <div className="truncate text-xs text-bone-dim">
                      {[venue, format(parseISO(s.showtime), "MMM d")].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <div
                    className={`nums shrink-0 text-xs font-semibold ${
                      saved >= 0 ? "text-positive" : "text-negative"
                    }`}
                  >
                    {money(saved, { sign: true })}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
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
            <Takeaway text={reads.spendRead} />
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
            <Takeaway text={reads.watchRead} />
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
            <Takeaway text={reads.whereRead} />
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
            <Takeaway text={reads.whenRead} />
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
        <div className="text-[10px] font-semibold uppercase tracking-wide text-bone-dim">{statLabel}</div>
      </div>
    </div>
  );
}

function Takeaway({ text }: { text: string }) {
  return <p className="mt-3 text-xs font-medium leading-snug text-bone-dim">{text}</p>;
}
