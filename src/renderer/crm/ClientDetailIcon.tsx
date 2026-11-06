export function ClientDetailIcon({kind}:{kind:'phone'|'email'|'city'|'history'}){
 const paths={phone:<path d="M5 3h4l2 5-3 2a15 15 0 0 0 6 6l2-3 5 2v4c0 2-2 2-3 2C9 20 4 15 3 6c0-1 0-3 2-3Z"/>,email:<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></>,city:<><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,history:<><path d="M3 10a9 9 0 1 1 2 8M3 4v6h6M12 7v5l3 2"/></>};
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind]}</svg>;
}
