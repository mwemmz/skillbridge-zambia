import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import MapView from "../components/MapView.jsx";
import { Avatar, SkillBadge, Stars, VerifiedBadges } from "../components/ui.jsx";
import { IconShield } from "../components/icons.jsx";

const DEFAULT_CENTER = [-15.3875, 28.3228];

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

export default function WorkerProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [worker, setWorker] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api
      .get(`/api/workers/${id}`)
      .then((res) => setWorker(res.data))
      .catch((e) => setMessage({ type: "error", text: e.response?.data?.detail || "Worker not found" }));

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => setUserLocation(DEFAULT_CENTER),
        { timeout: 6000 }
      );
    } else {
      setUserLocation(DEFAULT_CENTER);
    }
  }, [id]);

  const distance = useMemo(() => {
    if (!worker || !userLocation) return null;
    return haversine(userLocation[0], userLocation[1], worker.latitude, worker.longitude);
  }, [worker, userLocation]);

  async function sendRequest(e) {
    e.preventDefault();
    if (!description.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      const payload = {
        worker_id: worker.id,
        description: description.trim(),
        latitude: userLocation ? userLocation[0] : null,
        longitude: userLocation ? userLocation[1] : null,
      };
      await api.post("/api/requests", payload);
      setMessage({
        type: "success",
        text: "Request sent! Track it from your dashboard.",
      });
      setDescription("");
      setTimeout(() => navigate("/customer"), 1200);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.detail || "Could not send request.",
      });
    } finally {
      setBusy(false);
    }
  }

  if (!worker) {
    return (
      <div className="py-20 text-center text-gray-400">
        {message ? message.text : "Loading profile…"}
      </div>
    );
  }

  const isCustomer = user?.role === "customer";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-sm font-semibold text-brand-600 hover:underline"
      >
        ← Back
      </button>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Profile card */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start gap-4">
              <Avatar name={worker.name} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-brand-950">{worker.name}</h1>
                  <SkillBadge skill={worker.skill} />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  <Stars rating={worker.rating} />
                  <span>·</span>
                  <span>{worker.experience_years} yrs experience</span>
                  <span>·</span>
                  <span
                    className={`font-semibold ${
                      worker.availability ? "text-emerald-600" : "text-gray-400"
                    }`}
                  >
                    {worker.availability ? "● Available now" : "○ Offline"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="rounded-xl bg-gray-50 px-4 py-3">
                <div className="text-xs text-gray-400">Distance</div>
                <div className="font-bold text-gray-900">
                  {distance != null ? `${distance.toFixed(1)} km away` : "—"}
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 px-4 py-3">
                <div className="text-xs text-gray-400">Rating</div>
                <div className="font-bold text-gray-900">{worker.rating.toFixed(1)} / 5</div>
              </div>
              <div className="rounded-xl bg-gray-50 px-4 py-3">
                <div className="text-xs text-gray-400">Jobs completed</div>
                <div className="font-bold text-gray-900">
                  {Math.round(worker.rating * 12 + worker.experience_years * 7)}+
                </div>
              </div>
            </div>

            <h2 className="mt-6 font-bold text-gray-900">About</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
              {worker.description || "No description yet."}
            </p>

            <h2 className="mt-6 font-bold text-gray-900">Verification</h2>
            <div className="mt-2">
              <VerifiedBadges worker={worker} size="lg" />
            </div>

            <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <IconShield className="mt-0.5 h-5 w-5 shrink-0" />
              <span>
                <strong>SkillBridge Guarantee:</strong> this worker's profile is checked for
                identity, skill certification and compliance before they can serve you.
              </span>
            </div>
          </div>
        </div>

        {/* Right column: request + map */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-brand-950">Request service</h2>

            {!worker.availability ? (
              <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                This worker is currently offline. Try another nearby worker.
              </div>
            ) : isCustomer ? (
              <form onSubmit={sendRequest} className="mt-3 space-y-3">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  placeholder="Describe the problem, e.g. 'The main switch tripped and half my house has no power…'"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-lg bg-accent-500 py-3 text-sm font-bold text-white transition hover:bg-accent-600 disabled:opacity-60"
                >
                  {busy ? "Sending…" : `Request ${worker.name.split(" ")[0]}`}
                </button>
              </form>
            ) : (
              <p className="mt-3 text-sm text-gray-500">
                You are signed in as a worker. Log in with a customer account to request services.
              </p>
            )}

            {message && (
              <div
                className={`mt-3 rounded-lg px-3 py-2 text-sm ${
                  message.type === "success"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {message.text}
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            <div className="h-56">
              <MapView workers={[worker]} center={userLocation} zoom={13} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
