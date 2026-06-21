import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { useAuth } from "@/state/auth";
import { useData } from "@/state/data";
import { SectionTitle } from "@/components/ui/primitives";
import { resolvePriceCents } from "@/engine/charges";
import { money, moneyD } from "@/lib/format";
import { US_STATES, type MembershipProgram, type ProgramInput } from "@/lib/types";

const PRESETS: { name: string; monthly_fee: number; use_historical_state_pricing: boolean }[] = [
  { name: "AMC A-List", monthly_fee: 24.99, use_historical_state_pricing: true },
  { name: "Regal Unlimited", monthly_fee: 22.0, use_historical_state_pricing: false },
];

export function Settings() {
  const { user, signOut } = useAuth();
  const { programs, addProgram } = useData();

  async function addPreset(p: (typeof PRESETS)[number]) {
    const today = new Date();
    const input: ProgramInput = {
      name: p.name,
      use_historical_state_pricing: p.use_historical_state_pricing,
      state: null,
      billing_day: today.getDate(),
      monthly_fee: p.monthly_fee,
      is_paused: false,
      start_date: today.toISOString().slice(0, 10),
    };
    await addProgram(input);
  }

  return (
    <div className="space-y-6 pb-10">
      <h1 className="display text-2xl text-bone">Settings</h1>

      <section className="card p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-bone-faint">Signed in as</div>
            <div className="text-sm text-bone">{user?.email ?? "—"}</div>
          </div>
          <button onClick={() => void signOut()} className="btn-ghost">
            Sign out
          </button>
        </div>
      </section>

      <section>
        <SectionTitle>Theater Subscriptions</SectionTitle>
        <div className="space-y-3">
          {programs.map((p) => (
            <ProgramCard key={p.id} program={p} />
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p.name} onClick={() => void addPreset(p)} className="btn-ghost">
              + {p.name}
            </button>
          ))}
          <button
            onClick={() =>
              void addProgram({
                name: "Custom Program",
                use_historical_state_pricing: false,
                state: null,
                billing_day: new Date().getDate(),
                monthly_fee: 19.99,
                is_paused: false,
                start_date: new Date().toISOString().slice(0, 10),
              })
            }
            className="btn-ghost"
          >
            + Add Custom Program
          </button>
        </div>
      </section>
    </div>
  );
}

function ProgramCard({ program }: { program: MembershipProgram }) {
  const { updateProgram, deleteProgram, pauseProgram, charges, priceTable, addCharge, deleteCharge } = useData();
  const [showLedger, setShowLedger] = useState(false);

  const programCharges = useMemo(
    () => charges.filter((c) => c.program_id === program.id).sort((a, b) => b.charge_date.localeCompare(a.charge_date)),
    [charges, program.id],
  );

  const todaysPriceCents = useMemo(
    () => resolvePriceCents(program, new Date(), priceTable),
    [program, priceTable],
  );

  const save = (patch: Partial<ProgramInput>) => void updateProgram(program.id, patch);

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <input
          className="input max-w-[60%] font-semibold"
          value={program.name}
          onChange={(e) => save({ name: e.target.value })}
        />
        <div className="text-right">
          <div className="display nums text-lg text-amber">{money(todaysPriceCents)}</div>
          <div className="text-[10px] uppercase tracking-wide text-bone-faint">Today's Price</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="label">Billing Day</span>
          <input
            type="number"
            min={1}
            max={31}
            className="input"
            value={program.billing_day}
            onChange={(e) => save({ billing_day: Math.min(31, Math.max(1, Number(e.target.value) || 1)) })}
          />
        </label>
        <label className="block">
          <span className="label">State (pricing)</span>
          <select className="input" value={program.state ?? ""} onChange={(e) => save({ state: e.target.value || null })}>
            <option value="">—</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-3 flex items-center justify-between text-sm text-bone-dim">
        Use Historical Pricing (by State)
        <input
          type="checkbox"
          checked={program.use_historical_state_pricing}
          onChange={(e) => save({ use_historical_state_pricing: e.target.checked })}
          className="h-5 w-5 accent-amber"
        />
      </label>

      {!program.use_historical_state_pricing && (
        <label className="mt-3 block">
          <span className="label">Monthly Fee (manual)</span>
          <input
            type="number"
            step="0.01"
            className="input"
            value={program.monthly_fee}
            onChange={(e) => save({ monthly_fee: Number(e.target.value) || 0 })}
          />
        </label>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => void pauseProgram(program.id, !program.is_paused)}
          className={program.is_paused ? "btn-primary" : "btn-ghost"}
        >
          {program.is_paused ? "Resume Subscription" : "Pause Subscription"}
        </button>
        <button onClick={() => setShowLedger((v) => !v)} className="btn-ghost">
          {showLedger ? "Hide" : "Charges"} ({programCharges.length})
        </button>
        <button onClick={() => confirm("Delete this program?") && void deleteProgram(program.id)} className="ml-auto text-sm text-negative hover:underline">
          Delete
        </button>
      </div>

      {program.is_paused && (
        <p className="mt-2 text-xs text-amber/80">Paused — no new charges are being created.</p>
      )}

      {showLedger && (
        <ChargesLedger
          charges={programCharges}
          defaultAmount={moneyD(todaysPriceCents / 100)}
          onAdd={(date, amount) =>
            void addCharge({ program_id: program.id, charge_date: date, amount, source: "manual" })
          }
          onDelete={(id) => void deleteCharge(id)}
        />
      )}
    </div>
  );
}

function ChargesLedger({
  charges,
  defaultAmount,
  onAdd,
  onDelete,
}: {
  charges: { id: string; charge_date: string; amount: number; source: string }[];
  defaultAmount: string;
  onAdd: (date: string, amount: number) => void;
  onDelete: (id: string) => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState(defaultAmount.replace("$", ""));

  return (
    <div className="mt-3 rounded-xl border border-white/5 bg-ink-850 p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-bone-faint">
        Charges Ledger
      </div>
      <div className="mb-3 flex items-end gap-2">
        <label className="flex-1">
          <span className="label">Date</span>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="w-28">
          <span className="label">Amount</span>
          <input className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <button
          className="btn-primary"
          onClick={() => {
            const n = Number(amount);
            if (Number.isFinite(n) && n > 0) onAdd(date, Math.round(n * 100) / 100);
          }}
        >
          Add
        </button>
      </div>

      {charges.length === 0 ? (
        <p className="text-xs text-bone-faint">No charges recorded yet.</p>
      ) : (
        <ul className="divide-y divide-white/5">
          {charges.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-1.5 text-sm">
              <span className="text-bone-dim">{format(parseISO(c.charge_date), "MMM d, yyyy")}</span>
              <span className="flex items-center gap-2">
                <span className={`pill ${c.source === "manual" ? "" : "pill-amber"}`}>{c.source}</span>
                <span className="nums text-bone">{moneyD(c.amount)}</span>
                <button onClick={() => onDelete(c.id)} className="text-bone-faint hover:text-negative" aria-label="Delete charge">
                  ✕
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
