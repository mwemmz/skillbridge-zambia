import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { Stars, SkillBadge } from "./ui.jsx";
import { IconCheck, skillGlyph, skillGlyphSvg } from "./icons.jsx";

const DEFAULT_CENTER = [-15.3875, 28.3228]; // Lusaka, Zambia

function isValidCoord(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function toLatLng(lat, lng, fallback = DEFAULT_CENTER) {
  return isValidCoord(lat) && isValidCoord(lng) ? [lat, lng] : fallback;
}

// react-leaflet's MapContainer ignores `center` changes after mount,
// so re-centre the map whenever the requested center changes.
function RecenterOnChange({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

const POPUP_BADGES = [
  { key: "identity_verified", label: "Identity" },
  { key: "certificate_verified", label: "Certificate" },
  { key: "compliance_verified", label: "Compliance" },
];

function workerIcon(worker, active) {
  const glyph = skillGlyph(worker.skill);
  const bg = active ? "#7c3aed" : worker.availability ? glyph.color : "#9ca3af";
  const icon = skillGlyphSvg(worker.skill, "#ffffff", 22);
  return L.divIcon({
    className: "",
    html: `
      <div class="sb-pin ${active ? "sb-pin-active" : ""}" style="background:${bg}">
        ${icon}
        <span class="sb-pin-dot" style="background:${worker.availability ? "#10b981" : "#9ca3af"}"></span>
      </div>
    `,
    iconSize: [46, 46],
    iconAnchor: [23, 43],
    popupAnchor: [0, -40],
  });
}

function customerIcon() {
  return L.divIcon({
    className: "",
    html: `
      <div class="sb-customer">
        <div class="sb-customer-core"></div>
      </div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

export default function MapView({ workers = [], center, tracked, onSelect, zoom = 14 }) {
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .sb-pin {
        position: relative;
        display: flex; align-items: center; justify-content: center;
        width: 46px; height: 46px;
        border-radius: 9999px 9999px 9999px 6px;
        border: 3px solid #fff;
        box-shadow: 0 6px 14px rgba(13, 23, 51, .35);
        transform: rotate(0deg);
      }
      .sb-pin svg { transform: rotate(0deg); }
      .sb-pin-dot {
        position: absolute; top: -2px; right: -2px;
        width: 12px; height: 12px; border-radius: 9999px;
        border: 2px solid #fff;
        background: #10b981;
      }
      .sb-pin.sb-pin-active { animation: sb-float 1.4s ease-in-out infinite; box-shadow: 0 0 0 8px rgba(124, 58, 237, .2); }
      .sb-customer { position: relative; width: 18px; height: 18px; }
      .sb-customer-core {
        position: absolute; inset: 0;
        border-radius: 9999px; background: #1e40d8;
        border: 3px solid #fff; box-shadow: 0 2px 8px rgba(13, 23, 51, .45);
      }
      .sb-customer-core::before {
        content: ""; position: absolute; inset: -6px;
        border-radius: 9999px; border: 2px solid rgba(30, 64, 216, .35);
        animation: sb-ping 1.8s ease-out infinite;
      }
      @keyframes sb-ping { 0% { transform: scale(.6); opacity: .9; } 100% { transform: scale(1.4); opacity: 0; } }
      @keyframes sb-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const mapCenter = useMemo(() => toLatLng(center?.[0], center?.[1]), [center]);
  const safeWorkers = useMemo(
    () =>
      workers.filter((w) => isValidCoord(w?.latitude) && isValidCoord(w?.longitude)),
    [workers]
  );
  const safeTracked = useMemo(
    () =>
      tracked && isValidCoord(tracked.latitude) && isValidCoord(tracked.longitude)
        ? tracked
        : null,
    [tracked]
  );

  return (
    <div className="z-0 isolate h-full w-full">
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
      <RecenterOnChange center={mapCenter} />
      <TileLayer
        attribution='&copy; <a href="https://www.esri.com">Esri</a> &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
        errorTileUrl="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Crect width='100%25' height='100%25' fill='%23eef2f7'/%3E%3C/svg%3E"
      />

      {center && safeWorkers.length > 0 && (
        <Marker
          position={toLatLng(center[0], center[1])}
          icon={customerIcon()}
          zIndexOffset={1000}
        >
          <Popup>
            <strong>Your location</strong>
          </Popup>
        </Marker>
      )}

      {safeWorkers.map((w) => (
        <Marker
          key={w.id}
          position={[w.latitude, w.longitude]}
          icon={workerIcon(w, false)}
        >
          <Popup>
            <div className="min-w-[180px]">
              <div className="font-bold text-gray-900">{w.name}</div>
              <div className="mb-1 mt-1 flex items-center gap-1.5">
                <SkillBadge skill={w.skill} />
                <Stars rating={w.rating} />
              </div>
              <div className="text-xs text-gray-500">
                {w.distance_km != null ? `${w.distance_km} km away · ` : ""}
                {w.availability ? (
                  <span className="font-semibold text-emerald-600">Online</span>
                ) : (
                  <span className="text-gray-400">Offline</span>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {POPUP_BADGES.filter((b) => w[b.key]).map((b) => (
                  <span
                    key={b.key}
                    className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700"
                  >
                    <IconCheck className="h-3 w-3" />
                    {b.label}
                  </span>
                ))}
              </div>
              {onSelect && (
                <button
                  onClick={() => onSelect(w)}
                  className="mt-2 w-full rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800"
                >
                  View profile
                </button>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      {safeTracked && (
        <Marker
          position={[safeTracked.latitude, safeTracked.longitude]}
          icon={workerIcon({ ...safeTracked, availability: true }, true)}
          zIndexOffset={2000}
        >
          <Popup>
            <div className="min-w-[180px]">
              <div className="font-bold text-gray-900">{safeTracked.name}</div>
              <div className="text-xs font-semibold text-violet-600">
                Moving toward you
              </div>
            </div>
          </Popup>
        </Marker>
      )}
      </MapContainer>
    </div>
  );
}
