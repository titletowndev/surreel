import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { useData } from "@/state/data";
import { SegmentedToggle, Poster, EmptyState } from "@/components/ui/primitives";
import { backdropUrl } from "@/lib/tmdb";
import { isScreeningSeen } from "@/lib/period";
import type { Screening, ScreenFormat } from "@/lib/types";

type Mode = "format" | "theater";

interface Bucket {
  key: string;
  title: string;
  subtitle?: string;
  moviesSeen: number;
  auditoriums: number;
  lastVisit: string | null;
  backdrop: string | null;
  screenings: Screening[];
}

export function Screens() {
  const { screenings, theaters } = useData();
  const [mode, setMode] = useState<Mode>("format");
  const [openKey, setOpenKey] = useState<string | null>(null);

  const seen = useMemo(() => screenings.filter((s) => isScreeningSeen(s)), [screenings]);
  const theaterById = useMemo(() => new Map(theaters.map((t) => [t.id, t])), [theaters]);

  const formatBuckets = useMemo(() => buildBuckets(seen, "format", theaterById), [seen, theaterById]);
  const theaterGroups = useMemo(() => {
    const buckets = buildBuckets(seen, "theater", theaterById);
    // Group theater buckets by chain.
    const byChain = new Map<string, Bucket[]>();
    for (const b of buckets) {
      const chain = b.subtitle ?? "Other";
      const arr = byChain.get(chain) ?? [];
      arr.push(b);
      byChain.set(chain, arr);
    }
    return [...byChain.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [seen, theaterById]);

  if (seen.length === 0) {
    return (
      <div className="space-y-5">
        <ModeToggle mode={mode} setMode={setMode} />
        <EmptyState
          title="No screens yet"
          hint="Log screenings and they'll organize themselves here by format and theater."
          action={<Link to="/add" className="btn-primary">+ Add a screening</Link>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ModeToggle mode={mode} setMode={setMode} />

      {mode === "format" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {formatBuckets.map((b) => (
            <BucketCard key={b.key} bucket={b} open={openKey === b.key} onToggle={() => setOpenKey(openKey === b.key ? null : b.key)} theaterById={theaterById} />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {theaterGroups.map(([chain, buckets]) => (
            <section key={chain}>
              <h2 className="display mb-2 text-sm text-bone-dim">
                {chain} <span className="text-bone-faint">· {buckets.length} theater{buckets.length === 1 ? "" : "s"}</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {buckets.map((b) => (
                  <BucketCard key={b.key} bucket={b} open={openKey === b.key} onToggle={() => setOpenKey(openKey === b.key ? null : b.key)} theaterById={theaterById} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function ModeToggle({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  return (
    <div className="flex justify-center">
      <SegmentedToggle<Mode>
        value={mode}
        onChange={setMode}
        options={[
          { value: "format", label: "By Format" },
          { value: "theater", label: "By Theater" },
        ]}
      />
    </div>
  );
}

function BucketCard({
  bucket: b,
  open,
  onToggle,
  theaterById,
}: {
  bucket: Bucket;
  open: boolean;
  onToggle: () => void;
  theaterById: Map<string, { name: string }>;
}) {
  return (
    <div className="card card-hover overflow-hidden">
      <button onClick={onToggle} className="block w-full text-left">
        <div className="letterbox relative h-24 w-full bg-ink-700">
          {b.backdrop && (
            <img src={b.backdrop} alt="" className="h-full w-full object-cover opacity-60" loading="lazy" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900 to-transparent" />
          <div className="absolute bottom-2 left-3">
            <div className="display text-lg text-bone">{b.title}</div>
            {b.subtitle && <div className="text-xs text-bone-dim">{b.subtitle}</div>}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 p-3 text-center">
          <Mini label="Movies" value={b.moviesSeen} />
          <Mini label="Auditoriums" value={b.auditoriums} />
          <Mini label={b.subtitle ? "Last Visit" : "Most Recent"} value={b.lastVisit ? format(parseISO(b.lastVisit), "MMM d") : "—"} />
        </div>
      </button>
      {open && (
        <ul className="border-t border-white/5 px-3 py-2">
          {b.screenings.slice(0, 12).map((s) => (
            <li key={s.id}>
              <Link to={`/edit/${s.id}`} className="flex items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-white/5">
                <Poster path={s.poster_path} title={s.title} size="w92" className="h-10 w-7 rounded object-cover" />
                <span className="min-w-0 flex-1 truncate text-sm text-bone">{s.title}</span>
                <span className="shrink-0 text-xs text-bone-faint">
                  {format(parseISO(s.showtime), "MMM d, yyyy")}
                  {!b.subtitle && s.theater_id ? ` · ${theaterById.get(s.theater_id)?.name ?? ""}` : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="display nums text-lg text-amber">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-bone-faint">{label}</div>
    </div>
  );
}

function buildBuckets(
  seen: Screening[],
  mode: Mode,
  theaterById: Map<string, { name: string; chain: string }>,
): Bucket[] {
  const map = new Map<string, Screening[]>();
  for (const s of seen) {
    const key =
      mode === "format"
        ? (s.screen_format as ScreenFormat)
        : s.theater_id ?? "none";
    const arr = map.get(key) ?? [];
    arr.push(s);
    map.set(key, arr);
  }

  const buckets: Bucket[] = [];
  for (const [key, items] of map) {
    const sorted = [...items].sort((a, b) => b.showtime.localeCompare(a.showtime));
    const auditoriums = new Set(items.map((s) => s.auditorium).filter(Boolean)).size;
    const backdrop =
      backdropUrl(sorted.find((s) => s.backdrop_path)?.backdrop_path, "w780") ?? null;
    const theater = mode === "theater" && key !== "none" ? theaterById.get(key) : undefined;
    buckets.push({
      key,
      title: mode === "format" ? key : theater?.name ?? "Unknown theater",
      subtitle: mode === "theater" ? theater?.chain ?? "Other" : undefined,
      moviesSeen: items.length,
      auditoriums,
      lastVisit: sorted[0]?.showtime ?? null,
      backdrop,
      screenings: sorted,
    });
  }
  return buckets.sort((a, b) => b.moviesSeen - a.moviesSeen);
}
