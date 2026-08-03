import { Link } from "react-router-dom";
import { Avatar, SkillBadge, Stars, VerifiedBadge } from "./ui.jsx";

const VERIFIED_COUNT = (w) =>
  ["identity_verified", "certificate_verified", "compliance_verified"].filter(
    (k) => w[k]
  ).length;

export default function WorkerCard({ worker, onRequest }) {
  const verifiedCount = VERIFIED_COUNT(worker);
  const allVerified = verifiedCount === 3;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-3">
        <Avatar name={worker.name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <Link
              to={`/workers/${worker.id}`}
              className="truncate font-semibold text-gray-900 hover:text-brand-600"
            >
              {worker.name}
            </Link>
            <span
              className={`flex shrink-0 items-center gap-1 text-[11px] font-semibold ${
                worker.availability ? "text-emerald-600" : "text-gray-400"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${worker.availability ? "bg-emerald-500" : "bg-gray-300"}`}
              />
              {worker.availability ? "Online" : "Offline"}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <SkillBadge skill={worker.skill} />
            <Stars rating={worker.rating} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {worker.identity_verified && <VerifiedBadge verified label="identity" />}
            {worker.certificate_verified && <VerifiedBadge verified label="certificate" />}
            {worker.compliance_verified && <VerifiedBadge verified label="compliance" />}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="text-sm text-gray-500">
              {worker.distance_km != null
                ? `${worker.distance_km} km away`
                : `${worker.experience_years || 0} yrs exp`}
            </span>
            <div className="flex items-center gap-2">
              {allVerified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 0 0 1.745-.723 3.066 3.066 0 0 1 3.976 0 3.066 3.066 0 0 0 1.745.723 3.066 3.066 0 0 1 2.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 0 1 0 3.976 3.066 3.066 0 0 0-.723 1.745 3.066 3.066 0 0 1-2.812 2.812 3.066 3.066 0 0 0-1.745.723 3.066 3.066 0 0 1-3.976 0 3.066 3.066 0 0 0-1.745-.723 3.066 3.066 0 0 1-2.812-2.812 3.066 3.066 0 0 0-.723-1.745 3.066 3.066 0 0 1 0-3.976 3.066 3.066 0 0 0 .723-1.745 3.066 3.066 0 0 1 2.812-2.812Zm7.44 5.252a1 1 0 0 0-1.414-1.414L9 10.586 7.707 9.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Fully verified
                </span>
              )}
              <Link
                to={`/workers/${worker.id}`}
                className="rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-800"
              >
                View profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
