import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Menu, PackageCheck, X } from "lucide-react";
import { useHealth } from "../../hooks/useApiData";
import { cx } from "../../utils/format";

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/analysis", label: "Analysis" },
  { to: "/results", label: "Results" },
  { to: "/compare", label: "Compare" },
  { to: "/materials", label: "Materials" },
  { to: "/history", label: "History" },
  { to: "/methodology", label: "Methodology" },
];

const StatusDot = () => {
  const { data, isError } = useHealth();
  const connected = Boolean(data?.database?.connected);
  const dbEngine = data?.database?.engine || "Database";
  const label = isError ? "API offline" : !data ? "Checking…" : connected ? `${dbEngine} connected` : "Fallback data";
  const color = isError ? "bg-red-500" : !data ? "bg-slate-300" : connected ? "bg-emerald-500" : "bg-amber-500";
  return (
    <span className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 xl:inline-flex" data-testid="system-status-indicator">
      <span className={cx("h-2 w-2 rounded-full", color)} /> {label}
    </span>
  );
};

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cx(
      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
      isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5" data-testid="nav-logo-link">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <PackageCheck className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-base font-bold text-slate-900">PackIntel</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">SIH260236</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass} data-testid={`nav-link-${l.label.toLowerCase()}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <StatusDot />
          <button
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
            data-testid="nav-mobile-toggle"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden" data-testid="nav-mobile-menu">
          <div className="grid gap-1">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={linkClass} onClick={() => setOpen(false)} data-testid={`nav-mobile-link-${l.label.toLowerCase()}`}>
                {l.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
};
