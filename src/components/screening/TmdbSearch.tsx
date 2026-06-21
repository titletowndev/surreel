import { useEffect, useRef, useState } from "react";
import { searchMovies, type TmdbSearchResult } from "@/lib/tmdb";
import { Poster } from "@/components/ui/primitives";

/**
 * Title field with debounced TMDB autocomplete. Calls `onPick` with the chosen
 * result, or `onFreeText` so a title can be saved even without a TMDB match.
 */
export function TmdbSearch({
  initial,
  onPick,
  onFreeText,
}: {
  initial: string;
  onPick: (r: TmdbSearchResult) => void;
  onFreeText: (title: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const q = value.trim();
    onFreeText(value);
    if (q.length < 2) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await searchMovies(q);
        setResults(r);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative">
      <label className="label">Title</label>
      <input
        className="input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        placeholder="Start typing a movie title…"
        autoComplete="off"
      />
      {loading && (
        <span className="absolute right-3 top-9 text-xs text-bone-faint">…</span>
      )}
      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-80 w-full overflow-auto rounded-xl border border-white/10 bg-ink-800 shadow-card">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(r);
                  setValue(r.title);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-white/5"
              >
                <Poster
                  path={r.poster_path}
                  title={r.title}
                  size="w92"
                  className="h-12 w-8 shrink-0 rounded object-cover"
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm text-bone">{r.title}</span>
                  <span className="block text-xs text-bone-faint">
                    {r.release_date ? r.release_date.slice(0, 4) : "—"}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
