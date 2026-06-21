import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { useData } from "@/state/data";
import { Poster, EmptyState, SegmentedToggle } from "@/components/ui/primitives";
import { runtimeShort } from "@/lib/format";
import type { Screening, Theater } from "@/lib/types";

type SortKey = "date-desc" | "date-asc" | "title" | "rating";

export function Movies() {
  const { screenings, theaters, loading } = useData();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("date-desc");

  const theaterById = useMemo(
    () => new Map(theaters.map((t) => [t.id, t])),
    [theaters],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = screenings;
    if (q) {
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.director?.toLowerCase().includes(q) ||
          s.genres.some((g) => g.toLowerCase().includes(q)),
      );
    }
    return [...list].sort((a, b) => sortScreenings(a, b, sort));
  }, [screenings, query, sort]);

  const upcoming = useMemo(
    () => filtered.filter((s) => s.is_upcoming).sort((a, b) => a.showtime.localeCompare(b.showtime)),
    [filtered],
  );

  const byYear = useMemo(() => {
    const seen = filtered.filter((s) => !s.is_upcoming);
    const groups = new Map<number, Screening[]>();
    for (const s of seen) {
      const y = parseISO(s.showtime).getFullYear();
      const arr = groups.get(y) ?? [];
      arr.push(s);
      groups.set(y, arr);
    }
    return [...groups.entries()].sort((a, b) => b[0] - a[0]);
  }, [filtered]);

  const isEmpty = !loading && screenings.length === 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search titles, directors, genres…"
          className="input"
        />
      </div>

      <div className="flex items-center justify-between">
        <SegmentedToggle<SortKey>
          value={sort}
          onChange={setSort}
          options={[
            { value: "date-desc", label: "Newest" },
            { value: "date-asc", label: "Oldest" },
            { value: "title", label: "A–Z" },
            { value: "rating", label: "Rated" },
          ]}
        />
        <span className="text-xs text-bone-faint">
          {filtered.filter((s) => !s.is_upcoming).length} logged
        </span>
      </div>

      {isEmpty ? (
        <EmptyState
          title="Your reel starts here"
          hint="Log the first movie you've seen in theaters and watch your savings and stats come to life."
          action={
            <Link to="/add" className="btn-primary">
              + Add a screening
            </Link>
          }
        />
      ) : (
        <>
          {upcoming.length > 0 && (
            <section>
              <h2 className="display mb-2 text-sm text-amber">Upcoming</h2>
              <div className="space-y-2">
                {upcoming.map((s) => (
                  <ScreeningRow key={s.id} screening={s} theater={s.theater_id ? theaterById.get(s.theater_id) : undefined} upcoming />
                ))}
              </div>
            </section>
          )}

          {byYear.map(([year, items]) => (
            <section key={year}>
              <h2 className="display mb-2 mt-4 text-sm text-bone-dim">
                {year} <span className="text-bone-faint">· {items.length}</span>
              </h2>
              <div className="space-y-2">
                {items.map((s) => (
                  <ScreeningRow key={s.id} screening={s} theater={s.theater_id ? theaterById.get(s.theater_id) : undefined} />
                ))}
              </div>
            </section>
          ))}

          {filtered.length === 0 && query && (
            <p className="py-8 text-center text-sm text-bone-faint">
              No screenings match “{query}”.
            </p>
          )}
        </>
      )}

      {/* Floating add */}
      <button
        onClick={() => navigate("/add")}
        className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-amber text-2xl font-bold text-ink-900 shadow-glow transition-transform hover:scale-105 active:scale-95"
        aria-label="Add screening"
      >
        +
      </button>
    </div>
  );
}

function ScreeningRow({
  screening: s,
  theater,
  upcoming = false,
}: {
  screening: Screening;
  theater: Theater | undefined;
  upcoming?: boolean;
}) {
  return (
    <Link
      to={`/edit/${s.id}`}
      className="card card-hover flex items-center gap-3 p-2.5"
    >
      <Poster
        path={s.poster_path}
        title={s.title}
        size="w92"
        className="h-20 w-[3.4rem] shrink-0 rounded-lg object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-semibold text-bone">{s.title}</h3>
          {s.release_year && <span className="text-xs text-bone-faint">{s.release_year}</span>}
        </div>
        <div className="mt-0.5 truncate text-xs text-bone-dim">
          {theater?.name ?? "No theater"} · {runtimeShort(s.runtime_min)}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className={`pill ${upcoming ? "pill-amber" : ""}`}>
            {format(parseISO(s.showtime), upcoming ? "EEE MMM d · h:mma" : "MMM d, yyyy")}
          </span>
          <span className="pill">{formatLabel(s)}</span>
          {s.rating != null && <span className="pill">★ {s.rating}</span>}
        </div>
      </div>
    </Link>
  );
}

function formatLabel(s: Screening): string {
  const bits: string[] = [s.screen_format];
  if (s.format_details) bits.push(s.format_details);
  if (s.is_3d) bits.push("3D");
  return bits.join(" · ");
}

function sortScreenings(a: Screening, b: Screening, sort: SortKey): number {
  switch (sort) {
    case "date-asc":
      return a.showtime.localeCompare(b.showtime);
    case "title":
      return a.title.localeCompare(b.title);
    case "rating":
      return (b.rating ?? -1) - (a.rating ?? -1);
    case "date-desc":
    default:
      return b.showtime.localeCompare(a.showtime);
  }
}
