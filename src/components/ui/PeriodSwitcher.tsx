import { usePeriod } from "@/state/period";
import { PERIOD_KINDS } from "@/lib/period";

/**
 * Global period switcher: `‹ Week / Month / Year / All Time ›`.
 * iOS-style segmented control + glass nav buttons. Governs every stats surface.
 */
export function PeriodSwitcher() {
  const { period, range, setPeriodKind, shift } = usePeriod();
  const canNav = period.kind !== "all";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="seg">
        {PERIOD_KINDS.map((p) => (
          <button
            key={p.kind}
            onClick={() => setPeriodKind(p.kind)}
            className={`seg-item ${period.kind === p.kind ? "seg-item-on" : ""}`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-4 text-sm font-medium text-bone-dim">
        <button
          onClick={() => shift(-1)}
          disabled={!canNav}
          className="grid h-7 w-7 place-items-center rounded-full border border-white/[0.09] bg-white/[0.06] transition-colors hover:text-bone disabled:opacity-30"
          aria-label="Previous period"
        >
          ‹
        </button>
        <span className="min-w-[7rem] text-center font-semibold text-bone">{range.label}</span>
        <button
          onClick={() => shift(1)}
          disabled={!canNav}
          className="grid h-7 w-7 place-items-center rounded-full border border-white/[0.09] bg-white/[0.06] transition-colors hover:text-bone disabled:opacity-30"
          aria-label="Next period"
        >
          ›
        </button>
      </div>
    </div>
  );
}
