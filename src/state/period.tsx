import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  defaultPeriod,
  rangeFor,
  setKind,
  shiftPeriod,
  type Period,
  type PeriodKind,
  type PeriodRange,
} from "@/lib/period";

interface PeriodState {
  period: Period;
  range: PeriodRange;
  setPeriodKind: (kind: PeriodKind) => void;
  shift: (dir: -1 | 1) => void;
}

const PeriodContext = createContext<PeriodState | null>(null);

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<Period>(() => defaultPeriod(new Date()));

  const value = useMemo<PeriodState>(
    () => ({
      period,
      range: rangeFor(period),
      setPeriodKind: (kind) => setPeriod((p) => setKind(p, kind)),
      shift: (dir) => setPeriod((p) => shiftPeriod(p, dir)),
    }),
    [period],
  );

  return <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>;
}

export function usePeriod(): PeriodState {
  const ctx = useContext(PeriodContext);
  if (!ctx) throw new Error("usePeriod must be used within PeriodProvider");
  return ctx;
}
