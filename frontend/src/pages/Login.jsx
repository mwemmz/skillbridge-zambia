import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { serverError } from "../api.js";

const QUICK_LOGIN = [
  { label: "Customer", email: "customer@skillbridge.com", password: "demo123" },
  { label: "Worker", email: "worker1@skillbridge.com", password: "demo123" },
  { label: "Admin", email: "admin@skillbridge.com", password: "admin123" },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next");
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await login(form.email, form.password);
      const target =
        next && next.startsWith("/")
          ? next
          : user.role === "worker"
            ? "/worker"
            : user.role === "admin"
              ? "/admin"
              : "/customer";
      navigate(target);
    } catch (err) {
      setError(serverError(err, "Login failed. Check your credentials."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-extrabold text-brand-950">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500">
            Log in to find or offer verified skilled services.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-brand-700 py-3 text-sm font-bold text-white transition hover:bg-brand-800 disabled:opacity-60"
            >
              {busy ? "Signing in…" : "Log in"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            New here?{" "}
            <Link to="/register" className="font-semibold text-brand-600 hover:underline">
              Create an account
            </Link>
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wide text-gray-400">
            One-click demo login
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {QUICK_LOGIN.map((q) => (
              <button
                key={q.email}
                onClick={() => setForm({ email: q.email, password: q.password })}
                className="rounded-lg border border-gray-200 px-2 py-2 text-xs font-semibold text-brand-700 transition hover:border-brand-300 hover:bg-brand-50"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
