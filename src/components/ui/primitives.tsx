import { useState, type ImgHTMLAttributes, type ReactNode } from "react";
import { posterUrl } from "@/lib/tmdb";

/** Section header — SF Pro, tight tracking, not uppercase. */
export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <h2 className="display text-[22px] text-bone">{children}</h2>
      {action}
    </div>
  );
}

/** A glass stat tile used across the dashboard and analytics pages. */
export function StatTile({
  label,
  value,
  sub,
  accent = false,
  insufficient = false,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: boolean;
  insufficient?: boolean;
}) {
  return (
    <div className="card card-hover p-[18px]">
      <div className="text-xs font-semibold text-bone-dim">{label}</div>
      {insufficient ? (
        <div className="mt-2.5 text-sm font-medium text-bone-faint">Insufficient data</div>
      ) : (
        <div
          className={`display nums mt-2.5 text-2xl leading-tight ${accent ? "text-amber" : "text-bone"}`}
        >
          {value}
        </div>
      )}
      {sub && !insufficient && <div className="mt-1 text-xs font-medium text-bone-dim">{sub}</div>}
    </div>
  );
}

export function Pill({ children, amber = false }: { children: ReactNode; amber?: boolean }) {
  return <span className={amber ? "pill pill-amber" : "pill"}>{children}</span>;
}

/** Poster image with graceful fallback. */
export function Poster({
  path,
  title,
  size = "w185",
  className = "",
  ...rest
}: {
  path: string | null | undefined;
  title: string;
  size?: "w92" | "w154" | "w185" | "w342" | "w500";
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "title">) {
  const [failed, setFailed] = useState(false);
  const url = posterUrl(path, size);
  if (!url || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-ink-700 text-center ${className}`}
        aria-label={title}
      >
        <span className="px-1 text-[10px] font-semibold leading-tight text-bone-faint">{title}</span>
      </div>
    );
  }
  return (
    <img src={url} alt={title} loading="lazy" onError={() => setFailed(true)} className={className} {...rest} />
  );
}

/** iOS-style segmented control. */
export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`seg-item ${value === o.value ? "seg-item-on" : ""}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 p-10 text-center">
      <div className="text-4xl opacity-60">🎬</div>
      <div className="display text-xl text-bone">{title}</div>
      {hint && <p className="max-w-sm text-sm text-bone-dim">{hint}</p>}
      {action}
    </div>
  );
}

export function Insufficient({ note }: { note?: string }) {
  return (
    <div className="card flex items-center justify-center p-8 text-sm text-bone-faint">
      {note ?? "Insufficient data"}
    </div>
  );
}
