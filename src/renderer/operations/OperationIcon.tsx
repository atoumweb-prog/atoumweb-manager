import type { ReactNode } from 'react';

export type OperationIconName =
  | 'record-open' | 'record-expand' | 'record-reduce' | 'rail-open' | 'rail-close' | 'header-expand' | 'header-compact'
  | 'home' | 'users' | 'file-check' | 'layers' | 'contact' | 'settings'
  | 'search' | 'filter' | 'menu' | 'plus' | 'arrow-left' | 'columns' | 'edit'
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
  | 'chevron-up'
  | 'chevron-down'
  | 'close'
  | 'euro'
  | 'piggy-broken'
  | 'file-text'
  | 'gift'
  | 'wallet'
  | 'repeat'
  | 'database'
  | 'folder'
  | 'archive'
  | 'check-circle'
  | 'server'
  | 'external-link'
  | 'upload'
  | 'package'
  | 'code'
  | 'image'
  | 'user'
  | 'calendar'
  | 'chart'
  | 'bolt'
  | 'sun'
  | 'moon';

const paths: Record<OperationIconName, ReactNode> = {
  'record-open': <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16m4-11 3 3-3 3m-1-3h5"/></>,
  'record-expand': <><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 17 17 7m-6 0h6v6"/></>,
  'record-reduce': <><rect x="3" y="3" width="18" height="18" rx="3"/><path d="m16 8-8 8m0-5v5h5"/></>,
  'rail-open': <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 4v16m4-11 3 3-3 3"/></>,
  'rail-close': <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 4v16m8-11-3 3 3 3"/></>,
  'header-expand': <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18m-12 5 3 3 3-3"/></>,
  'header-compact': <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18m-12 8 3-3 3 3"/></>,
  edit: <><path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-4L4 15ZM4 15l5 4"/></>,
  home: <><path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8"/></>,
  users: <><circle cx="9" cy="8" r="3"/><path d="M3 21v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 4v2"/></>,
  'file-check': <><path d="M6 3h8l4 4v14H6ZM14 3v5h4m-9 7 2 2 4-5"/></>,
  layers: <><path d="m3 7 9-4 9 4-9 4ZM3 12l9 4 9-4M3 17l9 4 9-4"/></>,
  contact: <><rect x="5" y="3" width="15" height="18" rx="2"/><circle cx="12.5" cy="9" r="2.5"/><path d="M9 17a3.5 3.5 0 0 1 7 0M3 7h3M3 12h3M3 17h3"/></>,
  settings: <><path d="m10 3-.6 2.2-2 .9-2-.6-2 3.5 1.6 1.6v2.8L3.4 15l2 3.5 2-.6 2 .9.6 2.2h4l.6-2.2 2-.9 2 .6 2-3.5-1.6-1.6v-2.8L20.6 9l-2-3.5-2 .6-2-.9L14 3Z"/><circle cx="12" cy="12" r="3"/></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
  filter: <path d="M3 4h18l-7 8v7l-4 2v-9Z"/>,
  menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
  plus: <path d="M12 4v16M4 12h16"/>,
  'arrow-left': <path d="m10 5-7 7 7 7M3 12h18"/>,
  columns: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16"/></>,
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
  'chevron-up': <>
    <path d="m6.5 14.5 5.5-5 5.5 5" />
  </>,
  'chevron-down': <>
    <path d="m6.5 9.5 5.5 5 5.5-5" />
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
  'file-text': <>
    <path d="M6 3.5h8l4 4v13H6z" />
    <path d="M14 3.5v4h4M9 12h6M9 15.5h6" />
  </>,
  gift: <>
    <path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13" />
    <path d="M12 7H8.8C6.8 7 6 4.4 7.7 3.5 9.5 2.6 11.5 5.2 12 7ZM12 7h3.2c2 0 2.8-2.6 1.1-3.5-1.8-.9-3.8 1.7-4.3 3.5Z" />
  </>,
  wallet: <>
    <path d="M4 6.5h13a3 3 0 0 1 3 3v8H5a2 2 0 0 1-2-2v-9a3 3 0 0 1 3-3h10" />
    <path d="M16 11h4v4h-4a2 2 0 1 1 0-4Z" />
  </>,
  repeat: <>
    <path d="M7 7h10l-2.5-2.5M17 17H7l2.5 2.5M18.5 7.5A6.5 6.5 0 0 1 19 10M5.5 16.5A6.5 6.5 0 0 1 5 14" />
  </>,
  database: <>
    <ellipse cx="12" cy="5.5" rx="7" ry="3" />
    <path d="M5 5.5v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6M5 11.5v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
  </>,
  folder: <>
    <path d="M3.5 6.5h6l2 2H20a1.5 1.5 0 0 1 1.5 1.5v7.5A2.5 2.5 0 0 1 19 20H5a2.5 2.5 0 0 1-2.5-2.5V8A1.5 1.5 0 0 1 4 6.5Z" />
  </>,
  archive: <>
    <path d="M4 7h16v13H4zM3 4h18v3H3zM9 11h6" />
  </>,
  'check-circle': <>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12.2 2.6 2.6 5.6-6" />
  </>,
  server: <>
    <rect x="4" y="4" width="16" height="6" rx="1.5" />
    <rect x="4" y="14" width="16" height="6" rx="1.5" />
    <path d="M8 7h.01M8 17h.01M12 7h5M12 17h5" />
  </>,
  'external-link': <>
    <path d="M14 4h6v6M20 4l-9 9" />
    <path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" />
  </>,
  upload: <>
    <path d="M12 16V4M7.5 8.5 12 4l4.5 4.5" />
    <path d="M5 14v5h14v-5" />
  </>,
  package: <>
    <path d="m4 7 8-4 8 4-8 4-8-4Z" />
    <path d="M4 7v10l8 4 8-4V7M12 11v10" />
  </>,
  code: <>
    <path d="m9 7-5 5 5 5M15 7l5 5-5 5M13 5l-2 14" />
  </>,
  image: <>
    <rect x="3.5" y="4" width="17" height="16" rx="2" />
    <circle cx="9" cy="9" r="1.5" />
    <path d="m5.5 17 4.5-4.5 3 3 2-2 3.5 3.5" />
  </>,
  user: <>
    <circle cx="12" cy="8" r="3.2" />
    <path d="M5.5 20c.7-4 3-6 6.5-6s5.8 2 6.5 6" />
  </>,
  calendar: <>
    <rect x="4" y="5.5" width="16" height="14" rx="2" />
    <path d="M8 3.5v4M16 3.5v4M4 9.5h16" />
  </>,
  chart: <>
    <path d="M5 19V11M10 19V6M15 19v-9M20 19V4" />
  </>,
  bolt: <>
    <path d="m13.5 2.8-7 10h5l-1 8.4 7-10h-5l1-8.4Z" />
  </>,
  sun: <>
    <circle cx="12" cy="12" r="3.5" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" />
  </>,
  moon: <>
    <path d="M20.2 15.2A8.4 8.4 0 0 1 8.8 3.8 8.5 8.5 0 1 0 20.2 15.2Z" />
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
