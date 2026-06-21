import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format as fmtDate, parseISO } from "date-fns";
import { useData } from "@/state/data";
import { TmdbSearch } from "@/components/screening/TmdbSearch";
import { Poster } from "@/components/ui/primitives";
import { getMovieMeta, type MovieMeta, type TmdbSearchResult } from "@/lib/tmdb";
import { searchTheaters, inferChain, type PlaceTheater } from "@/lib/places";
import {
  SCREEN_FORMATS,
  CHAINS,
  US_STATES,
  type ScreeningInput,
  type ScreenFormat,
  type Chain,
} from "@/lib/types";

interface FormState {
  tmdb_id: number | null;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_year: number | null;
  runtime_min: number | null;
  director: string | null;
  mpaa_rating: string | null;
  genres: string[];
  theater_id: string | null;
  screen_format: ScreenFormat;
  format_details: string;
  is_3d: boolean;
  is_plf: boolean;
  membership_program_id: string | null;
  auditorium: string;
  seat: string;
  showtimeLocal: string; // yyyy-MM-ddTHH:mm
  is_upcoming: boolean;
  ticket_value: string;
  fees_saved: string;
  concessions_spend: string;
  misc_spend: string;
  additional_tickets: number;
  additional_tickets_cost: string;
  rating: string;
  tags: string;
  notes: string;
}

function nowLocalInput(): string {
  return fmtDate(new Date(), "yyyy-MM-dd'T'HH:mm");
}

function emptyForm(): FormState {
  return {
    tmdb_id: null,
    title: "",
    poster_path: null,
    backdrop_path: null,
    release_year: null,
    runtime_min: null,
    director: null,
    mpaa_rating: null,
    genres: [],
    theater_id: null,
    screen_format: "Standard",
    format_details: "",
    is_3d: false,
    is_plf: false,
    membership_program_id: null,
    auditorium: "",
    seat: "",
    showtimeLocal: nowLocalInput(),
    is_upcoming: false,
    ticket_value: "",
    fees_saved: "2.99",
    concessions_spend: "",
    misc_spend: "",
    additional_tickets: 0,
    additional_tickets_cost: "",
    rating: "",
    tags: "",
    notes: "",
  };
}

const num = (s: string): number | null => {
  const t = s.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

export function AddEditScreening() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const {
    screenings,
    theaters,
    programs,
    addScreening,
    updateScreening,
    deleteScreening,
    addTheater,
  } = useData();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [enriching, setEnriching] = useState(false);
  const [showFixMatch, setShowFixMatch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default the membership program to the first one available.
  useEffect(() => {
    if (!isEdit && programs[0] && form.membership_program_id === null) {
      setForm((f) => ({ ...f, membership_program_id: programs[0]?.id ?? null }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programs, isEdit]);

  // Hydrate when editing.
  useEffect(() => {
    if (!isEdit) return;
    const existing = screenings.find((s) => s.id === id);
    if (!existing) return;
    setForm({
      tmdb_id: existing.tmdb_id,
      title: existing.title,
      poster_path: existing.poster_path,
      backdrop_path: existing.backdrop_path,
      release_year: existing.release_year,
      runtime_min: existing.runtime_min,
      director: existing.director,
      mpaa_rating: existing.mpaa_rating,
      genres: existing.genres,
      theater_id: existing.theater_id,
      screen_format: existing.screen_format,
      format_details: existing.format_details ?? "",
      is_3d: existing.is_3d,
      is_plf: existing.is_plf,
      membership_program_id: existing.membership_program_id,
      auditorium: existing.auditorium ?? "",
      seat: existing.seat ?? "",
      showtimeLocal: fmtDate(parseISO(existing.showtime), "yyyy-MM-dd'T'HH:mm"),
      is_upcoming: existing.is_upcoming,
      ticket_value: String(existing.ticket_value ?? ""),
      fees_saved: String(existing.fees_saved ?? "2.99"),
      concessions_spend: existing.concessions_spend == null ? "" : String(existing.concessions_spend),
      misc_spend: existing.misc_spend == null ? "" : String(existing.misc_spend),
      additional_tickets: existing.additional_tickets,
      additional_tickets_cost:
        existing.additional_tickets_cost == null ? "" : String(existing.additional_tickets_cost),
      rating: existing.rating == null ? "" : String(existing.rating),
      tags: existing.tags.join(", "),
      notes: existing.notes ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, screenings.length]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function applyMeta(meta: MovieMeta) {
    setForm((f) => ({
      ...f,
      tmdb_id: meta.tmdb_id,
      title: meta.title,
      poster_path: meta.poster_path,
      backdrop_path: meta.backdrop_path,
      release_year: meta.release_year,
      runtime_min: meta.runtime_min,
      director: meta.director,
      mpaa_rating: meta.mpaa_rating,
      genres: meta.genres,
    }));
  }

  async function handlePick(r: TmdbSearchResult) {
    setEnriching(true);
    setShowFixMatch(false);
    try {
      applyMeta(await getMovieMeta(r.id));
    } catch {
      // Fall back to the lightweight search result fields.
      setForm((f) => ({
        ...f,
        tmdb_id: r.id,
        title: r.title,
        poster_path: r.poster_path,
        backdrop_path: r.backdrop_path,
        release_year: r.release_date ? Number(r.release_date.slice(0, 4)) : null,
      }));
    } finally {
      setEnriching(false);
    }
  }

  async function handleRefresh() {
    if (!form.tmdb_id) return;
    setEnriching(true);
    try {
      applyMeta(await getMovieMeta(form.tmdb_id));
    } finally {
      setEnriching(false);
    }
  }

  function toPayload(): ScreeningInput {
    return {
      tmdb_id: form.tmdb_id,
      title: form.title.trim(),
      poster_path: form.poster_path,
      backdrop_path: form.backdrop_path,
      release_year: form.release_year,
      runtime_min: form.runtime_min,
      director: form.director,
      mpaa_rating: form.mpaa_rating,
      genres: form.genres,
      theater_id: form.theater_id,
      screen_format: form.screen_format,
      format_details: form.format_details.trim() || null,
      is_3d: form.is_3d,
      is_plf: form.is_plf || form.screen_format === "PLF",
      membership_program_id: form.membership_program_id,
      auditorium: form.auditorium.trim() || null,
      seat: form.seat.trim() || null,
      showtime: new Date(form.showtimeLocal).toISOString(),
      is_upcoming: form.is_upcoming,
      ticket_value: num(form.ticket_value) ?? 0,
      fees_saved: num(form.fees_saved) ?? 0,
      concessions_spend: num(form.concessions_spend),
      misc_spend: num(form.misc_spend),
      additional_tickets: form.additional_tickets,
      additional_tickets_cost: num(form.additional_tickets_cost),
      rating: num(form.rating),
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      notes: form.notes.trim() || null,
    };
  }

  async function handleSave() {
    if (!form.title.trim()) {
      setError("A title is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isEdit && id) {
        await updateScreening(id, toPayload());
      } else {
        await addScreening(toPayload());
      }
      navigate("/movies");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    if (!confirm("Delete this screening? This cannot be undone.")) return;
    await deleteScreening(id);
    navigate("/movies");
  }

  const enriched = Boolean(form.tmdb_id);

  return (
    <div className="mx-auto max-w-xl space-y-5 pb-10">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-sm text-bone-dim hover:text-amber">
          ‹ Cancel
        </button>
        <h1 className="display text-xl text-bone">{isEdit ? "Edit Screening" : "Add Screening"}</h1>
        <div className="w-14" />
      </div>

      <TmdbSearch
        initial={form.title}
        onPick={handlePick}
        onFreeText={(t) => set("title", t)}
      />

      {enriched && (
        <EnrichmentCard
          meta={form}
          loading={enriching}
          onRefresh={handleRefresh}
          onFixMatch={() => setShowFixMatch((v) => !v)}
        />
      )}
      {showFixMatch && (
        <p className="text-xs text-bone-faint">
          Wrong movie? Just type the title again above and pick the correct match.
        </p>
      )}

      <Field label="Date & Time">
        <input
          type="datetime-local"
          className="input"
          value={form.showtimeLocal}
          onChange={(e) => set("showtimeLocal", e.target.value)}
        />
      </Field>

      <Toggle
        label="Planned (upcoming) — not seen yet"
        checked={form.is_upcoming}
        onChange={(v) => set("is_upcoming", v)}
      />

      <TheaterPicker
        theaters={theaters}
        value={form.theater_id}
        onChange={(v) => set("theater_id", v)}
        onAdd={async (name, chain, state, city) => {
          const t = await addTheater({ name, chain, state, city });
          if (t) set("theater_id", t.id);
        }}
      />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Format">
          <select
            className="input"
            value={form.screen_format}
            onChange={(e) => set("screen_format", e.target.value as ScreenFormat)}
          >
            {SCREEN_FORMATS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Format Details">
          <input
            className="input"
            placeholder="Digital · Laser · 70mm"
            value={form.format_details}
            onChange={(e) => set("format_details", e.target.value)}
          />
        </Field>
      </div>

      <div className="flex gap-4">
        <Toggle label="3D" checked={form.is_3d} onChange={(v) => set("is_3d", v)} />
        <Toggle label="PLF" checked={form.is_plf} onChange={(v) => set("is_plf", v)} />
      </div>

      <Field label="Membership Program">
        <select
          className="input"
          value={form.membership_program_id ?? ""}
          onChange={(e) => set("membership_program_id", e.target.value || null)}
        >
          <option value="">None (non-membership)</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Auditorium (opt)">
          <input className="input" value={form.auditorium} onChange={(e) => set("auditorium", e.target.value)} />
        </Field>
        <Field label="Seat (opt)">
          <input className="input" value={form.seat} onChange={(e) => set("seat", e.target.value)} />
        </Field>
      </div>

      <Field
        label="Ticket Value"
        hint="The face value you'd have paid for this exact showtime & format (so IMAX, Dolby, etc. are captured). This — not the fee — is the headline savings figure."
      >
        <MoneyInput value={form.ticket_value} onChange={(v) => set("ticket_value", v)} />
      </Field>

      <Field label="Fees Saved" hint="Booking/convenience fee your membership waived. Tracked separately from the headline savings.">
        <MoneyInput value={form.fees_saved} onChange={(v) => set("fees_saved", v)} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Concessions (opt)">
          <MoneyInput value={form.concessions_spend} onChange={(v) => set("concessions_spend", v)} />
        </Field>
        <Field label="Misc Spend (opt)">
          <MoneyInput value={form.misc_spend} onChange={(v) => set("misc_spend", v)} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Additional Tickets">
          <Stepper value={form.additional_tickets} onChange={(v) => set("additional_tickets", v)} />
        </Field>
        <Field label="Additional Tickets Cost">
          <MoneyInput value={form.additional_tickets_cost} onChange={(v) => set("additional_tickets_cost", v)} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Your Rating (0–10)">
          <input
            className="input"
            inputMode="decimal"
            placeholder="—"
            value={form.rating}
            onChange={(e) => set("rating", e.target.value)}
          />
        </Field>
        <Field label="Tags (comma-separated)">
          <input className="input" placeholder="date night, premiere" value={form.tags} onChange={(e) => set("tags", e.target.value)} />
        </Field>
      </div>

      <Field label="Notes">
        <textarea
          className="input min-h-[90px]"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Anything you want to remember about this screening…"
        />
      </Field>

      {error && <p className="text-sm text-negative">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
          {saving ? "Saving…" : "Save Screening"}
        </button>
        {isEdit && (
          <button onClick={handleDelete} className="btn-velvet">
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

// --- small building blocks ---------------------------------------------------

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <label className="label mb-1.5">{label}</label>
        {hint && (
          <span className="group relative -mt-1.5 cursor-help text-bone-faint">
            ⓘ
            <span className="pointer-events-none absolute left-1/2 z-50 mt-1 hidden w-56 -translate-x-1/2 rounded-lg border border-white/10 bg-ink-700 p-2 text-xs font-normal normal-case tracking-normal text-bone-dim shadow-card group-hover:block">
              {hint}
            </span>
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function MoneyInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-2.5 text-bone-faint">$</span>
      <input
        className="input pl-7"
        inputMode="decimal"
        placeholder="0.00"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))} className="btn-ghost h-10 w-10 !px-0">
        −
      </button>
      <span className="nums w-6 text-center text-lg text-bone">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} className="btn-ghost h-10 w-10 !px-0">
        +
      </button>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-bone-dim">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-amber" : "bg-ink-600"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-bone transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
      {label}
    </label>
  );
}

function EnrichmentCard({
  meta,
  loading,
  onRefresh,
  onFixMatch,
}: {
  meta: FormState;
  loading: boolean;
  onRefresh: () => void;
  onFixMatch: () => void;
}) {
  return (
    <div className="card flex gap-3 p-3">
      <Poster path={meta.poster_path} title={meta.title} size="w154" className="h-28 w-20 shrink-0 rounded-lg object-cover" />
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold text-bone">
          {meta.title} {meta.release_year && <span className="text-bone-faint">({meta.release_year})</span>}
        </h3>
        <dl className="mt-1 space-y-0.5 text-xs text-bone-dim">
          {meta.director && <div>Dir. {meta.director}</div>}
          <div>
            {meta.runtime_min ? `${meta.runtime_min} min` : "—"}
            {meta.mpaa_rating ? ` · ${meta.mpaa_rating}` : ""}
          </div>
          {meta.genres.length > 0 && <div className="truncate">{meta.genres.join(", ")}</div>}
        </dl>
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={onRefresh} disabled={loading} className="pill hover:text-amber">
            {loading ? "Refreshing…" : "↻ Refresh"}
          </button>
          <button type="button" onClick={onFixMatch} className="pill hover:text-amber">
            Fix Match
          </button>
        </div>
      </div>
    </div>
  );
}

function TheaterPicker({
  theaters,
  value,
  onChange,
  onAdd,
}: {
  theaters: ReturnType<typeof useData>["theaters"];
  value: string | null;
  onChange: (v: string | null) => void;
  onAdd: (name: string, chain: Chain, state: string | null, city: string | null) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [chain, setChain] = useState<Chain>("AMC");
  const [state, setState] = useState("");
  const [city, setCity] = useState<string | null>(null);
  const [results, setResults] = useState<PlaceTheater[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState(false);

  const sorted = useMemo(
    () => [...theaters].sort((a, b) => a.name.localeCompare(b.name)),
    [theaters],
  );

  useEffect(() => {
    if (!adding || picked) {
      setResults([]);
      return;
    }
    const q = name.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    let active = true;
    setSearching(true);
    const timer = setTimeout(async () => {
      const r = await searchTheaters(q);
      if (active) {
        setResults(r);
        setSearching(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [name, adding, picked]);

  function choose(p: PlaceTheater) {
    setName(p.name);
    setCity(p.city);
    setState(p.state ?? "");
    setChain(inferChain(p.name));
    setResults([]);
    setPicked(true);
  }

  function reset() {
    setAdding(false);
    setName("");
    setChain("AMC");
    setState("");
    setCity(null);
    setResults([]);
    setPicked(false);
  }

  return (
    <Field label="Theater">
      {!adding ? (
        <div className="flex gap-2">
          <select className="input" value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}>
            <option value="">No theater</option>
            {sorted.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} {t.state ? `· ${t.state}` : ""}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => setAdding(true)} className="btn-ghost shrink-0">
            + New
          </button>
        </div>
      ) : (
        <div className="card space-y-2 p-3">
          <div className="relative">
            <input
              className="input w-full"
              placeholder="Start typing a theater…"
              value={name}
              autoComplete="off"
              onChange={(e) => {
                setName(e.target.value);
                setPicked(false);
              }}
            />
            {!picked && (searching || results.length > 0) && (
              <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-white/10 bg-[#121214] shadow-xl">
                {searching && results.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-white/40">Searching…</div>
                ) : (
                  results.map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => choose(p)}
                      className="block w-full px-3 py-2 text-left hover:bg-white/5"
                    >
                      <div className="text-sm text-bone">{p.name}</div>
                      <div className="text-xs text-white/40">
                        {[p.city, p.state].filter(Boolean).join(", ") || p.address}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select className="input" value={chain} onChange={(e) => setChain(e.target.value as Chain)}>
              {CHAINS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select className="input" value={state} onChange={(e) => setState(e.target.value)}>
              <option value="">State…</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-primary flex-1"
              disabled={!name.trim()}
              onClick={async () => {
                await onAdd(name.trim(), chain, state || null, city);
                reset();
              }}
            >
              Add Theater
            </button>
            <button type="button" className="btn-ghost" onClick={reset}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </Field>
  );
}
