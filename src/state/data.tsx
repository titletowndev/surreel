import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/state/auth";
import { missingChargesFor } from "@/engine/charges";
import { buildDemoData } from "@/lib/demo";
import type {
  AmcStatePrice,
  ChargeInput,
  MembershipCharge,
  MembershipProgram,
  ProgramInput,
  Screening,
  ScreeningInput,
  Theater,
  TheaterInput,
} from "@/lib/types";

interface DataState {
  loading: boolean;
  error: string | null;
  demo: boolean;
  screenings: Screening[];
  theaters: Theater[];
  programs: MembershipProgram[];
  charges: MembershipCharge[];
  priceTable: AmcStatePrice[];

  refresh: () => Promise<void>;

  addScreening: (input: ScreeningInput) => Promise<Screening | null>;
  updateScreening: (id: string, patch: Partial<ScreeningInput>) => Promise<void>;
  deleteScreening: (id: string) => Promise<void>;

  addTheater: (input: TheaterInput) => Promise<Theater | null>;

  addProgram: (input: ProgramInput) => Promise<MembershipProgram | null>;
  updateProgram: (id: string, patch: Partial<ProgramInput>) => Promise<void>;
  deleteProgram: (id: string) => Promise<void>;
  pauseProgram: (id: string, paused: boolean) => Promise<void>;

  addCharge: (input: ChargeInput) => Promise<void>;
  deleteCharge: (id: string) => Promise<void>;
}

const DataContext = createContext<DataState | null>(null);

const demo = !isSupabaseConfigured;
const uid = (): string =>
  typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.round(Math.random() * 1e6)}`;

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [programs, setPrograms] = useState<MembershipProgram[]>([]);
  const [charges, setCharges] = useState<MembershipCharge[]>([]);
  const [priceTable, setPriceTable] = useState<AmcStatePrice[]>([]);
  const chargeSyncDone = useRef(false);

  const refresh = useCallback(async () => {
    if (demo || !userId) return;
    setError(null);
    const [sc, th, pr, ch, pt] = await Promise.all([
      supabase.from("screenings").select("*").order("showtime", { ascending: false }),
      supabase.from("theaters").select("*").order("name"),
      supabase.from("membership_programs").select("*").order("created_at"),
      supabase.from("membership_charges").select("*").order("charge_date", { ascending: false }),
      supabase.from("amc_alist_state_prices").select("*"),
    ]);
    const firstErr = sc.error || th.error || pr.error || ch.error || pt.error;
    if (firstErr) {
      setError(firstErr.message);
      return;
    }
    setScreenings((sc.data ?? []) as Screening[]);
    setTheaters((th.data ?? []) as Theater[]);
    setPrograms((pr.data ?? []) as MembershipProgram[]);
    setCharges((ch.data ?? []) as MembershipCharge[]);
    setPriceTable((pt.data ?? []) as AmcStatePrice[]);
  }, [userId]);

  // Demo mode: load the sample dataset once.
  useEffect(() => {
    if (!demo) return;
    const d = buildDemoData();
    setScreenings(d.screenings);
    setTheaters(d.theaters);
    setPrograms(d.programs);
    setCharges(d.charges);
    setPriceTable(d.priceTable);
    setLoading(false);
  }, []);

  // Live mode: initial load + realtime subscriptions (cross-device sync).
  useEffect(() => {
    if (demo) return;
    if (!userId) {
      setScreenings([]);
      setTheaters([]);
      setPrograms([]);
      setCharges([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    refresh().finally(() => {
      if (active) setLoading(false);
    });

    const tables = ["screenings", "theaters", "membership_programs", "membership_charges"];
    let channel = supabase.channel(`rl-sync-${userId}`);
    for (const table of tables) {
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: `user_id=eq.${userId}` },
        () => void refresh(),
      );
    }
    channel.subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  // Auto-generate any missing billing-day charges once data is loaded (live only).
  useEffect(() => {
    if (demo || !userId || loading || chargeSyncDone.current || programs.length === 0) return;
    chargeSyncDone.current = true;
    void (async () => {
      const now = new Date();
      const toInsert: ChargeInput[] = [];
      for (const p of programs) toInsert.push(...missingChargesFor(p, charges, priceTable, now));
      if (toInsert.length === 0) return;
      const rows = toInsert.map((c) => ({ ...c, user_id: userId }));
      const { error: insErr } = await supabase.from("membership_charges").insert(rows);
      if (!insErr) await refresh();
    })();
  }, [userId, loading, programs, charges, priceTable, refresh]);

  const requireUser = (): string => {
    if (demo) return "demo-user";
    if (!userId) throw new Error("Not authenticated");
    return userId;
  };

  const value: DataState = {
    loading,
    error,
    demo,
    screenings,
    theaters,
    programs,
    charges,
    priceTable,
    refresh,

    async addScreening(input) {
      if (demo) {
        const row: Screening = { ...input, id: uid(), user_id: "demo-user", created_at: new Date().toISOString() };
        setScreenings((xs) => [row, ...xs].sort((a, b) => b.showtime.localeCompare(a.showtime)));
        return row;
      }
      const { data, error: e } = await supabase
        .from("screenings")
        .insert({ ...input, user_id: requireUser() })
        .select()
        .single();
      if (e) {
        setError(e.message);
        return null;
      }
      await refresh();
      return data as Screening;
    },
    async updateScreening(id, patch) {
      if (demo) {
        setScreenings((xs) =>
          xs
            .map((s) => (s.id === id ? { ...s, ...patch } : s))
            .sort((a, b) => b.showtime.localeCompare(a.showtime)),
        );
        return;
      }
      const { error: e } = await supabase.from("screenings").update(patch).eq("id", id);
      if (e) setError(e.message);
      else await refresh();
    },
    async deleteScreening(id) {
      if (demo) {
        setScreenings((xs) => xs.filter((s) => s.id !== id));
        return;
      }
      const { error: e } = await supabase.from("screenings").delete().eq("id", id);
      if (e) setError(e.message);
      else await refresh();
    },

    async addTheater(input) {
      if (demo) {
        const row: Theater = { ...input, id: uid(), user_id: "demo-user", created_at: new Date().toISOString() };
        setTheaters((xs) => [...xs, row].sort((a, b) => a.name.localeCompare(b.name)));
        return row;
      }
      const { data, error: e } = await supabase
        .from("theaters")
        .insert({ ...input, user_id: requireUser() })
        .select()
        .single();
      if (e) {
        setError(e.message);
        return null;
      }
      await refresh();
      return data as Theater;
    },

    async addProgram(input) {
      if (demo) {
        const row: MembershipProgram = { ...input, id: uid(), user_id: "demo-user", created_at: new Date().toISOString() };
        setPrograms((xs) => [...xs, row]);
        return row;
      }
      const { data, error: e } = await supabase
        .from("membership_programs")
        .insert({ ...input, user_id: requireUser() })
        .select()
        .single();
      if (e) {
        setError(e.message);
        return null;
      }
      chargeSyncDone.current = false;
      await refresh();
      return data as MembershipProgram;
    },
    async updateProgram(id, patch) {
      if (demo) {
        setPrograms((xs) => xs.map((p) => (p.id === id ? { ...p, ...patch } : p)));
        return;
      }
      const { error: e } = await supabase.from("membership_programs").update(patch).eq("id", id);
      if (e) setError(e.message);
      else await refresh();
    },
    async deleteProgram(id) {
      if (demo) {
        setPrograms((xs) => xs.filter((p) => p.id !== id));
        setCharges((xs) => xs.filter((c) => c.program_id !== id));
        return;
      }
      const { error: e } = await supabase.from("membership_programs").delete().eq("id", id);
      if (e) setError(e.message);
      else await refresh();
    },
    async pauseProgram(id, paused) {
      const today = new Date();
      const patch: Partial<ProgramInput> = paused
        ? { is_paused: true }
        : { is_paused: false, start_date: today.toISOString().slice(0, 10), billing_day: today.getDate() };
      if (demo) {
        setPrograms((xs) => xs.map((p) => (p.id === id ? { ...p, ...patch } : p)));
        if (!paused) {
          setCharges((xs) => [
            { id: uid(), user_id: "demo-user", program_id: id, charge_date: today.toISOString().slice(0, 10), amount: programs.find((p) => p.id === id)?.monthly_fee ?? 24.99, source: "auto", created_at: today.toISOString() },
            ...xs,
          ]);
        }
        return;
      }
      const { error: e } = await supabase.from("membership_programs").update(patch).eq("id", id);
      if (e) {
        setError(e.message);
        return;
      }
      if (!paused) {
        const prog = programs.find((p) => p.id === id);
        if (prog) {
          const fresh = { ...prog, ...patch } as MembershipProgram;
          const due = missingChargesFor(fresh, charges, priceTable, today);
          if (due.length) {
            await supabase.from("membership_charges").insert(due.map((c) => ({ ...c, user_id: requireUser() })));
          }
        }
      }
      await refresh();
    },

    async addCharge(input) {
      if (demo) {
        setCharges((xs) => [{ ...input, id: uid(), user_id: "demo-user", created_at: new Date().toISOString() }, ...xs]);
        return;
      }
      const { error: e } = await supabase.from("membership_charges").insert({ ...input, user_id: requireUser() });
      if (e) setError(e.message);
      else await refresh();
    },
    async deleteCharge(id) {
      if (demo) {
        setCharges((xs) => xs.filter((c) => c.id !== id));
        return;
      }
      const { error: e } = await supabase.from("membership_charges").delete().eq("id", id);
      if (e) setError(e.message);
      else await refresh();
    },
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataState {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
