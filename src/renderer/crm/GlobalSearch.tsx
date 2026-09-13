import { useEffect, useRef, useState } from 'react';
import type { SearchResult } from '../../shared/crm';

export function GlobalSearch({ onOpen }: { onOpen: (result: SearchResult) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const current = ++requestId.current;
    const timer = window.setTimeout(() => {
      void window.atoumweb.crm.search.global(normalized).then((items) => {
        if (current !== requestId.current) return;
        setResults(items);
        setOpen(true);
      });
    }, 180);

    return () => window.clearTimeout(timer);
  }, [query]);

  return (
    <div className="global-search search-with-results">
      <span aria-hidden="true">⌕</span>
      <input
        aria-label="Recherche globale"
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Rechercher client, prospect, email, téléphone…"
        value={query}
      />
      {open && (
        <div className="search-results-panel">
          {results.length === 0 ? <div className="search-empty">Aucun résultat</div> : results.map((result) => (
            <button
              key={`${result.entityType}:${result.entityId}`}
              type="button"
              className="search-result"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onOpen(result);
                setQuery('');
                setOpen(false);
              }}
            >
              <span className="search-result-type">{entityLabel(result.entityType)}</span>
              <span className="search-result-main"><strong>{result.title}</strong><small>{result.subtitle || '—'}</small></span>
              {result.status && <span className="status-pill">{result.status}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function entityLabel(type: SearchResult['entityType']): string {
  switch (type) {
    case 'client': return 'Client';
    case 'prospect': return 'Prospect';
    case 'organization': return 'Société';
    case 'contact': return 'Contact';
  }
}
