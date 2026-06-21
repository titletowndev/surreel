import { useMemo } from "react";
import { useData } from "@/state/data";
import { usePeriod } from "@/state/period";
import { PeriodSwitcher } from "@/components/ui/PeriodSwitcher";
import { StatTile, SectionTitle } from "@/components/ui/primitives";
import { Donut, SPEND_COLORS } from "@/components/ui/charts";
import { computeSavings, computeSpendBreakdown, seenInPeriod } from "@/engine/savings";
import { spendStats } from "@/engine/stats";
import { money, percent } from "@/lib/format";
import { AnalyticsHeader } from "./shared";

export function HowISpend() {
  const { screenings, charges } = useData();
  const { range } = usePeriod();

  const savings = useMemo(() => computeSavings(screenings, charges, range), [screenings, charges, range]);
  const spend = useMemo(() => computeSpendBreakdown(screenings, charges, range), [screenings, charges, range]);
  const seen = useMemo(() => seenInPeriod(screenings, range), [screenings, range]);
  const extra = useMemo(() => spendStats(seen), [seen]);

  return (
    <div className="space-y-6">
      <AnalyticsHeader title="How I Spend" />
      <div className="flex justify-center">
        <PeriodSwitcher />
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Total Value" value={money(savings.grossTicketValueCents)} accent />
        <StatTile label="Total Savings" value={money(savings.netSavingsCents)} />
        <StatTile label="% Savings" value={percent(savings.pctSavings)} />
        <StatTile
          label="Bought Concessions"
          value={extra.boughtConcessionsPct == null ? "—" : percent(extra.boughtConcessionsPct)}
          sub="of visits"
          insufficient={extra.boughtConcessionsPct == null}
        />
        <StatTile label="Non-Membership" value={extra.nonMembershipMovies} sub="movies" />
        <StatTile label="Extra Tickets" value={extra.extraTickets} />
      </section>

      <section className="card p-5">
        <SectionTitle>Spend Breakdown</SectionTitle>
        <Donut
          centerLabel={money(spend.totalCents)}
          centerSub="total"
          slices={[
            { label: `Subscriptions · ${money(spend.subscriptionsCents)}`, value: spend.subscriptionsCents, color: SPEND_COLORS.subscriptions },
            { label: `Concessions · ${money(spend.concessionsCents)}`, value: spend.concessionsCents, color: SPEND_COLORS.concessions },
            { label: `Extra Tickets · ${money(spend.extraTicketsCents)}`, value: spend.extraTicketsCents, color: SPEND_COLORS.extraTickets },
            { label: `Misc · ${money(spend.miscCents)}`, value: spend.miscCents, color: SPEND_COLORS.misc },
          ]}
        />
      </section>
    </div>
  );
}
