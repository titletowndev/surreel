/** Money + display formatting helpers. All money math is done in integer cents. */

export function toCents(dollars: number | null | undefined): number {
  if (dollars == null || Number.isNaN(dollars)) return 0;
  return Math.round(dollars * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function money(cents: number, opts: { sign?: boolean } = {}): string {
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const str = (abs / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
  if (opts.sign && cents > 0) return `+${str}`;
  return negative ? `-${str}` : str;
}

/** Dollars (numeric, possibly float) → display string, e.g. for raw inputs. */
export function moneyD(dollars: number): string {
  return money(toCents(dollars));
}

export function percent(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

export function hours(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function hoursDecimal(totalMinutes: number, digits = 1): string {
  return (totalMinutes / 60).toFixed(digits);
}

export function runtimeShort(min: number | null): string {
  if (!min) return "—";
  return hours(min);
}
