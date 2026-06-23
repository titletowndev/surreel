import { NavLink, Route, Routes, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/state/auth";
import { Login } from "@/pages/Login";
import { Home } from "@/pages/Home";
import { Movies } from "@/pages/Movies";
import { Screens } from "@/pages/Screens";
import { Rewind } from "@/pages/Rewind";
import { Settings } from "@/pages/Settings";
import { AddEditScreening } from "@/pages/AddEditScreening";
import { ScreeningDetail } from "@/pages/ScreeningDetail";
import { HowISpend } from "@/pages/analytics/HowISpend";
import { WhatIWatch } from "@/pages/analytics/WhatIWatch";
import { WhereIWatch } from "@/pages/analytics/WhereIWatch";
import { WhenIWatched } from "@/pages/analytics/WhenIWatched";

const TABS = [
  { to: "/", label: "Home", icon: "◉" },
  { to: "/movies", label: "Movies", icon: "▦" },
  { to: "/screens", label: "Screens", icon: "▢" },
  { to: "/rewind", label: "Rewind", icon: "↺" },
];

function Chrome({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const hideTabs = location.pathname.startsWith("/add") || location.pathname.startsWith("/edit") || location.pathname.startsWith("/movie/");

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-[18px]">
      <header className="sticky top-0 z-30 -mx-[18px] flex items-center justify-between px-[18px] py-4"
        style={{ background: "linear-gradient(#000 35%, rgba(0,0,0,0))" }}>
        <Link to="/" className="flex items-center gap-2.5">
          <span className="relative h-[25px] w-[25px] rounded-full border-[1.5px] border-bone/90">
            <span className="absolute inset-[7px] rounded-full bg-bone/90" />
          </span>
          <span className="text-[19px] font-semibold tracking-[-0.01em] text-bone">Surreel</span>
        </Link>
        <Link
          to="/settings"
          className="grid h-[34px] w-[34px] place-items-center rounded-full border border-white/[0.09] bg-white/[0.06] text-bone-dim transition-colors hover:text-bone"
          aria-label="Settings"
          style={{ backdropFilter: "blur(20px)" }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>
      </header>

      <main className="flex-1 pb-32 pt-2">{children}</main>

      {!hideTabs && (
        <nav className="fixed inset-x-0 bottom-4 z-30 mx-auto max-w-3xl px-[18px]">
          <div
            className="flex rounded-[22px] border border-white/[0.09] p-2 shadow-card"
            style={{ background: "rgba(30,30,32,0.55)", backdropFilter: "blur(30px) saturate(180%)" }}
          >
            {TABS.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.to === "/"}
                className={({ isActive }) =>
                  `flex flex-1 flex-col items-center gap-1 rounded-2xl py-1.5 text-[11px] font-semibold transition-colors ${
                    isActive ? "text-bone" : "text-bone-dim hover:text-bone"
                  }`
                }
              >
                <span className="text-lg leading-none">{t.icon}</span>
                {t.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}

export default function App() {
  const { user, loading, configured } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="display animate-flicker text-2xl text-amber">Surreel</div>
      </div>
    );
  }

  if (configured && !user) {
    return <Login />;
  }

  return (
    <Chrome>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/spend" element={<HowISpend />} />
        <Route path="/watch" element={<WhatIWatch />} />
        <Route path="/where" element={<WhereIWatch />} />
        <Route path="/when" element={<WhenIWatched />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/screens" element={<Screens />} />
        <Route path="/rewind" element={<Rewind />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/add" element={<AddEditScreening />} />
        <Route path="/edit/:id" element={<AddEditScreening />} />
        <Route path="/movie/:id" element={<ScreeningDetail />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Chrome>
  );
}
