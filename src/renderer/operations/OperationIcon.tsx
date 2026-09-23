import type { ReactNode } from 'react';

type OperationIconName =
  | 'inbox'
  | 'alert'
  | 'wrench'
  | 'clock'
  | 'shield-check'
  | 'receipt'
  | 'maintenance'
  | 'hourglass'
  | 'refresh'
  | 'expand'
  | 'collapse'
  | 'close'
  | 'euro'
  | 'piggy-broken';

const paths: Record<OperationIconName, ReactNode> = {
  inbox: <>
    <path d="M4 5.5h16v11H4z" />
    <path d="M4 13h4l2 3h4l2-3h4" />
  </>,
  alert: <>
    <path d="M12 3 2.8 19h18.4L12 3Z" />
    <path d="M12 8v5" />
    <path d="M12 16.5h.01" />
  </>,
  wrench: <>
    <path d="M14.5 5.2a4.5 4.5 0 0 0-5.7 5.7L3.5 16.2a2.1 2.1 0 1 0 3 3l5.3-5.3a4.5 4.5 0 0 0 5.7-5.7l-2.7 2.7-2.6-.7-.7-2.6 3-2.4Z" />
  </>,
  clock: <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </>,
  'shield-check': <>
    <path d="M12 3.2 19 6v5.2c0 4.4-2.9 7.4-7 9.1-4.1-1.7-7-4.7-7-9.1V6l7-2.8Z" />
    <path d="m8.5 12 2.2 2.2 4.8-5" />
  </>,
  receipt: <>
    <path d="M6 3.5h12v17l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4v-17Z" />
    <path d="M9 8h6M9 12h6M9 16h4" />
  </>,
  maintenance: <>
    <path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3" />
    <circle cx="12" cy="12" r="4.2" />
    <path d="m5.9 5.9 2.1 2.1M16 16l2.1 2.1M18.1 5.9 16 8M8 16l-2.1 2.1" />
  </>,
  hourglass: <>
    <path d="M7 3.5h10M7 20.5h10M8 4c0 4 2 5.3 4 7-2 1.7-4 3-4 7h8c0-4-2-5.3-4-7 2-1.7 4-3 4-7H8Z" />
  </>,
  refresh: <>
    <path d="M19 7v5h-5" />
    <path d="M18.2 12a6.5 6.5 0 1 1-1.7-5.2L19 9" />
  </>,
  expand: <>
    <path d="M8.5 4H4v4.5M15.5 4H20v4.5M8.5 20H4v-4.5M15.5 20H20v-4.5" />
  </>,
  collapse: <>
    <path d="M9 9H4.5V4.5M15 9h4.5V4.5M9 15H4.5v4.5M15 15h4.5v4.5" />
  </>,
  close: <>
    <path d="m7 7 10 10M17 7 7 17" />
  </>,
  euro: <>
    <path d="M17.5 6.2A6 6 0 0 0 7.2 8.5M6 10h8M6 14h7.5M7.2 15.5A6 6 0 0 0 17.5 17.8" />
  </>,
  'piggy-broken': <>
    <path d="M5.2 10.2c1.3-2.5 4-4 7.1-4 4 0 7.2 2.5 7.2 5.9 0 1-.3 2-.8 2.8l1.3 1.4-2.1 1.4-1.1-.8c-.8.5-1.8.8-2.8 1l-.4 2h-2.2l-.5-1.8H8.6l-.5 1.8H5.9l-.5-2.1C3.9 17.2 3 16 3 14.6v-2.4c0-.7.6-1.3 1.3-1.3h1" />
    <path d="M9 7.1 7.8 4.5c1.6-.3 2.9.1 3.8 1.6M15.8 8.8h.01M10.2 10.2l1.4 1.5-1.3 1.2 1.6 1.6" />
    <path d="m18.8 3.6 1.6 1.6-2.3 2.3M17.8 4.6l2 2" />
  </>,
};

export function OperationIcon({ name, size = 20, className }: {
  name: OperationIconName;
  size?: number;
  className?: string;
}) {
  return <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {paths[name]}
  </svg>;
}
