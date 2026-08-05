import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  IconBolt,
  IconGlobe,
  IconMapPin,
  IconSearch,
  IconShield,
  IconSparkles,
  IconTruck,
  IconUsers,
} from "../components/icons.jsx";

const SKILLS = ["Electrician", "Plumber", "Welder", "Mechanic", "Carpenter", "Solar Installer"];

const STEPS = [
  { n: "01", t: "Tell us what you need", d: "Describe the problem and we match you with nearby verified skilled workers." },
  { n: "02", t: "Choose your worker", d: "Compare verified profiles, ratings and experience before you request." },
  { n: "03", t: "Track them live", d: "Watch your worker move toward you on the map — Yango-style tracking." },
];

const FEATURES = [
  { icon: IconShield, t: "Verified workers", d: "Identity, skill certificate and compliance checks on every worker." },
  { icon: IconMapPin, t: "Nearest first", d: "Location-based matching puts the closest skilled worker at the top." },
  { icon: IconTruck, t: "Live tracking", d: "Real-time location updates while your worker is on the way." },
  { icon: IconBolt, t: "Quick requests", d: "From request to completion in a few taps — no phone calls needed." },
  { icon: IconGlobe, t: "Built for Zambia", d: "Connecting TEVET graduates to real income opportunities." },
  { icon: IconUsers, t: "Trust built in", d: "Ratings, reviews and status updates keep every job transparent." },
];

const DEMO = [
  ["Customer", "customer@skillbridge.com", "demo123", "/login"],
  ["Worker", "worker1@skillbridge.com", "demo123", "/login"],
  ["Admin", "admin@skillbridge.com", "admin123", "/login"],
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  function handleSearch(e) {
    e.preventDefault();
    const q = query.trim();
    if (user) {
      navigate(`/customer?view=list${q ? `&q=${encodeURIComponent(q)}` : ""}`);
    } else {
      navigate(`/login${q ? `?next=/customer?view=list&q=${encodeURIComponent(q)}` : ""}`);
    }
  }

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-950 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 18% 25%, rgba(47,94,240,.65), transparent 45%), radial-gradient(circle at 82% 72%, rgba(16,185,129,.55), transparent 45%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-20 text-center sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-700 bg-brand-800/60 px-4 py-1.5 text-xs font-semibold text-brand-100">
            <IconMapPin className="h-4 w-4 text-accent-400" />
            Made for Zambian skilled workers
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Verified skills.{" "}
            <span className="bg-gradient-to-r from-accent-400 to-accent-500 bg-clip-text text-transparent">
              Trusted services.
            </span>{" "}
            Anywhere.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-100">
            SkillBridge connects customers with nearby verified electricians, plumbers,
            welders and more — with live location tracking, just like a ride-hailing app,
            but for skilled labour.
          </p>

          <form
            onSubmit={handleSearch}
            className="mx-auto mt-8 flex max-w-xl items-stretch gap-2"
          >
            <div className="relative flex-1">
              <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a service… e.g. plumber, welder, solar"
                className="h-full w-full rounded-xl border border-white/10 bg-white py-3.5 pl-12 pr-4 text-sm text-gray-900 shadow-lg outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-accent-400"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-accent-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-accent-500/30 transition hover:bg-accent-600"
            >
              Search
            </button>
          </form>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {user ? (
              <>
                <Link
                  to={
                    user.role === "customer"
                      ? "/customer?view=list"
                      : user.role === "admin"
                        ? "/admin"
                        : "/worker"
                  }
                  className="rounded-xl bg-accent-500 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-accent-500/30 transition hover:-translate-y-0.5 hover:bg-accent-600"
                >
                  {user.role === "customer" ? "Book a service" : "Go to my dashboard"}
                </Link>
                <span className="rounded-xl border border-brand-500 px-8 py-3.5 text-base font-semibold text-brand-100">
                  Welcome back, {user.name?.split(" ")[0]}!
                </span>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="rounded-xl bg-accent-500 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-accent-500/30 transition hover:-translate-y-0.5 hover:bg-accent-600"
                >
                  Find a skilled worker
                </Link>
                <Link
                  to="/login"
                  className="rounded-xl border border-brand-500 px-8 py-3.5 text-base font-semibold text-brand-100 transition hover:bg-brand-800"
                >
                  Log in
                </Link>
              </>
            )}
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {SKILLS.map((s) => (
              <span
                key={s}
                className="rounded-full border border-brand-700 bg-brand-800/50 px-3.5 py-1.5 text-xs font-medium text-brand-100"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold text-brand-950">How SkillBridge works</h2>
            <p className="mt-2 text-gray-500">
              From a problem to a completed job in three simple steps.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-base font-extrabold text-brand-700">
                  {s.n}
                </div>
                <h3 className="mt-4 text-lg font-bold text-gray-900">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold text-brand-950">A marketplace that builds trust</h2>
            <p className="mt-2 text-gray-500">
              Every part of the experience is designed around safety and confidence.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Glyph = f.icon;
              return (
                <div
                  key={f.t}
                  className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white">
                    <Glyph className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-bold text-gray-900">{f.t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{f.d}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Demo accounts */}
      <section className="relative overflow-hidden bg-brand-950 py-16 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 20%, rgba(16,185,129,.5), transparent 45%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <h2 className="text-3xl font-extrabold">Try the live demo</h2>
          <p className="mt-3 text-brand-100">
            Jump straight in with a pre-seeded demo account.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {DEMO.map(([role, email, pass]) => (
              <div key={role} className="rounded-2xl border border-brand-800 bg-brand-900/60 p-5">
                <div className="font-bold text-accent-400">{role}</div>
                <div className="mt-1 text-sm text-brand-100">{email}</div>
                <div className="mt-1 text-sm text-brand-200">password: {pass}</div>
                <Link
                  to="/login"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-600"
                >
                  <IconSparkles className="h-4 w-4" />
                  Open {role} dashboard
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-500">
        SkillBridge Zambia · Semester Entrepreneurship Project MVP ·{" "}
        <span className="font-semibold text-brand-700">
          Verified skills. Trusted services. Anywhere.
        </span>
      </footer>
    </div>
  );
}
