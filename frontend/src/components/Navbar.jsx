import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  IconMenu,
  IconX,
  IconMapPin,
  IconWrench,
  IconShield,
  IconSparkles,
} from "./icons.jsx";

const ROLE_LABELS = { customer: "Customer", worker: "Worker", admin: "Admin" };

const MENU_BY_ROLE = {
  customer: [
    {
      label: "Book a service",
      sub: "Find verified skilled workers near you",
      to: "/customer",
      Icon: IconMapPin,
    },
  ],
  worker: [
    {
      label: "My service requests",
      sub: "Accept jobs and manage your trips",
      to: "/worker",
      Icon: IconWrench,
    },
  ],
  admin: [
    {
      label: "Admin dashboard",
      sub: "Verification, skill categories & requests",
      to: "/admin",
      Icon: IconShield,
    },
  ],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate("/");
  }

  const items = user ? [...(MENU_BY_ROLE[user.role] || []), { label: "Home", sub: "Back to the landing page", to: "/", Icon: IconSparkles }] : [];

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
                aria-label="Open menu"
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

      {/* Mobile drawer */}
      {user && (
        <div className={`fixed inset-0 z-40 md:hidden ${menuOpen ? "" : "pointer-events-none"}`}>
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
              menuOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <aside
            className={`absolute inset-y-0 right-0 flex w-[82vw] max-w-xs flex-col bg-white text-brand-950 shadow-2xl transition-transform duration-200 ${
              menuOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="text-sm font-extrabold uppercase tracking-wide text-gray-400">
                Menu
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-900 text-lg font-bold text-white">
                  {user.name
                    ?.split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-bold">{user.name}</div>
                  <span className="mt-0.5 inline-block rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-800">
                    {ROLE_LABELS[user.role] || user.role}
                  </span>
                </div>
              </div>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
              {items.map(({ label, sub, to, Icon }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={label}
                    to={to}
                    className={`flex items-start gap-3 rounded-xl px-3 py-3 transition ${
                      active ? "bg-brand-50 ring-1 ring-brand-100" : "hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        active ? "bg-brand-700 text-white" : "bg-gray-100 text-brand-700"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-gray-900">{label}</span>
                      <span className="block text-xs text-gray-500">{sub}</span>
                    </span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-gray-100 p-3">
              <button
                onClick={handleLogout}
                className="w-full rounded-xl border border-gray-300 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
              >
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
