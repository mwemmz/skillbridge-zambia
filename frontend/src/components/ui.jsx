const VERIFIED_STYLES = {
  identity: "bg-emerald-50 text-emerald-700 border-emerald-200",
  certificate: "bg-emerald-50 text-emerald-700 border-emerald-200",
  compliance: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function Stars({ rating, size = "text-sm" }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${size}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={`h-3.5 w-3.5 ${
            rating >= i - 0.25 ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"
          }`}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 0 0 .95.69h4.163c.969 0 1.371 1.24.588 1.81l-3.369 2.448a1 1 0 0 0-.363 1.118l1.287 3.957c.3.922-.755 1.688-1.539 1.118l-3.37-2.447a1 1 0 0 0-1.176 0l-3.37 2.447c-.783.57-1.838-.196-1.538-1.118l1.286-3.957a1 1 0 0 0-.363-1.118L2.06 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 0 0 .95-.69l1.287-3.958Z" />
        </svg>
      ))}
      <span className="ml-1 font-semibold text-gray-800">{rating?.toFixed(1)}</span>
    </span>
  );
}

export function VerifiedBadge({ verified, label }) {
  if (!verified) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${VERIFIED_STYLES[label]}`}
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
          clipRule="evenodd"
        />
      </svg>
      {label === "identity" ? "Identity Verified" : label === "certificate" ? "Skill Certificate" : "Compliance Checked"}
    </span>
  );
}

export function VerifiedBadges({ worker, size = "md" }) {
  const badges = [
    { key: "identity_verified", label: "identity", text: "Identity Verified" },
    { key: "certificate_verified", label: "certificate", text: "Skill Certificate Verified" },
    { key: "compliance_verified", label: "compliance", text: "Compliance Checked" },
  ];
  const showAll = size === "lg";
  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((b) => {
        const verified = Boolean(worker[b.key]);
        if (!showAll && !verified) return null;
        return (
          <span
            key={b.key}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
              verified
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-gray-200 bg-gray-50 text-gray-400"
            }`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                clipRule="evenodd"
              />
            </svg>
            {verified ? b.text : `Pending: ${b.text.replace(" Verified", "")}`}
          </span>
        );
      })}
    </div>
  );
}

export function StatusPill({ status }) {
  const map = {
    REQUESTED: "bg-amber-100 text-amber-800 border-amber-200",
    ACCEPTED: "bg-sky-100 text-sky-800 border-sky-200",
    ON_THE_WAY: "bg-violet-100 text-violet-800 border-violet-200",
    COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    DECLINED: "bg-red-100 text-red-700 border-red-200",
    CANCELLED: "bg-gray-100 text-gray-600 border-gray-200",
  };
  const dots = {
    REQUESTED: "bg-amber-500",
    ACCEPTED: "bg-sky-500",
    ON_THE_WAY: "bg-violet-500",
    COMPLETED: "bg-emerald-500",
    DECLINED: "bg-red-500",
    CANCELLED: "bg-gray-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${map[status] || map.REQUESTED}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dots[status] || dots.REQUESTED} ${status === "ON_THE_WAY" ? "pulse-dot relative" : ""}`} />
      {status?.replace("_", " ")}
    </span>
  );
}

export function Avatar({ name, size = "md" }) {
  const sizes = {
    sm: "h-9 w-9 text-sm",
    md: "h-12 w-12 text-lg",
    lg: "h-20 w-20 text-2xl",
  };
  const initials = name
    ? name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-900 font-bold text-white ${sizes[size]}`}
    >
      {initials}
    </div>
  );
}

export function SkillBadge({ skill }) {
  if (!skill) return null;
  const palette = {
    Electrician: "bg-yellow-100 text-yellow-800",
    Plumber: "bg-sky-100 text-sky-800",
    Welder: "bg-orange-100 text-orange-800",
    Mechanic: "bg-rose-100 text-rose-800",
    Carpenter: "bg-amber-100 text-amber-800",
    "Solar Installer": "bg-emerald-100 text-emerald-800",
  };
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${
        palette[skill] || "bg-brand-100 text-brand-800"
      }`}
    >
      {skill}
    </span>
  );
}
