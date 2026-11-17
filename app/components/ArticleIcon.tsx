import type { ReactNode } from "react";

/**
 * Icon đề mục bài viết: SVG 24×24, nét 1.5px, màu theo `currentColor`. Không hook, chạy được ở server.
 * Tên icon là giá trị `icon` của khối `h` trong data/articles.json; danh sách tên nằm ở `headingIcons` của data/article-rules.json.
 */
export const ARTICLE_ICONS = {
  camera: (
    <>
      <path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13.25" r="3.25" />
    </>
  ),
  sensor: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" />
      <rect x="7" y="8.5" width="10" height="7" rx="0.5" />
    </>
  ),
  flash: <path d="M13 3 5.5 13.5h5.25L10 21l8.5-11h-5.25L13 3z" />,
  color: (
    <>
      <circle cx="9" cy="9.5" r="4.75" />
      <circle cx="15" cy="9.5" r="4.75" />
      <circle cx="12" cy="14.75" r="4.75" />
    </>
  ),
  memory: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
  card: (
    <>
      <path d="M7 3h7.5L19 7.5V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M9.5 6.5v3M12 6.5v3" />
    </>
  ),
  mode: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9 16l3-8 3 8M10.1 13.25h3.8" />
    </>
  ),
  levels: <path d="M5 20v-3M9.67 20v-6M14.33 20v-9M19 20V7" />,
  timer: (
    <>
      <circle cx="12" cy="13.5" r="7" />
      <path d="M12 13.5V10M9.75 3.5h4.5M12 3.5v3" />
    </>
  ),
  broadcast: (
    <>
      <circle cx="12" cy="12" r="1.5" />
      <path d="M8.3 8.3a5.25 5.25 0 0 0 0 7.4M15.7 8.3a5.25 5.25 0 0 1 0 7.4M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8" />
    </>
  ),
  lens: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.75" />
      <circle cx="12" cy="12" r="1.25" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s6.5-5.4 6.5-10.5a6.5 6.5 0 0 0-13 0C5.5 15.6 12 21 12 21z" />
      <circle cx="12" cy="10.5" r="2.25" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="7" width="12.5" height="10" rx="1.5" />
      <path d="M15.5 10.75 21 8v8l-5.5-2.75" />
    </>
  ),
  question: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.75 9.75a2.25 2.25 0 1 1 3.4 1.94c-.72.43-1.15 1-1.15 1.81M12 16.5v.01" />
    </>
  ),
  focus: (
    <>
      <path d="M4 9V6a2 2 0 0 1 2-2h3M15 4h3a2 2 0 0 1 2 2v3M20 15v3a2 2 0 0 1-2 2h-3M9 20H6a2 2 0 0 1-2-2v-3" />
      <circle cx="12" cy="12" r="1.5" />
    </>
  ),
  exposure: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
      <path d="M7 8.5h4M9 6.5v4M13.5 15.5h4M6.5 17.5l11-11" />
    </>
  ),
  light: (
    <>
      <circle cx="12" cy="12" r="3.75" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
    </>
  ),
  night: <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 6.75 6.75 0 0 0 20 14.5z" />,
  grid: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="1.5" />
      <path d="M9.17 5v14M14.83 5v14M3.5 9.67h17M3.5 14.33h17" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="17" cy="17" r="2" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4 21 19.5H3L12 4z" />
      <path d="M12 10v4.5M12 17v.01" />
    </>
  ),
  practice: <path d="M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" />,
  phone: (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2" />
      <path d="M11 18.5h2" />
    </>
  ),
  next: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12h7M12.5 9l3 3-3 3" />
    </>
  ),
  image: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="1.5" />
      <path d="M3.5 15.5 8 11l4 4 2.5-2.5 6 6" />
      <circle cx="15.5" cy="9.25" r="1.25" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type ArticleIconName = keyof typeof ARTICLE_ICONS;

export const isArticleIcon = (name: unknown): name is ArticleIconName =>
  typeof name === "string" && Object.hasOwn(ARTICLE_ICONS, name);

export function ArticleIcon({ name, className }: { name: ArticleIconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {ARTICLE_ICONS[name]}
    </svg>
  );
}
