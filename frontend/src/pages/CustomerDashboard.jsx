import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import MapView from "../components/MapView.jsx";
import WorkerCard from "../components/WorkerCard.jsx";
import { IconMapPin, IconMenu, IconSearch, IconX } from "../components/icons.jsx";
import { Avatar, StatusPill, SkillBadge } from "../components/ui.jsx";

const DEFAULT_CENTER = [-15.3875, 28.3228]; // Lusaka, Zambia
const SKILLS = ["Electrician", "Plumber", "Welder", "Mechanic", "Carpenter", "Solar Installer"];
const ACTIVE_STATUSES = ["REQUESTED", "ACCEPTED", "ON_THE_WAY"];

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [userLocation, setUserLocation] = useState(null);
  const [skill, setSkill] = useState("");
  const [search, setSearch] = useState(() => searchParams.get("q") || "");
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRequest, setActiveRequest] = useState(null);
  const [trackedPos, setTrackedPos] = useState(null);
  const [view, setView] = useState(() =>
    searchParams.get("view") === "list" ? "list" : "map"
  );
  const wsRef = useRef(null);

  // Client-side search across service (skill) and worker name
  const filteredWorkers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return workers;
    return workers.filter(
      (w) =>
        (w.skill || "").toLowerCase().includes(q) ||
        (w.name || "").toLowerCase().includes(q)
    );
  }, [workers, search]);

  // 1. Resolve customer location (geolocation → fallback to Lusaka centre)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => setUserLocation(DEFAULT_CENTER),
        { timeout: 6000 }
      );
    } else {
      setUserLocation(DEFAULT_CENTER);
    }
  }, []);

  // 2. Load nearby workers
  const loadWorkers = useCallback(async (lat, lng, skillName) => {
    if (lat == null || lng == null) return;
    setLoading(true);
    try {
      const res = await api.get("/api/workers/nearby", {
        params: { lat, lng, skill: skillName || undefined },
      });
      setWorkers(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userLocation) loadWorkers(userLocation[0], userLocation[1], skill);
  }, [userLocation, skill, loadWorkers]);

  // 3. Poll active request while one exists
  useEffect(() => {
    if (!activeRequest) return;
    const poll = setInterval(async () => {
      try {
        const res = await api.get(`/api/requests/${activeRequest.id}`);
        if (!ACTIVE_STATUSES.includes(res.data.status)) {
          setActiveRequest(null);
          setTrackedPos(null);
          return;
        }
        setActiveRequest(res.data);
        const wLat = res.data.worker_latitude;
        const wLng = res.data.worker_longitude;
        if (
          typeof wLat === "number" &&
          typeof wLng === "number" &&
          Number.isFinite(wLat) &&
          Number.isFinite(wLng)
        ) {
          setTrackedPos((prev) =>
            prev ? prev : { latitude: wLat, longitude: wLng }
          );
        }
      } catch (e) {
        console.error(e);
      }
    }, 3000);
    return () => clearInterval(poll);
  }, [activeRequest]);

  // 4. WebSocket live tracking for the active worker
  useEffect(() => {
    if (!activeRequest || !["ACCEPTED", "ON_THE_WAY"].includes(activeRequest.status)) return;
    const token = sessionStorage.getItem("sb_token");
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const url = `${proto}://${window.location.host}/ws/location/${activeRequest.worker_id}?token=${token}`;
    let retry = null;

    const connect = () => {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "location") {
            setTrackedPos({ latitude: data.latitude, longitude: data.longitude });
          }
        } catch (err) {
          console.error(err);
        }
      };
      ws.onclose = () => {
        if (retry) clearTimeout(retry);
        retry = setTimeout(connect, 2000);
      };
    };
    connect();
    return () => {
      if (retry) clearTimeout(retry);
      if (wsRef.current) wsRef.current.close();
    };
  }, [activeRequest?.id, activeRequest?.worker_id, activeRequest?.status]);

  // 5. Refresh workers occasionally
  useEffect(() => {
    const t = setInterval(() => {
      if (userLocation) loadWorkers(userLocation[0], userLocation[1], skill);
    }, 20000);
    return () => clearInterval(t);
  }, [userLocation, skill, loadWorkers]);

  // 6. Find the active request among my requests on mount
  useEffect(() => {
    api
      .get("/api/requests/my")
      .then((res) => {
        const active = res.data.find((r) => ACTIVE_STATUSES.includes(r.status));
        if (active) {
          setActiveRequest(active);
          const wLat = active.worker_latitude;
          const wLng = active.worker_longitude;
          if (
            typeof wLat === "number" &&
            typeof wLng === "number" &&
            Number.isFinite(wLat) &&
            Number.isFinite(wLng)
          ) {
            setTrackedPos({ latitude: wLat, longitude: wLng });
          }
        }
      })
      .catch((e) => console.error(e));
  }, []);

  async function cancelRequest() {
    if (!activeRequest) return;
    try {
      const res = await api.put(`/api/requests/${activeRequest.id}/status`, {
        status: "CANCELLED",
      });
      setActiveRequest(null);
      setTrackedPos(null);
      loadWorkers(userLocation[0], userLocation[1], skill);
      void res;
    } catch (e) {
      console.error(e);
    }
  }

  const trackedWorker = useMemo(() => {
    if (!activeRequest || !trackedPos) return null;
    return {
      id: activeRequest.worker_id,
      name: activeRequest.worker_name,
      skill: activeRequest.worker_skill,
      latitude: trackedPos.latitude,
      longitude: trackedPos.longitude,
    };
  }, [activeRequest, trackedPos]);

  const liveDistance = useMemo(() => {
    if (!activeRequest || !trackedPos || !userLocation) return null;
    return haversine(userLocation[0], userLocation[1], trackedPos.latitude, trackedPos.longitude);
  }, [activeRequest, trackedPos, userLocation]);

  const hasRequestFlow =
    activeRequest && ["REQUESTED", "ACCEPTED", "ON_THE_WAY"].includes(activeRequest.status);

  const sidebarContent = (
    <>
      <div className="border-b border-gray-200 p-4">
        <h1 className="text-lg font-extrabold text-brand-950">
          Hello, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-xs text-gray-500">
          Find a verified skilled worker near you
        </p>
        <div className="relative mt-3">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services or workers…"
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-9 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <IconX className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            onClick={() => setSkill("")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              skill === ""
                ? "bg-brand-700 text-white"
                : "border border-gray-200 text-gray-600 hover:border-brand-300"
            }`}
          >
            All
          </button>
          {SKILLS.map((s) => (
            <button
              key={s}
              onClick={() => setSkill(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                skill === s
                  ? "bg-brand-700 text-white"
                  : "border border-gray-200 text-gray-600 hover:border-brand-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={() =>
            navigator.geolocation.getCurrentPosition(
              (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
              () => setUserLocation(DEFAULT_CENTER)
            )
          }
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline"
        >
          <IconMapPin className="h-4 w-4" />
          Use my current location
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {loading && workers.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            Finding nearby workers…
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            {search.trim()
              ? `No services or workers match "${search.trim()}".`
              : `No ${skill || ""} workers nearby right now.`}
          </div>
        ) : (
          filteredWorkers.map((w) => <WorkerCard key={w.id} worker={w} />)
        )}
      </div>

      <div className="border-t border-gray-200 p-3 text-center text-[11px] text-gray-400">
        Showing {filteredWorkers.length} worker
        {filteredWorkers.length === 1 ? "" : "s"} · nearest first
      </div>
    </>
  );

  return (
    <div className="relative flex h-[calc(100vh-4rem)] flex-col">
      {/* Tracking banner */}
      {hasRequestFlow && activeRequest && (
        <div className="border-b border-brand-800 bg-brand-950 px-4 py-3 text-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar name={activeRequest.worker_name} size="sm" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{activeRequest.worker_name}</span>
                  <SkillBadge skill={activeRequest.worker_skill} />
                  <StatusPill status={activeRequest.status} />
                </div>
                <div className="text-xs text-brand-200">{activeRequest.description}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {activeRequest.status === "ON_THE_WAY" && liveDistance != null && (
                <div className="rounded-lg bg-brand-800 px-3 py-1.5 text-sm font-bold text-accent-400">
                  {liveDistance.toFixed(1)} km away
                </div>
              )}
              {activeRequest.status === "REQUESTED" && (
                <span className="text-xs text-amber-300">
                  Waiting for {activeRequest.worker_name} to accept…
                </span>
              )}
              <button
                onClick={cancelRequest}
                className="rounded-lg border border-brand-700 px-3 py-1.5 text-xs font-semibold text-brand-200 hover:bg-brand-800"
              >
                Cancel request
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (desktop only) */}
        <aside className="hidden w-[400px] shrink-0 flex-col border-r border-gray-200 bg-white lg:flex">
          {sidebarContent}
        </aside>

        {/* Mobile: map view (full screen) */}
        <div className={`relative flex-1 lg:block ${view === "map" ? "block" : "hidden"}`}>
          <MapView
            workers={filteredWorkers}
            center={userLocation}
            tracked={trackedWorker}
            onSelect={(w) => navigate(`/workers/${w.id}`)}
          />
        </div>

        {/* Mobile: list view (full screen) */}
        <div
          className={`flex-1 flex-col bg-white lg:hidden ${
            view === "list" ? "flex" : "hidden"
          }`}
        >
          {sidebarContent}
        </div>
      </div>

      {/* Mobile: floating Map / List switcher */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center pb-4 lg:hidden">
        <div className="pointer-events-auto flex overflow-hidden rounded-full bg-brand-950/95 text-white shadow-xl ring-1 ring-black/10">
          <button
            onClick={() => setView("map")}
            aria-pressed={view === "map"}
            className={`inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold transition ${
              view === "map" ? "bg-accent-500 text-white" : "text-brand-200 hover:bg-brand-900"
            }`}
          >
            <IconMapPin className="h-4 w-4" />
            Map
          </button>
          <button
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
            className={`inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold transition ${
              view === "list" ? "bg-accent-500 text-white" : "text-brand-200 hover:bg-brand-900"
            }`}
          >
            <IconMenu className="h-4 w-4" />
            List
            <span
              className={`rounded-full px-1.5 text-xs ${
                view === "list" ? "bg-white/20" : "bg-brand-800 text-brand-200"
              }`}
            >
              {filteredWorkers.length}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
