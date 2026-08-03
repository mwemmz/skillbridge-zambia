import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ROLE_LABELS = { customer: "Customer", worker: "Worker", admin: "Admin" };

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-brand-800 bg-brand-950 text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to={user ? `/` : "/"} className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500 font-extrabold text-white">
            SB
          </span>
          <div className="leading-tight">
            <div className="text-lg font-extrabold tracking-tight">
              SkillBridge <span className="text-accent-400">Zambia</span>
            </div>
            <div className="hidden text-[11px] text-brand-200 sm:block">
              Verified skills. Trusted services. Anywhere.
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden items-center gap-2 rounded-full bg-brand-800 px-3 py-1.5 text-sm sm:flex">
                <span className="h-2 w-2 rounded-full bg-accent-400" />
                {user.name}
                <span className="rounded bg-brand-700 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                  {ROLE_LABELS[user.role] || user.role}
                </span>
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-brand-700 px-3 py-1.5 text-sm font-medium transition hover:bg-brand-800"
              >
                Sign out
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
                className="rounded-lg bg-accent-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-accent-600"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
