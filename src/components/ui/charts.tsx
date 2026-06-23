/** Dependency-free SVG charts in the Apple system palette. */
import type { ReactNode } from "react";

const BLUE = "#0A84FF";
const INDIGO = "#5E5CE6";
const TEAL = "#64D2FF";
const GREEN = "#30D158";
const MINT = "#66D4CF";
const ORANGE = "#FF9F0A";
const TRACK = "rgba(255,255,255,0.08)";

let gradSeq = 0;
const nextId = (p: string) => `${p}-${gradSeq++}`;

/** Savings-% ring — green→mint gradient with a centered label. */
export function Ring({
  value,
  size = 138,
  stroke = 11,
  label,
  sub,
}: {
  value: number; // 0..1 (clamped)
  size?: number;
  stroke?: number;
  label: ReactNode;
  sub?: ReactNode;
}) {
  const v = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - v);
  const id = nextId("ring");
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={GREEN} />
            <stop offset="100%" stopColor={MINT} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={TRACK} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          className="display text-2xl"
          style={{
            backgroundImage: `linear-gradient(120deg, ${GREEN}, ${MINT})`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {label}
        </span>
        {sub && (
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-bone-dim">
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export const SPEND_COLORS = {
  subscriptions: BLUE,
  concessions: INDIGO,
  extraTickets: TEAL,
  misc: ORANGE,
} as const;

export function Donut({
  slices,
  size = 108,
  stroke = 16,
  centerLabel,
  centerSub,
}: {
  slices: DonutSlice[];
  size?: number;
  stroke?: number;
  centerLabel?: ReactNode;
  centerSub?: ReactNode;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="flex items-center gap-5">
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
          {total > 0 &&
            slices.map((s, i) => {
              const frac = s.value / total;
              const dash = c * frac;
              const gap = c - dash;
              const dashoffset = -acc * c;
              acc += frac;
              return (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={stroke}
                  strokeLinecap="butt"
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={dashoffset}
                />
              );
            })}
        </svg>
        {(centerLabel || centerSub) && (
          <div className="absolute flex flex-col items-center">
            <span className="display text-lg text-bone">{centerLabel}</span>
            {centerSub && (
              <span className="text-[10px] font-semibold uppercase tracking-widest text-bone-faint">{centerSub}</span>
            )}
          </div>
        )}
      </div>
      <ul className="space-y-2 text-sm font-medium">
        {slices.map((s, i) => (
          <li key={i} className="flex items-center gap-2.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            <span className="text-bone-dim">{s.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Horizontal bars — leading bar gets a blue gradient, rest a muted blue. */
export function BarList({
  items,
  formatValue,
  accentTop = true,
}: {
  items: { label: string; value: number; suffix?: string }[];
  formatValue?: (v: number) => string;
  accentTop?: boolean;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-3">
      {items.map((it, idx) => (
        <div key={it.label}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="truncate font-medium text-bone-dim">{it.label}</span>
            <span className="nums ml-2 shrink-0 font-semibold text-bone">
              {formatValue ? formatValue(it.value) : it.value}
              {it.suffix ?? ""}
            </span>
          </div>
          <div className="h-[7px] overflow-hidden rounded-full" style={{ background: TRACK }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${(it.value / max) * 100}%`,
                background:
                  accentTop && idx === 0
                    ? `linear-gradient(90deg, ${BLUE}, ${TEAL})`
                    : "rgba(10,132,255,0.55)",
                transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Vertical bars (visits by day / time of day). */
export function VBars({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="flex items-end justify-between gap-2" style={{ height: 112 }}>
      {items.map((it) => (
        <div key={it.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-md"
              style={{
                height: `${(it.value / max) * 100}%`,
                minHeight: it.value > 0 ? 4 : 0,
                background: `linear-gradient(${BLUE}, rgba(10,132,255,0.35))`,
                transition: "height 0.6s cubic-bezier(0.16,1,0.3,1)",
              }}
            />
          </div>
          <span className="text-[11px] font-semibold text-bone-faint">{it.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Movies-per-month line/area chart. */
export function LineArea({ points }: { points: { label: string; value: number }[] }) {
  const w = 320;
  const h = 120;
  const pad = 8;
  if (points.length === 0) return null;
  const max = Math.max(1, ...points.map((p) => p.value));
  const stepX = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0;
  const coords = points.map((p, i) => {
    const x = pad + i * stepX;
    const y = h - pad - (p.value / max) * (h - pad * 2);
    return [x, y] as const;
  });
  const linePath = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const lastX = coords[coords.length - 1]?.[0] ?? pad;
  const firstX = coords[0]?.[0] ?? pad;
  const areaPath = `${linePath} L${lastX},${h - pad} L${firstX},${h - pad} Z`;
  const id = nextId("area");
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" height={h}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BLUE} stopOpacity="0.35" />
            <stop offset="100%" stopColor={BLUE} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${id})`} />
        <path d={linePath} fill="none" stroke={BLUE} strokeWidth={2} strokeLinejoin="round" />
        {coords.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2.5} fill={TEAL} />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] font-medium text-bone-faint">
        <span>{points[0]?.label}</span>
        {points.length > 1 && <span>{points[points.length - 1]?.label}</span>}
      </div>
    </div>
  );
}

/** Day × time-of-day heatmap. rows = 7 days, cols = 4 buckets. */
export function Heatmap({
  matrix,
  rowLabels,
  colLabels,
}: {
  matrix: number[][];
  rowLabels: readonly string[];
  colLabels: readonly string[];
}) {
  const max = Math.max(1, ...matrix.flat());
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate" style={{ borderSpacing: 5 }}>
        <thead>
          <tr>
            <th />
            {colLabels.map((c) => (
              <th key={c} className="pb-1 text-[10px] font-semibold uppercase tracking-wide text-bone-faint">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowLabels.map((row, ri) => (
            <tr key={row}>
              <td className="pr-2 text-right text-[10px] font-semibold text-bone-faint">{row}</td>
              {colLabels.map((_, ci) => {
                const val = matrix[ri]?.[ci] ?? 0;
                const intensity = val / max;
                return (
                  <td key={ci}>
                    <div
                      className="flex h-9 items-center justify-center rounded-lg text-xs font-semibold"
                      style={{
                        background:
                          val === 0 ? "rgba(255,255,255,0.04)" : `rgba(10,132,255,${0.18 + intensity * 0.72})`,
                        color: intensity > 0.55 ? "#fff" : "rgba(235,235,245,0.6)",
                      }}
                    >
                      {val > 0 ? val : ""}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
