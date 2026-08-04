import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import MapView from "../components/MapView.jsx";
import { IconCheck, IconMapPin, IconPause, IconPlay, IconTruck, IconWrench } from "../components/icons.jsx";
import { Avatar, SkillBadge, Stars, StatusPill, VerifiedBadges } from "../components/ui.jsx";

const ACTIVE_STATUSES = ["REQUESTED", "ACCEPTED", "ON_THE_WAY"];
const DEFAULT_CENTER = [-15.3875, 28.3228];

export default function WorkerDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [requests, setRequests] = useState([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const wsRef = useRef(null);
  const simRef = useRef(null);
  const descRef = useRef(null);
  const [simulating, setSimulating] = useState(false);
  const [livePos, setLivePos] = useState(null);

  const loadProfile = useCallback(async () => {
    const res = await api.get("/api/workers/me");
    setProfile(res.data);
    setLivePos((prev) => prev || { latitude: res.data.latitude, longitude: res.data.longitude });
  }, []);

  const loadRequests = useCallback(async () => {
    const res = await api.get("/api/requests/for-me");
    setRequests(res.data);
  }, []);

  useEffect(() => {
    loadProfile();
    api.get("/api/workers/skills").then((res) => setSkills(res.data)).catch(() => {});
    const t = setInterval(loadRequests, 4000);
    return () => clearInterval(t);
  }, [loadProfile, loadRequests]);

  // Worker's own WebSocket feed for location broadcasting
  useEffect(() => {
    if (!profile) return;
    const token = sessionStorage.getItem("sb_token");
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const url = `${proto}://${window.location.host}/ws/location/${profile.id}?token=${token}`;
    let retry = null;

    const connect = () => {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onopen = () => {
        sendLocation(profile.latitude, profile.longitude);
      };
      ws.onclose = () => {
        if (retry) clearTimeout(retry);
        retry = setTimeout(connect, 2500);
      };
    };
    connect();

    return () => {
      if (retry) clearTimeout(retry);
      if (wsRef.current) wsRef.current.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const sendLocation = (lat, lng) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "location", latitude: lat, longitude: lng }));
    }
  };

  const activeRequest =
    requests.find((r) => ACTIVE_STATUSES.includes(r.status)) || null;

  const onTrip =
    activeRequest && ["ACCEPTED", "ON_THE_WAY"].includes(activeRequest.status);

  async function setStatus(requestId, status) {
    setBusy(true);
    try {
      await api.put(`/api/requests/${requestId}/status`, { status });
      await Promise.all([loadRequests(), loadProfile()]);
    } catch (e) {
      setNotice(e.response?.data?.detail || "Action failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleAvailability() {
    if (!profile) return;
    const res = await api.put("/api/workers/me", {
      availability: !profile.availability,
    });
    setProfile(res.data);
    setNotice(
      res.data.availability
        ? "You are now online — customers can see you."
        : "You are now offline."
    );
    setTimeout(() => setNotice(""), 2500);
  }

  function startSimulation() {
    if (!activeRequest || !profile) return;
    setSimulating(true);
    let lat = livePos?.latitude ?? profile.latitude;
    let lng = livePos?.longitude ?? profile.longitude;
    const targetLat = activeRequest.latitude;
    const targetLng = activeRequest.longitude;

    simRef.current = setInterval(async () => {
      const dLat = targetLat - lat;
      const dLng = targetLng - lng;
      if (Math.abs(dLat) < 0.0006 && Math.abs(dLng) < 0.0006) {
        clearInterval(simRef.current);
        setSimulating(false);
        await setStatus(activeRequest.id, "COMPLETED");
        return;
      }
      lat += dLat * 0.16;
      lng += dLng * 0.16;
      const next = { latitude: lat, longitude: lng };
      setLivePos(next);
      sendLocation(lat, lng);
    }, 1400);
  }

  function stopSimulation() {
    if (simRef.current) clearInterval(simRef.current);
    setSimulating(false);
  }

  useEffect(() => {
    return () => {
      if (simRef.current) clearInterval(simRef.current);
    };
  }, []);

  const mapCenter = onTrip
    ? [activeRequest.latitude, activeRequest.longitude]
    : [profile?.latitude ?? DEFAULT_CENTER[0], profile?.longitude ?? DEFAULT_CENTER[1]];

  const selfWorker = profile
    ? {
        ...profile,
        latitude: livePos?.latitude ?? profile.latitude,
        longitude: livePos?.longitude ?? profile.longitude,
      }
    : null;

  if (!profile) {
    return <div className="py-20 text-center text-gray-400">Loading dashboard…</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {notice && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
          {notice}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <Avatar name={profile.name} size="lg" />
              <div className="min-w-0">
                <h1 className="text-xl font-extrabold text-brand-950">{profile.name}</h1>
                <div className="mt-1 flex items-center gap-2">
                  <SkillBadge skill={profile.skill} />
                  <Stars rating={profile.rating} />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-sm font-semibold">
                <span className="text-gray-700">Availability</span>
                <span
                  className={`inline-flex items-center gap-1.5 ${
                    profile.availability ? "text-emerald-600" : "text-gray-400"
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${profile.availability ? "bg-emerald-500 pulse-dot relative" : "bg-gray-300"}`}
                  />
                  {profile.availability ? "Online" : "Offline"}
                </span>
              </div>
              <button
                onClick={toggleAvailability}
                className={`w-full rounded-lg py-2.5 text-sm font-bold text-white transition ${
                  profile.availability
                    ? "bg-gray-500 hover:bg-gray-600"
                    : "bg-accent-500 hover:bg-accent-600"
                }`}
              >
                {profile.availability ? "Go offline" : "Go online"}
              </button>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">Skill</label>
              <select
                value={profile.skill_id || ""}
                onChange={async (e) => {
                  const res = await api.put("/api/workers/me", { skill_id: Number(e.target.value) });
                  setProfile(res.data);
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
              >
                <option value="">Select skill…</option>
                {skills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3">
              <label className="mb-1 block text-sm font-medium text-gray-700">About me</label>
              <textarea
                ref={descRef}
                defaultValue={profile.description}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
              <button
                onClick={async () => {
                  const res = await api.put("/api/workers/me", {
                    description: descRef.current?.value,
                  });
                  setProfile(res.data);
                  setNotice("Profile saved");
                  setTimeout(() => setNotice(""), 2000);
                }}
                className="mt-2 w-full rounded-lg border border-brand-200 bg-brand-50 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100"
              >
                Save profile
              </button>
            </div>

            <div className="mt-4 border-t border-gray-100 pt-3">
              <VerifiedBadges worker={profile} size="lg" />
            </div>
          </div>

          {/* Live map */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            <div className="h-64">
              <MapView workers={selfWorker ? [selfWorker] : []} center={mapCenter} zoom={14} />
            </div>
            <div className="flex items-center gap-1.5 border-t border-gray-200 bg-white px-4 py-2 text-xs text-gray-500">
              {onTrip ? (
                <>
                  <IconMapPin className="h-3.5 w-3.5 shrink-0 text-brand-600" />
                  <span>
                    <strong>{activeRequest.customer_name}</strong> is your destination
                  </span>
                </>
              ) : (
                <>
                  <IconMapPin className="h-3.5 w-3.5 shrink-0 text-brand-600" />
                  <span>This is your worker location</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Requests */}
        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-lg font-extrabold text-brand-950">Service requests</h2>

          {/* Active job action bar */}
          {onTrip && (
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">
                      Job for {activeRequest.customer_name}
                    </span>
                    <StatusPill status={activeRequest.status} />
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{activeRequest.description}</p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  {activeRequest.status === "ACCEPTED" && (
                    <button
                      onClick={() => setStatus(activeRequest.id, "ON_THE_WAY")}
                      disabled={busy}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60"
                    >
                      <IconTruck className="h-4 w-4" />
                      Start trip
                    </button>
                  )}
                  {activeRequest.status === "ON_THE_WAY" && (
                    <>
                      {!simulating ? (
                        <button
                          onClick={startSimulation}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-800"
                        >
                          <IconPlay className="h-4 w-4" />
                          Simulate travel
                        </button>
                      ) : (
                        <button
                          onClick={stopSimulation}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gray-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-gray-600"
                        >
                          <IconPause className="h-4 w-4" />
                          Pause
                        </button>
                      )}
                      <button
                        onClick={() => setStatus(activeRequest.id, "COMPLETED")}
                        disabled={busy}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-accent-600 disabled:opacity-60"
                      >
                        <IconCheck className="h-4 w-4" />
                        Complete job
                      </button>
                    </>
                  )}
                </div>
              </div>
              {activeRequest.status === "ON_THE_WAY" && (
                <div className="mt-3 rounded-lg bg-white px-3 py-2 text-xs text-gray-600">
                  {simulating
                    ? "Simulating live movement — the customer can now watch your marker move on their map."
                    : "Press “Simulate travel” to demonstrate live location tracking to the customer."}
                </div>
              )}
            </div>
          )}

          {requests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 text-gray-300">
                <IconWrench className="h-8 w-8" />
              </div>
              <div className="mt-3 text-sm font-semibold text-gray-600">No requests yet</div>
              <div className="mt-1 text-sm text-gray-400">
                Go online and wait for a customer to request your service.
              </div>
            </div>
          ) : (
            requests.map((r) => {
              const isActive = ACTIVE_STATUSES.includes(r.status);
              return (
                <div
                  key={r.id}
                  className={`rounded-2xl border bg-white p-5 shadow-sm ${
                    isActive ? "border-brand-300" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.customer_name} size="sm" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{r.customer_name}</span>
                          <StatusPill status={r.status} />
                        </div>
                        <div className="text-xs text-gray-400">
                          Request #{r.id} · {new Date(r.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <SkillBadge skill={r.worker_skill} />
                  </div>
                  <p className="mt-3 text-sm text-gray-700">{r.description}</p>

                  {r.status === "REQUESTED" && (
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <button
                        onClick={() => setStatus(r.id, "ACCEPTED")}
                        disabled={busy}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-accent-600 disabled:opacity-60"
                      >
                        <IconCheck className="h-4 w-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => setStatus(r.id, "DECLINED")}
                        disabled={busy}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                  {(r.status === "ACCEPTED" || r.status === "ON_THE_WAY") && (
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">
                      <IconCheck className="h-3.5 w-3.5" />
                      Accepted — use the action bar above to update the job status.
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
