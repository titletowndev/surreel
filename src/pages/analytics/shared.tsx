import { Link } from "react-router-dom";

/** Back link + page title shared by the four analytics drill-downs. */
export function AnalyticsHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <Link
        to="/"
        className="rounded-lg border border-white/10 px-2.5 py-1 text-sm text-bone-dim hover:text-amber"
        aria-label="Back to Home"
      >
        ‹ Home
      </Link>
      <h1 className="display text-2xl text-bone">{title}</h1>
    </div>
  );
}
