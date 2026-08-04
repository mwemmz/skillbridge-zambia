import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { IconMenu, IconX } from "./icons.jsx";

const ROLE_LABELS = { customer: "Customer", worker: "Worker", admin: "Admin" };

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-brand-800 bg-brand-950 text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4">
        <Link to={user ? "/" : "/"} className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-500 font-extrabold text-white">
            SB
          </span>
          <div className="leading-tight">
            <div className="truncate text-base font-extrabold tracking-tight sm:text-lg">
              SkillBridge <span className="text-accent-400">Zambia</span>
            </div>
            <div className="hidden text-[11px] text-brand-200 sm:block">
              Verified skills. Trusted services. Anywhere.
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden items-center gap-2 rounded-full bg-brand-800 px-3 py-1.5 text-sm md:flex">
                <span className="h-2 w-2 rounded-full bg-accent-400" />
                {user.name}
                <span className="rounded bg-brand-700 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                  {ROLE_LABELS[user.role] || user.role}
                </span>
              </span>
              <button
                onClick={handleLogout}
                className="hidden rounded-lg border border-brand-700 px-3 py-1.5 text-sm font-medium transition hover:bg-brand-800 md:inline-flex"
              >
                Sign out
              </button>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Menu"
                aria-expanded={menuOpen}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-brand-700 transition hover:bg-brand-800 md:hidden"
              >
                {menuOpen ? <IconX className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-lg px-3 py-1.5 text-sm font-medium transition hover:bg-brand-800"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-accent-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-accent-600 sm:px-4"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      </div>

      {user && menuOpen && (
        <div className="border-t border-brand-800 bg-brand-950 px-4 py-4 md:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-800 text-lg font-bold text-accent-400">
              {user.name
                ?.split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate font-bold">{user.name}</div>
              <div className="text-xs uppercase tracking-wide text-brand-300">
                {ROLE_LABELS[user.role] || user.role}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 w-full rounded-lg border border-brand-700 py-2.5 text-sm font-semibold text-brand-100 transition hover:bg-brand-800"
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
