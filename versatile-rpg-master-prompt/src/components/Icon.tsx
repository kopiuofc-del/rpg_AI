import type { ReactNode } from "react";

export type IconName =
  | "table"
  | "sheet"
  | "dice"
  | "cast"
  | "oracle"
  | "plus"
  | "send"
  | "close"
  | "menu"
  | "trash"
  | "copy"
  | "check"
  | "chevron"
  | "arrow"
  | "spark"
  | "eye"
  | "eyeOff"
  | "clock"
  | "heart"
  | "pack"
  | "pin"
  | "compass"
  | "scroll"
  | "rotate"
  | "target"
  | "shield"
  | "list"
  | "flame";

const PATHS: Record<IconName, ReactNode> = {
  table: (
    <>
      <ellipse cx="12" cy="12" rx="9" ry="6.5" />
      <path d="M12 5.5v13M3 12h18" />
      <path d="M7.2 8.6 16.8 15.4M16.8 8.6 7.2 15.4" />
    </>
  ),
  sheet: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4" />
      <path d="M9 12h6M9 15.5h6M9 8.5h2" />
    </>
  ),
  dice: (
    <>
      <path d="m12 2.6 8.2 4.7v9.4L12 21.4 3.8 16.7V7.3z" />
      <path d="m3.8 7.3 8.2 4.8 8.2-4.8M12 12.1v9.3" />
      <path d="m7.9 9.7 8.2 4.8M16.1 9.7l-8.2 4.8" />
    </>
  ),
  cast: (
    <>
      <circle cx="8.5" cy="8" r="3" />
      <path d="M2.8 20c.6-3.6 2.9-5.6 5.7-5.6s5.1 2 5.7 5.6" />
      <path d="M16 6.2a3 3 0 0 1 0 5.6M17.4 14.9c2 .7 3.4 2.5 3.8 5.1" />
    </>
  ),
  oracle: (
    <>
      <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
      <path d="M12 2.4v1.4M12 20.2v1.4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  send: (
    <>
      <path d="M3.4 11.2 20.6 4l-7.2 17.2-2.3-7.7z" />
      <path d="m11.1 13.5 4.6-4.6" />
    </>
  ),
  close: <path d="m6.4 6.4 11.2 11.2M17.6 6.4 6.4 17.6" />,
  menu: <path d="M4 7h16M4 12h11M4 17h16" />,
  trash: (
    <>
      <path d="M4.5 7h15M9.5 7V4.2h5V7M6.4 7l.9 13.2h9.4L17.6 7" />
      <path d="M10.4 10.6v6.2M13.6 10.6v6.2" />
    </>
  ),
  copy: (
    <>
      <rect x="8.4" y="8.4" width="11.2" height="11.2" rx="2.2" />
      <path d="M15.6 8.4V6.2a2 2 0 0 0-2-2H6.4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 2 2h2.2" />
    </>
  ),
  check: <path d="m5 12.6 4.4 4.4L19 6.6" />,
  chevron: <path d="m7 10 5 5 5-5" />,
  arrow: <path d="M4.5 12h15m-5.6-5.6L19.5 12l-5.6 5.6" />,
  spark: (
    <>
      <path d="m12 3.2 1.8 5.4 5.4 1.8-5.4 1.8L12 17.6l-1.8-5.4L4.8 10.4l5.4-1.8z" />
      <path d="m18.4 15.4.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
    </>
  ),
  eye: (
    <>
      <path d="M2.6 12S6.2 6.4 12 6.4 21.4 12 21.4 12 17.8 17.6 12 17.6 2.6 12 2.6 12Z" />
      <circle cx="12" cy="12" r="2.6" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M4.2 7.6C2.9 9.1 2.2 12 2.2 12s3.6 5.6 9.4 5.6c1.6 0 3-.4 4.2-1" />
      <path d="M18.4 14.6c1.6-1.4 2.6-2.6 2.6-2.6S17.4 6.4 11.6 6.4c-.8 0-1.6.1-2.3.3" />
      <path d="m4 4 16 16" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12.6" r="8.4" />
      <path d="M12 8.2v4.6l3 1.8M9 2.6h6" />
    </>
  ),
  heart: <path d="M12 20s-7.6-4.4-7.6-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7.6 2.6C19.6 15.6 12 20 12 20Z" />,
  pack: (
    <>
      <path d="M4.6 8.6h14.8v11H4.6z" />
      <path d="M8.6 8.6V5.8a3.4 3.4 0 0 1 6.8 0v2.8M4.6 13h14.8" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s6.4-6 6.4-10.4A6.4 6.4 0 0 0 5.6 10.6C5.6 15 12 21 12 21Z" />
      <circle cx="12" cy="10.4" r="2.4" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.6 8.4-2.1 5.1-5.1 2.1 2.1-5.1z" />
    </>
  ),
  scroll: (
    <>
      <path d="M6.4 4.4h11.2v13.2a2.4 2.4 0 0 0 2.4 2.4H8.8a2.4 2.4 0 0 1-2.4-2.4z" />
      <path d="M6.4 4.4A2 2 0 0 0 4.4 6.4v2h2M9.6 9h4.8M9.6 12.4h4.8" />
    </>
  ),
  rotate: (
    <>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20.4 4.4v4.4H16" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.2" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.9" fill="currentColor" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.2 19.4 6v6c0 4.2-3 7.2-7.4 8.8C7.6 19.2 4.6 16.2 4.6 12V6z" />
      <path d="m9 12 2.2 2.2L15.4 10" />
    </>
  ),
  list: <path d="M8.4 7h11M8.4 12h11M8.4 17h11M4.6 7h.01M4.6 12h.01M4.6 17h.01" />,
  flame: (
    <>
      <path d="M12 21c3.6 0 6-2.4 6-5.6 0-4.2-4-5.6-3.4-11.4-3 1.6-5 4.4-5 7 0 1.4-.6 2-1.4 2-.8 0-1.2-.6-1.2-1.6C5.6 13 6 14.6 6 15.4 6 18.6 8.4 21 12 21Z" />
    </>
  ),
};

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[name]}
    </svg>
  );
}
