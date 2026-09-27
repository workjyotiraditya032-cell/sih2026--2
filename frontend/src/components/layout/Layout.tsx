import { ReactNode, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";

const Footer = () => (
  <footer className="border-t border-slate-200 bg-white">
    <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
      <p>
        <span className="font-semibold text-slate-700">PackIntel</span> · AI-assisted food packaging decision support ·
        SIH260236 prototype
      </p>
      <div className="flex gap-5">
        <Link to="/methodology" className="hover:text-slate-900" data-testid="footer-methodology-link">Methodology</Link>
        <Link to="/materials" className="hover:text-slate-900" data-testid="footer-materials-link">Material Library</Link>
        <a href={`${(process.env.VITE_API_BASE_URL || process.env.REACT_APP_BACKEND_URL || "https://sih2026-2-j71x.onrender.com").replace(/\/+$/, "").replace(/\/api$/, "")}/api/docs`} target="_blank" rel="noreferrer" className="hover:text-slate-900" data-testid="footer-api-docs-link">
          API Docs
        </a>
      </div>
    </div>
  </footer>
);

export const Layout = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export const PageContainer = ({ children }: { children: ReactNode }) => (
  <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">{children}</div>
);
