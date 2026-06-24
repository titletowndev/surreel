import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format as fmtDate, parseISO } from "date-fns";
import { useData } from "@/state/data";
import { Poster } from "@/components/ui/primitives";
import { getExternalIds } from "@/lib/tmdb";

const ACQUISITION_LABELS: Record<string, string> = {
  membership: "Membership",
  voucher: "Voucher / discount",
  full_price: "Full price",
  comp: "Comp",
  other: "Other",
};

function ExtIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-bone-faint"
    >
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.06] py-2.5 last:border-0">
      <span className="text-sm text-bone-dim">{label}</span>
      <span className="text-right text-sm font-medium text-bone">{value}</span>
    </div>
  );
}

function LinkBar({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="card card-hover flex items-center justify-between p-4"
    >
      <span className="text-sm font-medium text-bone">{label}</span>
      <ExtIcon />
    </a>
  );
}

export function ScreeningDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { screenings, theaters, programs, deleteScreening } = useData();
  const s = screenings.find((x) => x.id === id) ?? null;

  // Lazily resolve the IMDb id from TMDB so the IMDb bar can deep-link.
  const [imdbId, setImdbId] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setImdbId(null);
    const tmdbId = s?.tmdb_id ?? null;
    if (tmdbId) {
      getExternalIds(tmdbId)
        .then((x) => {
          if (active) setImdbId(x.imdb_id ?? null);
        })
        .catch(() => undefined);
    }
    return () => {
      active = false;
    };
  }, [s?.tmdb_id]);

  if (!s) {
    return (
      <div className="py-16 text-center text-bone-dim">
        Screening not found.
        <div className="mt-4">
          <button onClick={() => navigate("/movies")} className="btn-ghost">
            Back to Movies
          </button>
        </div>
      </div>
    );
  }

  const theater = theaters.find((t) => t.id === s.theater_id) ?? null;
  const program = programs.find((p) => p.id === s.membership_program_id) ?? null;

  const when = fmtDate(parseISO(s.showtime), "EEE, MMM d, yyyy · h:mm a");
  const runtime = s.runtime_min ? `${Math.floor(s.runtime_min / 60)}h ${s.runtime_min % 60}m` : null;
  const usd = (n: number): string => `$${n.toFixed(2)}`;
  const formatLine =
    [s.screen_format, s.format_details, s.is_3d ? "3D" : null, s.is_plf ? "PLF" : null]
      .filter(Boolean)
      .join(" · ") || "Standard";
  const metaLine = [runtime, s.mpaa_rating].filter(Boolean).join(" · ");
  const creditsLine = [
    s.during_credits == null ? null : `During-credits ${s.during_credits ? "yes" : "no"}`,
    s.after_credits == null ? null : `After-credits ${s.after_credits ? "yes" : "no"}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const additionalValue = s.additional_tickets_value ?? 0;
  const additionalPaid = s.additional_tickets_cost ?? 0;
  const totalSaved =
    s.ticket_value - s.amount_paid + (additionalValue - additionalPaid);

  const q = encodeURIComponent(s.title);
  const letterboxd = s.tmdb_id
    ? `https://letterboxd.com/tmdb/${s.tmdb_id}/`
    : `https://letterboxd.com/search/films/${q}/`;
  const imdb = imdbId ? `https://www.imdb.com/title/${imdbId}/` : `https://www.imdb.com/find/?q=${q}`;
  // NOTE: Call Sheet's per-film universal-link path is unconfirmed; verify with a
  // real share link from the app and adjust here if needed.
  const callsheet = s.tmdb_id ? `https://callsheetapp.com/movie/${s.tmdb_id}` : "https://callsheetapp.com/";
  const rottentomatoes = `https://www.rottentomatoes.com/search?search=${q}`;

  const onDelete = async () => {
    if (!confirm("Delete this screening? This cannot be undone.")) return;
    await deleteScreening(s.id);
    navigate("/movies");
  };

  return (
    <div className="pb-10">
      <div className="mb-5 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-sm text-bone-dim hover:text-amber">
          ‹ Back
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/edit/${s.id}`)} className="btn-ghost">
            Edit
          </button>
          <button
            onClick={() => void onDelete()}
            aria-label="Delete screening"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/[0.09] bg-white/[0.04] text-bone-faint transition-colors hover:text-negative"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              <path d="M10 11v6M14 11v6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <Poster
          path={s.poster_path}
          title={s.title}
          size="w342"
          className="h-44 w-28 shrink-0 rounded-xl object-cover"
        />
        <div className="min-w-0 flex-1">
          <h1 className="display text-2xl leading-tight text-bone">
            {s.title}
            {s.release_year ? <span className="text-bone-faint"> ({s.release_year})</span> : null}
          </h1>
          {s.director && <div className="mt-1.5 text-sm text-bone-dim">Dir. {s.director}</div>}
          {metaLine && <div className="mt-1 text-sm text-bone-dim">{metaLine}</div>}
          {s.genres.length > 0 && (
            <div className="mt-1 text-sm text-bone-dim">{s.genres.join(", ")}</div>
          )}
        </div>
      </div>

      <div className="card mt-6 p-[18px]">
        <Row label="Date & time" value={when} />
        <Row
          label="Theater"
          value={theater ? `${theater.name}${theater.state ? ` · ${theater.state}` : ""}` : "—"}
        />
        <Row label="Format" value={formatLine} />
        {creditsLine && <Row label="Credits scene" value={creditsLine} />}
        <Row label="Membership" value={program ? program.name : "None"} />
        <Row label="Ticket value" value={usd(s.ticket_value)} />
        <Row label="Amount paid" value={usd(s.amount_paid)} />
        {s.additional_tickets > 0 && (
          <>
            <Row label={`Additional value (${s.additional_tickets})`} value={usd(additionalValue)} />
            <Row label="Additional paid" value={usd(additionalPaid)} />
          </>
        )}
        <Row label="Saved" value={usd(totalSaved)} />
        {s.acquisition && (
          <Row label="Paid via" value={ACQUISITION_LABELS[s.acquisition] ?? s.acquisition} />
        )}
        <Row label="Fees saved" value={usd(s.fees_saved)} />
      </div>

      <div className="mt-6 space-y-2.5">
        <LinkBar href={letterboxd} label="View on Letterboxd" />
        <LinkBar href={imdb} label="View on IMDb" />
        <LinkBar href={callsheet} label="View in Call Sheet" />
        <LinkBar href={rottentomatoes} label="View on Rotten Tomatoes" />
      </div>
    </div>
  );
}
