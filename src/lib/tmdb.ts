/**
 * TMDB client — talks only to our own /api/tmdb proxy, never to TMDB directly,
 * so the API key stays server-side.
 */

export interface TmdbSearchResult {
  id: number;
  title: string;
  release_date: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string | null;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbCrew {
  job: string;
  name: string;
}

export interface TmdbReleaseDate {
  certification: string;
  type: number;
}

export interface TmdbMovieDetail {
  id: number;
  title: string;
  release_date: string | null;
  runtime: number | null;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string | null;
  genres: TmdbGenre[];
  credits?: { crew: TmdbCrew[] };
  release_dates?: {
    results: { iso_3166_1: string; release_dates: TmdbReleaseDate[] }[];
  };
  keywords?: { keywords: { id: number; name: string }[] };
}

/** Normalised, app-ready movie metadata derived from a TMDB detail payload. */
export interface MovieMeta {
  tmdb_id: number;
  title: string;
  release_year: number | null;
  runtime_min: number | null;
  poster_path: string | null;
  backdrop_path: string | null;
  director: string | null;
  mpaa_rating: string | null;
  genres: string[];
  during_credits: boolean | null;
  after_credits: boolean | null;
  overview: string | null;
}

const IMG_BASE = "https://image.tmdb.org/t/p";

export function posterUrl(
  path: string | null | undefined,
  size: "w92" | "w154" | "w185" | "w342" | "w500" | "original" = "w342",
): string | null {
  return path ? `${IMG_BASE}/${size}${path}` : null;
}

export function backdropUrl(
  path: string | null | undefined,
  size: "w300" | "w780" | "w1280" | "original" = "w780",
): string | null {
  return path ? `${IMG_BASE}/${size}${path}` : null;
}

async function tmdbGet<T>(path: string, query: Record<string, string> = {}): Promise<T> {
  const qs = new URLSearchParams(query).toString();
  const res = await fetch(`/api/tmdb/${path}${qs ? `?${qs}` : ""}`);
  if (!res.ok) {
    throw new Error(`TMDB request failed (${res.status}) for ${path}`);
  }
  return (await res.json()) as T;
}

export async function searchMovies(query: string): Promise<TmdbSearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const data = await tmdbGet<{ results: TmdbSearchResult[] }>("search/movie", {
    query: q,
    include_adult: "false",
  });
  return data.results.slice(0, 8);
}

/**
 * TMDB keywords are community-contributed, so a stinger keyword ASSERTS a
 * scene but its absence proves nothing. We therefore only ever pre-fill
 * `true`; "no scene" stays the user's call (null = unmarked until they say).
 */
function deriveStingers(
  keywords: { name: string }[] | undefined,
): { during_credits: boolean | null; after_credits: boolean | null } {
  let during = false;
  let after = false;
  for (const k of keywords ?? []) {
    const n = k.name.toLowerCase().replace(/[^a-z]/g, "");
    if (!n.includes("credit")) continue;
    if (n.includes("during") || n.includes("mid")) during = true;
    if (n.includes("after") || n.includes("post")) after = true;
  }
  return {
    during_credits: during ? true : null,
    after_credits: after ? true : null,
  };
}

export async function getMovieMeta(tmdbId: number): Promise<MovieMeta> {
  const d = await tmdbGet<TmdbMovieDetail>(`movie/${tmdbId}`, {
    append_to_response: "credits,release_dates,keywords",
  });

  const director =
    d.credits?.crew.find((c) => c.job === "Director")?.name ?? null;

  // Prefer US theatrical certification.
  const us = d.release_dates?.results.find((r) => r.iso_3166_1 === "US");
  const mpaa =
    us?.release_dates.find((r) => r.certification)?.certification ?? null;

  const stingers = deriveStingers(d.keywords?.keywords);

  return {
    tmdb_id: d.id,
    title: d.title,
    release_year: d.release_date ? Number(d.release_date.slice(0, 4)) : null,
    runtime_min: d.runtime ?? null,
    poster_path: d.poster_path,
    backdrop_path: d.backdrop_path,
    director,
    mpaa_rating: mpaa && mpaa.length ? mpaa : null,
    genres: d.genres.map((g) => g.name),
    overview: d.overview,
    during_credits: stingers.during_credits,
    after_credits: stingers.after_credits,
  };
}


export interface TmdbExternalIds {
  imdb_id: string | null;
}

/** External IDs (notably the IMDb id) for a movie, via the TMDB proxy. */
export async function getExternalIds(tmdbId: number): Promise<TmdbExternalIds> {
  return tmdbGet<TmdbExternalIds>(`movie/${tmdbId}/external_ids`);
}
