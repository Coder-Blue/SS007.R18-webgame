import type { JSX } from "@solidjs/web";

export type IconName =
  | "rice"
  | "road"
  | "factory"
  | "wallet"
  | "users"
  | "shield"
  | "gauge"
  | "calendar"
  | "pause"
  | "play"
  | "save"
  | "settings"
  | "close"
  | "chevron-right"
  | "trend-up"
  | "trend-down"
  | "truck"
  | "droplets"
  | "sun"
  | "rain"
  | "bolt"
  | "landmark"
  | "scale"
  | "alert"
  | "check"
  | "info"
  | "map-pin"
  | "menu"
  | "download"
  | "upload"
  | "trash"
  | "book"
  | "spark"
  | "coins"
  | "chart"
  | "clock"
  | "leaf"
  | "warehouse";

const paths: Readonly<Record<IconName, readonly string[]>> = {
  rice: ["M6 21c0-6 4-10 10-10", "M4 17c4 0 8-2 10-6", "M8 13c0-4 3-7 7-7", "M14 21c0-3 2-5 5-5"],
  road: ["M4 21 9 3", "M20 21 15 3", "M12 7v3", "M12 14v3"],
  factory: ["M3 21V10l5 3V10l5 3V7l8 5v9z", "M7 21v-4", "M12 21v-4", "M17 21v-4"],
  wallet: ["M4 6h16v14H4z", "M4 10h16", "M16 15h2", "M4 6l3-3h10l3 3"],
  users: [
    "M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
    "M2 21v-2a6 6 0 0 1 12 0v2",
    "M17 3a3 3 0 0 1 0 6",
    "M22 21v-2a5 5 0 0 0-3-4.6",
  ],
  shield: ["M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z", "M9 12l2 2 4-4"],
  gauge: ["M12 14l4-4", "M4 19a9 9 0 1 1 16 0", "M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4"],
  calendar: ["M4 6h16v15H4z", "M4 10h16", "M8 3v4", "M16 3v4"],
  pause: ["M8 5v14", "M16 5v14"],
  play: ["M7 4l13 8-13 8z"],
  save: ["M5 3h12l4 4v14H5z", "M8 3v6h8V3", "M8 14h8v7H8z"],
  settings: [
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6",
    "M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 0 0-1.7-1L14.5 3h-5l-.4 3a7 7 0 0 0-1.7 1l-2.4-1-2 3.4L5.1 11a7 7 0 0 0 0 2L3 14.6l2 3.4 2.4-1a7 7 0 0 0 1.7 1l.4 3h5l.4-3a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2.1-1.6a7 7 0 0 0 .1-1z",
  ],
  close: ["M6 6l12 12", "M18 6 6 18"],
  "chevron-right": ["M9 5l7 7-7 7"],
  "trend-up": ["M3 17l6-6 4 4 8-8", "M15 7h6v6"],
  "trend-down": ["M3 7l6 6 4-4 8 8", "M15 17h6v-6"],
  truck: [
    "M3 6h11v11H3z",
    "M14 10h4l3 3v4h-7z",
    "M7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4",
    "M18 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4",
  ],
  droplets: ["M12 3l5 6a6 6 0 1 1-10 0z"],
  sun: [
    "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10",
    "M12 1v3",
    "M12 20v3",
    "M4.2 4.2l2.1 2.1",
    "M17.7 17.7l2.1 2.1",
    "M1 12h3",
    "M20 12h3",
    "M4.2 19.8l2.1-2.1",
    "M17.7 6.3l2.1-2.1",
  ],
  rain: [
    "M7 16a4 4 0 0 1 0-8 5 5 0 0 1 9-2 4 4 0 0 1 1 8",
    "M8 20l-2 3",
    "M13 20l-2 3",
    "M18 20l-2 3",
  ],
  bolt: ["M13 2 4 14h7l-1 8 9-12h-7z"],
  landmark: ["M3 21h18", "M5 21V9", "M9 21V9", "M15 21V9", "M19 21V9", "M12 3l8 4H4z"],
  scale: ["M12 3v18", "M7 6h10", "M5 6l-2 6h4z", "M19 6l-2 6h4z", "M8 21h8"],
  alert: ["M12 3l10 18H2z", "M12 9v5", "M12 18h.01"],
  check: ["M4 12l5 5L20 6"],
  info: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20", "M12 11v6", "M12 7h.01"],
  "map-pin": [
    "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0",
    "M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6",
  ],
  menu: ["M4 6h16", "M4 12h16", "M4 18h16"],
  download: ["M12 3v12", "M7 10l5 5 5-5", "M4 21h16"],
  upload: ["M12 21V9", "M7 14l5-5 5 5", "M4 3h16"],
  trash: ["M4 7h16", "M9 3h6l1 4H8z", "M6 7l1 14h10l1-14", "M10 11v6", "M14 11v6"],
  book: ["M4 4h7a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H4z", "M20 4h-5a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h6z"],
  spark: ["M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6z"],
  coins: [
    "M8 9a5 4 0 1 0 0-8 5 4 0 0 0 0 8",
    "M3 9v4c0 2 2 3 5 3s5-1 5-3V9",
    "M13 12a5 4 0 1 0 0-8",
    "M13 13v3c0 2 2 3 5 3s5-1 5-3v-4",
  ],
  chart: ["M4 20V4", "M4 20h16", "M8 16v-5", "M13 16V7", "M18 16v-8"],
  clock: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20", "M12 6v6l4 2"],
  leaf: ["M4 20c0-8 6-14 16-15 1 10-5 16-13 16", "M4 20c4-4 8-7 13-9"],
  warehouse: ["M3 21V9l9-5 9 5v12", "M7 21v-7h10v7", "M7 17h10"],
};

export const Icon = (props: {
  readonly name: IconName;
  readonly size?: number;
  readonly class?: string;
  readonly label?: string;
}): JSX.Element => (
  <svg
    viewBox="0 0 24 24"
    width={props.size ?? 20}
    height={props.size ?? 20}
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
    role={props.label === undefined ? undefined : "img"}
    aria-label={props.label}
    aria-hidden={props.label === undefined ? "true" : undefined}
  >
    {paths[props.name].map((d) => (
      <path d={d} />
    ))}
  </svg>
);
