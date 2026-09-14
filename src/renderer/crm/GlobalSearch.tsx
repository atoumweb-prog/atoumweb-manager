import { useEffect, useRef, useState } from 'react';
import type { SearchResult } from '../../shared/crm';

export function GlobalSearch({ onOpen }: { onOpen: (result: SearchResult) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const requestId = useRef(0);

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) {
      setResults([]); setOpen(false); setActiveIndex(-1); return;
    }
    const current = ++requestId.current;
    const timer = window.setTimeout(() => {
      void window.atoumweb.crm.search.global(normalized).then((items) => {
        if (current !== requestId.current) return;
        setResults(items); setOpen(true); setActiveIndex(items.length > 0 ? 0 : -1);
      });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [query]);

  function choose(result: SearchResult): void {
    onOpen(result); setQuery(''); setOpen(false); setActiveIndex(-1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Escape') { setOpen(false); setActiveIndex(-1); return; }
    if (!open || results.length === 0) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex((index) => (index + 1) % results.length); return; }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1)); return; }
    if (event.key === 'Enter' && activeIndex >= 0) { event.preventDefault(); choose(results[activeIndex]); }
  }

  return (
    <div className="global-search search-with-results">
      <span aria-hidden="true">⌕</span>
      <input
        aria-label="Recherche globale"
        aria-expanded={open}
        aria-controls="global-search-results"
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Rechercher client, prospect, devis, projet, intervention…"
        value={query}
      />
      {open && (
        <div className="search-results-panel" id="global-search-results" role="listbox">
          {results.length === 0 ? <div className="search-empty">Aucun résultat</div> : results.map((result, index) => (
            <button
              key={`${result.entityType}:${result.entityId}`}
              type="button"
              role="option"
              aria-selected={activeIndex === index}
              className={`search-result ${activeIndex === index ? 'active-search-result' : ''}`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(result)}
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
    case 'catalog': return 'Offre / Service';
    case 'quote': return 'Devis';
    case 'project': return 'Projet';
    case 'service_request': return 'Demande';
    case 'intervention': return 'Intervention';
    case 'maintenance': return 'Maintenance';
    case 'hour_pack': return 'Pack d’heures';
  }
}
