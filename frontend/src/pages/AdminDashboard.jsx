import { useCallback, useEffect, useState } from "react";
import api from "../api.js";
import {
  IconCheck,
  IconClipboard,
  IconPulse,
  IconShield,
  IconUser,
  IconUsers,
  IconWrench,
} from "../components/icons.jsx";
import { Avatar, SkillBadge, StatusPill, Stars } from "../components/ui.jsx";

const VERIFY_KEYS = [
  { key: "identity_verified", label: "Identity" },
  { key: "certificate_verified", label: "Certificate" },
  { key: "compliance_verified", label: "Compliance" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState("workers");

  const load = useCallback(async () => {
    const [s, w, r, sk] = await Promise.all([
      api.get("/api/admin/stats"),
      api.get("/api/admin/workers"),
      api.get("/api/admin/requests"),
      api.get("/api/admin/skills"),
    ]);
    setStats(s.data);
    setWorkers(w.data);
    setRequests(r.data);
    setSkills(sk.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleVerification(worker, key, value) {
    await api.put(`/api/admin/workers/${worker.id}/verification`, { [key]: value });
    setWorkers((prev) =>
      prev.map((w) => (w.id === worker.id ? { ...w, [key]: value } : w))
    );
    load();
  }

  async function addSkill(e) {
    e.preventDefault();
    if (!newSkill.trim()) return;
    try {
      await api.post("/api/admin/skills", { name: newSkill.trim() });
      setNewSkill("");
      load();
    } catch (err) {
      setNotice(err.response?.data?.detail || "Could not add skill");
      setTimeout(() => setNotice(""), 2500);
    }
  }

  const statCards = stats
    ? [
        { label: "Customers", value: stats.customers, Icon: IconUser },
        { label: "Workers", value: stats.workers, Icon: IconWrench },
        { label: "Service requests", value: stats.requests, Icon: IconClipboard },
        { label: "Online workers", value: stats.online_workers, Icon: IconPulse },
        { label: "Pending verification", value: stats.pending_verification, Icon: IconShield },
      ]
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-extrabold text-brand-950">Admin dashboard</h1>
      <p className="text-sm text-gray-500">
        Manage verification, skill categories and monitor service requests.
      </p>

      {notice && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{notice}</div>
      )}

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((c) => {
          const Glyph = c.Icon;
          return (
            <div
              key={c.label}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Glyph className="h-5 w-5" />
              </div>
              <div className="mt-3 text-3xl font-extrabold text-brand-950">{c.value}</div>
              <div className="text-xs font-medium text-gray-500">{c.label}</div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-2">
        {[
          ["workers", "Workers & verification"],
          ["requests", "Service requests"],
          ["skills", "Skill categories"],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === k
                ? "bg-brand-700 text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:border-brand-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Workers */}
      {tab === "workers" && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Worker</th>
                  <th className="px-4 py-3">Skill</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Identity</th>
                  <th className="px-4 py-3">Certificate</th>
                  <th className="px-4 py-3">Compliance</th>
                  <th className="px-4 py-3">All verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {workers.map((w) => {
                  const all = w.identity_verified && w.certificate_verified && w.compliance_verified;
                  return (
                    <tr key={w.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={w.name} size="sm" />
                          <div>
                            <div className="font-semibold text-gray-900">{w.name}</div>
                            <div className="text-xs text-gray-400">{w.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <SkillBadge skill={w.skill} />
                      </td>
                      <td className="px-4 py-3">
                        <Stars rating={w.rating} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold ${
                            w.availability ? "text-emerald-600" : "text-gray-400"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${w.availability ? "bg-emerald-500" : "bg-gray-300"}`}
                          />
                          {w.availability ? "Online" : "Offline"}
                        </span>
                      </td>
                      {VERIFY_KEYS.map(({ key, label }) => (
                        <td key={key} className="px-4 py-3">
                          <button
                            onClick={() => toggleVerification(w, key, !w[key])}
                            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                              w[key]
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                            }`}
                          >
                            <span
                              className={`flex h-3.5 w-3.5 items-center justify-center rounded border ${
                                w[key] ? "border-emerald-500 bg-emerald-500 text-white" : "border-gray-300"
                              }`}
                            >
                              {w[key] && <IconCheck className="h-3 w-3" />}
                            </span>
                            {w[key] ? label : `Approve ${label}`}
                          </button>
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        {all ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                            <IconShield className="h-3.5 w-3.5" />
                            Fully verified
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                            Incomplete
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Requests */}
      {tab === "requests" && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Worker</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                      No service requests yet.
                    </td>
                  </tr>
                )}
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-500">#{r.id}</td>
                    <td className="px-4 py-3 text-gray-900">{r.customer_name}</td>
                    <td className="px-4 py-3 text-gray-900">{r.worker_name}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-gray-600">{r.description}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Skills */}
      {tab === "skills" && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-gray-900">Skill categories</h3>
            <div className="mt-4 space-y-2">
              {skills.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5"
                >
                  <span className="text-sm font-medium text-gray-800">{s.name}</span>
                  <SkillBadge skill={s.name} />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-gray-900">Add a skill category</h3>
            <form onSubmit={addSkill} className="mt-4 flex gap-2">
              <input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="e.g. Painter"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
              <button
                type="submit"
                className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-800"
              >
                Add
              </button>
            </form>
            <p className="mt-3 text-xs text-gray-400">
              New categories immediately become available when workers choose their skill.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
