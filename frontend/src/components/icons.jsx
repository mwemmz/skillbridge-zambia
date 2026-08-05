export function Icon({ children, className = "h-5 w-5", strokeWidth = 1.7 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IconUser = (p) => (
  <Icon {...p}>
    <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.12a7.5 7.5 0 0 1 15 0A17.9 17.9 0 0 1 12 21.75c-2.68 0-5.22-.58-7.5-1.63Z" />
  </Icon>
);

export const IconMenu = (p) => (
  <Icon {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Icon>
);

export const IconSearch = (p) => (
  <Icon {...p}>
    <path d="m21 21-4.35-4.35M17.4 10.65a6.75 6.75 0 1 1-13.5 0 6.75 6.75 0 0 1 13.5 0Z" />
  </Icon>
);

export const IconX = (p) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);

export const IconWrench = (p) => (
  <Icon {...p}>
    <path d="M11.42 15.17 17.25 21A2.65 2.65 0 0 0 21 17.25l-5.88-5.88M11.42 15.17l2.5-3.03c.32-.38.74-.63 1.2-.77M11.42 15.17l-4.65 5.65a2.55 2.55 0 1 1-3.59-3.59l6.84-5.63m5.11-.23c.55-.17 1.16-.19 1.74-.14a4.5 4.5 0 0 0 4.49-6.34l-3.28 3.28a3 3 0 0 1-2.25-2.25l3.28-3.28a4.5 4.5 0 0 0-6.34 4.49c.09 1.07-.07 2.26-.9 2.95l-.1.08m-1.75 1.44L5.9 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.41l4.26 4.26m-1.74 1.44 1.74-1.44m6.61 8.21L15.75 15.75M4.87 19.12h.01v.01h-.01v-.01Z" />
  </Icon>
);

export const IconClipboard = (p) => (
  <Icon {...p}>
    <path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.11c0-1.13-.85-2.1-1.98-2.19a48.4 48.4 0 0 0-1.12-.08m-5.8 0c-.07.21-.1.43-.1.66 0 .42.34.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.66m-5.8 0A2.25 2.25 0 0 1 13.5 2.25H15c1.01 0 1.87.67 2.15 1.59m-5.8 0c-.38.02-.75.05-1.12.08C9.1 4.01 8.25 4.97 8.25 6.11V8.25m0 0H4.88c-.62 0-1.13.5-1.13 1.12v11.25c0 .62.5 1.13 1.13 1.13h9.74c.62 0 1.13-.5 1.13-1.13V9.38c0-.63-.5-1.13-1.13-1.13H8.25ZM6.75 12h.01v.01H6.75V12Zm0 3h.01v.01H6.75V15Zm0 3h.01v.01H6.75V18Z" />
  </Icon>
);

export const IconPulse = (p) => (
  <Icon {...p}>
    <path d="M3.5 12h3.75l2-5 3.5 10 2.5-5h5.75" />
  </Icon>
);

export const IconShield = (p) => (
  <Icon {...p}>
    <path d="M9 12.75 11.25 15 15 9.75m-3-7.04A11.96 11.96 0 0 1 3.6 6 11.99 11.99 0 0 0 3 9.75c0 5.59 3.82 10.29 9 11.62 5.18-1.33 9-6.03 9-11.62 0-1.31-.21-2.57-.6-3.75h-.15c-3.2 0-6.1-1.25-8.25-3.29Z" />
  </Icon>
);

export const IconMapPin = (p) => (
  <Icon {...p}>
    <path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path d="M19.5 10.5c0 7.14-7.5 11.25-7.5 11.25S4.5 17.64 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  </Icon>
);

export const IconBolt = (p) => (
  <Icon {...p}>
    <path d="m13.5 3-8.25 10.5H12L10.5 21l8.25-10.5H12L13.5 3Z" />
  </Icon>
);

export const IconTruck = (p) => (
  <Icon {...p}>
    <path d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.38a1.13 1.13 0 0 1-1.13-1.13V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.13c.62 0 1.13-.5 1.09-1.12a17.9 17.9 0 0 0-3.21-9.2 2.06 2.06 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.18v-.96c0-.56-.42-1.05-.99-1.1a48.55 48.55 0 0 0-10.02 0 1.1 1.1 0 0 0-.99 1.1v7.64m12-6.68v6.68m0 4.5v-4.5m0 0h-12" />
  </Icon>
);

export const IconCheck = (p) => (
  <Icon {...p}>
    <path d="m4.5 12.75 6 6 9-13.5" />
  </Icon>
);

export const IconGlobe = (p) => (
  <Icon {...p}>
    <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
    <path d="M12 3a15.7 15.7 0 0 1 0 18M12 3a15.7 15.7 0 0 0 0 18M3.5 9h17M3.5 15h17" />
  </Icon>
);

export const IconSparkles = (p) => (
  <Icon {...p}>
    <path d="M12 3v2.25m6.36.39-1.59 1.59M21 12h-2.25m-.39 6.36-1.59-1.59M12 18.75V21m-4.77-4.23-1.59 1.59M5.25 12H3m4.23-4.77L5.64 5.64M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
  </Icon>
);

export const IconGear = (p) => (
  <Icon {...p}>
    <path d="M11.42 4.04a48.4 48.4 0 0 0-1.16-.17m-4.6 2.15c-.24.18-.48.36-.72.54m2.5-2.45 1.35 1.35m-5.32 4.8c-.03.18-.06.36-.09.54m.15 4.02c.09.2.19.4.31.6m-1.17-6.72h1.5m.6 3.45a48.36 48.36 0 0 1-1.17-.17m2.52-5.13a9 9 0 1 1 5.92 13.5M15.75 21a6.75 6.75 0 1 0-13.5 0c0 .4.4.75 1.13.75h11.25c.72 0 1.12-.35 1.12-.75Z" />
  </Icon>
);

export const IconFlame = (p) => (
  <Icon {...p}>
    <path d="M12 2.5c-2.5 3.5-6 6.3-6 10.6a6 6 0 0 0 12 0c0-4.3-3.5-7.1-6-10.6Z" />
    <path d="M12 9.5c-1.2 1.7-2.6 3-2.6 5a2.6 2.6 0 0 0 5.2 0c0-2-1.4-3.3-2.6-5Z" />
  </Icon>
);

export const IconSun = (p) => (
  <Icon {...p}>
    <path d="M12 3v2.25m6.36.39-1.59 1.59M21 12h-2.25m-.39 6.36-1.59-1.59M12 18.75V21m-4.77-4.23-1.59 1.59M5.25 12H3m4.23-4.77L5.64 5.64M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
  </Icon>
);

export const IconRuler = (p) => (
  <Icon {...p}>
    <path d="M4 8.5h16a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V9a.5.5 0 0 1 .5-.5Z" />
    <path d="M7 8.5V11m4-2.5V11m4-2.5V11" />
  </Icon>
);

export const IconPlus = (p) => (
  <Icon {...p}>
    <path d="M12 5v14m7-7H5" />
  </Icon>
);

export const IconPlay = (p) => (
  <Icon {...p} fill="currentColor" strokeWidth={0}>
    <path d="M7 5.5v13a.75.75 0 0 0 1.15.63l10.5-6.5a.75.75 0 0 0 0-1.26L8.15 4.87A.75.75 0 0 0 7 5.5Z" />
  </Icon>
);

export const IconPause = (p) => (
  <Icon {...p} fill="currentColor" strokeWidth={0}>
    <path d="M7.5 5h2.5v14H7.5zM14 5h2.5v14H14z" />
  </Icon>
);

export const IconUsers = (p) => (
  <Icon {...p}>
    <path d="M15 19.13a3.38 3.38 0 0 0-6 0A11.99 11.99 0 0 1 3.5 9.75c0-1.05.18-2.05.49-3a2.25 2.25 0 0 1 3.36-1.62 6.75 6.75 0 0 1 9.3 0 2.25 2.25 0 0 1 3.36 1.62c.31.95.49 1.95.49 3a11.99 11.99 0 0 1-5.5 9.38Z" />
    <path d="M9.53 15.16a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm4.94 0a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
  </Icon>
);

// ---- Skill glyphs used by the Leaflet map markers ----
// { color: background color, paths: stroke path data }

const P_BOLT = ["M13.5 3 5.25 13.5H12L10.5 21l8.25-10.5H12L13.5 3Z"];
const P_WRENCH = [
  "M11.42 15.17 17.25 21A2.65 2.65 0 0 0 21 17.25l-5.88-5.88M11.42 15.17l2.5-3.03c.32-.38.74-.63 1.2-.77M11.42 15.17l-4.65 5.65a2.55 2.55 0 1 1-3.59-3.59l6.84-5.63m5.11-.23c.55-.17 1.16-.19 1.74-.14a4.5 4.5 0 0 0 4.49-6.34l-3.28 3.28a3 3 0 0 1-2.25-2.25l3.28-3.28a4.5 4.5 0 0 0-6.34 4.49c.09 1.07-.07 2.26-.9 2.95l-.1.08m-1.75 1.44L5.9 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.41l4.26 4.26m-1.74 1.44 1.74-1.44m6.61 8.21L15.75 15.75M4.87 19.12h.01v.01h-.01v-.01Z",
];
const P_FLAME = [
  "M12 2.5c-2.5 3.5-6 6.3-6 10.6a6 6 0 0 0 12 0c0-4.3-3.5-7.1-6-10.6Z",
  "M12 9.5c-1.2 1.7-2.6 3-2.6 5a2.6 2.6 0 0 0 5.2 0c0-2-1.4-3.3-2.6-5Z",
];
const P_GEAR = [
  "M11.42 4.04a48.4 48.4 0 0 0-1.16-.17m-4.6 2.15c-.24.18-.48.36-.72.54m2.5-2.45 1.35 1.35m-5.32 4.8c-.03.18-.06.36-.09.54m.15 4.02c.09.2.19.4.31.6m-1.17-6.72h1.5m.6 3.45a48.36 48.36 0 0 1-1.17-.17m2.52-5.13a9 9 0 1 1 5.92 13.5M15.75 21a6.75 6.75 0 1 0-13.5 0c0 .4.4.75 1.13.75h11.25c.72 0 1.12-.35 1.12-.75Z",
];
const P_RULER = [
  "M4 8.5h16a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V9a.5.5 0 0 1 .5-.5Z",
  "M7 8.5V11m4-2.5V11m4-2.5V11",
];
const P_SUN = [
  "M12 3v2.25m6.36.39-1.59 1.59M21 12h-2.25m-.39 6.36-1.59-1.59M12 18.75V21m-4.77-4.23-1.59 1.59M5.25 12H3m4.23-4.77L5.64 5.64M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z",
];

export const SKILL_GLYPHS = {
  Electrician: { color: "#f59e0b", paths: P_BOLT },
  Plumber: { color: "#0ea5e9", paths: P_WRENCH },
  Welder: { color: "#f97316", paths: P_FLAME },
  Mechanic: { color: "#f43f5e", paths: P_GEAR },
  Carpenter: { color: "#b45309", paths: P_RULER },
  "Solar Installer": { color: "#10b981", paths: P_SUN },
};

export const DEFAULT_GLYPH = { color: "#1e40d8", paths: P_WRENCH };

export function skillGlyph(skill) {
  return SKILL_GLYPHS[skill] || DEFAULT_GLYPH;
}

export function skillGlyphSvg(skill, color = "#fff", size = 20) {
  const g = skillGlyph(skill);
  const paths = g.paths
    .map(
      (d) =>
        `<path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
    )
    .join("");
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">${paths}</svg>`;
}
