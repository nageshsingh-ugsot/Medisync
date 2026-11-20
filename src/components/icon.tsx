import type { ReactNode } from "react";
import type { IconName } from "@/lib/types";

const paths: Record<IconName, ReactNode> = {
  dashboard: <><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="5" rx="1.5" /><rect x="13" y="10" width="8" height="11" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /></>,
  inventory: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
  medicines: <><path d="m10.5 3.5 10 10a5 5 0 0 1-7.1 7.1l-10-10a5 5 0 0 1 7.1-7.1Z" /><path d="m8 16 8-8" /></>,
  billing: <><path d="M5 3h14v18l-3.5-2-3.5 2-3.5-2L5 21V3Z" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
  sales: <><path d="M4 19V5M4 19h17" /><path d="m7 15 4-4 3 2 6-7" /></>,
  customers: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
  reports: <><path d="M4 19V5M4 19h17" /><path d="M8 16v-4M13 16V8M18 16V5" /></>,
  settings: <><path d="M12.22 2h-.44a2 2 0 0 0-1.99 1.72l-.15 1.05a7.93 7.93 0 0 0-1.73.99l-.96-.58a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.91.53a7.89 7.89 0 0 0 0 1.99l-.91.53a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.96-.58c.52.41 1.1.74 1.73.99l.15 1.05A2 2 0 0 0 11.78 21h.44a2 2 0 0 0 1.99-1.72l.15-1.05a7.93 7.93 0 0 0 1.73-.99l.96.58a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.91-.53a7.89 7.89 0 0 0 0-1.99l.91-.53a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.96.58a7.93 7.93 0 0 0-1.73-.99l-.15-1.05A2 2 0 0 0 12.22 2Z" /><circle cx="12" cy="12" r="3" /></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  chevron: <path d="m7 10 5 5 5-5" />,
  activity: <><path d="M3 12h4l3-8 4 16 3-8h4" /></>,
  alert: <><path d="m12 3 10 18H2L12 3Z" /><path d="M12 9v4M12 17h.01" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  store: <><path d="M3 10v10h18V10M2 10l2-7h16l2 7" /><path d="M2 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M9 20v-6h6v6" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  phone: <><path d="M6 3h4l2 5-3 2a15 15 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2Z" /></>,
  pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  arrowLeft: <><path d="m12 19-7-7 7-7M5 12h14" /></>,
  package: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="M3 8v9l9 5 9-5V8M12 13v9" /></>,
};

export function Icon({
  name,
  size = 20,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      width={size}
    >
      {paths[name]}
    </svg>
  );
}
