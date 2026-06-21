/**
 * Cloudflare Pages Function — TMDB proxy.
 *
 * Routes:  /api/tmdb/<any TMDB v3 path>?<query>
 * Example: /api/tmdb/search/movie?query=dune
 *
 * The TMDB key lives only in the server environment (TMDB_API_KEY) and is never
 * shipped to the browser. Supports either a v3 api_key or a v4 bearer token:
 *   - If TMDB_API_KEY looks like a JWT (3 dot-separated segments) it is sent as
 *     `Authorization: Bearer ...`.
 *   - Otherwise it is appended as `?api_key=...`.
 *
 * Responses are lightly cached at the edge — movie metadata is effectively
 * immutable, so this keeps us well under TMDB rate limits.
 */

interface Env {
  TMDB_API_KEY: string;
}

const TMDB_BASE = "https://api.themoviedb.org/3";
const ALLOWED_PREFIXES = [
  "search/",
  "movie/",
  "configuration",
  "genre/",
  "trending/",
];

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;

  const key = env.TMDB_API_KEY;
  if (!key) {
    return json({ error: "TMDB_API_KEY is not configured" }, 500);
  }

  // params.path is the catch-all segment array, e.g. ["search", "movie"].
  const segments = Array.isArray(params.path) ? params.path : [params.path];
  const path = segments.filter(Boolean).join("/");

  if (!ALLOWED_PREFIXES.some((p) => path === p || path.startsWith(p))) {
    return json({ error: `Path not allowed: ${path}` }, 403);
  }

  const incoming = new URL(request.url);
  const target = new URL(`${TMDB_BASE}/${path}`);

  // Forward the caller's query params (query, language, page, append_to_response…).
  incoming.searchParams.forEach((value, k) => {
    if (k !== "api_key") target.searchParams.set(k, value);
  });

  const isV4Token = key.split(".").length === 3;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (isV4Token) {
    headers.Authorization = `Bearer ${key}`;
  } else {
    target.searchParams.set("api_key", key);
  }

  const tmdbRes = await fetch(target.toString(), { headers });
  const body = await tmdbRes.text();

  return new Response(body, {
    status: tmdbRes.status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=86400, s-maxage=604800",
      "access-control-allow-origin": "*",
    },
  });
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
