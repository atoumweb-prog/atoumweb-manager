import { useMemo, useState } from 'react';
import type { ProjectTechnicalContentType } from '../../shared/projects';
import './TechnicalContentViewer.css';

interface Props {
  contentType: ProjectTechnicalContentType;
  language?: string | null;
  content?: string | null;
  title?: string;
  onMessage?: (message: string) => void;
  expanded?: boolean;
  onToggleExpanded?: () => void;
}

type JsonMode = 'structured' | 'raw';
type ViewerMode = 'source' | 'preview';

export function TechnicalContentViewer({
  contentType,
  language,
  content,
  title = 'Contenu technique',
  onMessage,
  expanded = false,
  onToggleExpanded,
}: Props) {
  const [jsonMode, setJsonMode] = useState<JsonMode>('structured');
  const [viewerMode, setViewerMode] = useState<ViewerMode>('source');
  const parsed = useMemo(() => parseJson(contentType, content), [contentType, content]);
  const text = content ?? '';
  const lineCount = text ? text.split(/\r?\n/).length : 0;
  const canPreviewHtml = contentType === 'code' && ['html', 'htm'].includes((language ?? '').trim().toLowerCase());
  const previewDocument = useMemo(() => canPreviewHtml ? buildHtmlPreviewDocument(text) : '', [canPreviewHtml, text]);

  async function copy(): Promise<void> {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      onMessage?.('Contenu technique copié dans le presse-papiers.');
    } catch {
      onMessage?.('Impossible de copier automatiquement le contenu.');
    }
  }

  if (!text) {
    return <div className="technical-content-empty">Aucun contenu texte enregistré pour cette version.</div>;
  }

  return (
    <section className={`technical-content-viewer ${expanded ? 'expanded' : ''}`}>
      <header className="technical-content-toolbar">
        <div>
          <strong>{title}</strong>
          <span>{contentType}{language ? ` · ${language}` : ''} · {lineCount} ligne{lineCount > 1 ? 's' : ''}</span>
        </div>
        <div className="technical-content-actions">
          {canPreviewHtml && (
            <button type="button" className="secondary-button" onClick={() => setViewerMode((value) => value === 'source' ? 'preview' : 'source')}>
              {viewerMode === 'source' ? 'Aperçu rendu' : 'Voir le code'}
            </button>
          )}
          {parsed !== null && viewerMode === 'source' && (
            <button type="button" className="secondary-button" onClick={() => setJsonMode((value) => value === 'raw' ? 'structured' : 'raw')}>
              {jsonMode === 'raw' ? 'Vue structurée' : 'Vue brute'}
            </button>
          )}
          <button type="button" className="secondary-button" onClick={() => void copy()}>Copier</button>
          {onToggleExpanded && <button type="button" className="secondary-button" onClick={onToggleExpanded}>{expanded ? 'Réduire' : 'Agrandir'}</button>}
        </div>
      </header>

      <div className="technical-content-safety">
        {viewerMode === 'preview'
          ? 'Aperçu isolé · scripts et ressources externes bloqués · le composant ne modifie pas AtoumWeb Manager.'
          : 'Lecture uniquement · aucun code n’est exécuté par AtoumWeb Manager.'}
      </div>

      {viewerMode === 'preview' && canPreviewHtml
        ? <iframe className="technical-content-preview" title={`Aperçu rendu · ${title}`} sandbox="" srcDoc={previewDocument} />
        : parsed !== null && jsonMode === 'structured'
          ? <JsonTree value={parsed} />
          : <LineNumberedContent content={text} />}
    </section>
  );
}

export function parseJson(contentType: ProjectTechnicalContentType, content?: string | null): unknown | null {
  if (contentType !== 'json' || !content?.trim()) return null;
  try {
    return JSON.parse(content) as unknown;
  } catch {
    return null;
  }
}

function LineNumberedContent({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  return <div className="technical-content-raw" role="region" aria-label="Contenu technique brut">
    {lines.map((line, index) => (
      <div className="technical-content-line" key={`${index}-${line.slice(0, 16)}`}>
        <span className="technical-content-line-number" aria-hidden="true">{index + 1}</span>
        <code>{line || ' '}</code>
      </div>
    ))}
  </div>;
}

function JsonTree({ value }: { value: unknown }) {
  return <div className="technical-json-tree" role="tree"><JsonNode value={value} depth={0} label={null} /></div>;
}

function JsonNode({ value, depth, label }: { value: unknown; depth: number; label: string | null }) {
  const prefix = label === null ? null : <span className="technical-json-key">{label}</span>;

  if (Array.isArray(value)) {
    return <div className="technical-json-node" style={{ paddingLeft: `${Math.min(depth, 12) * 14}px` }}>
      <div>{prefix}{prefix && <span>: </span>}<span className="technical-json-kind">Array({value.length})</span></div>
      {value.map((entry, index) => <JsonNode key={index} value={entry} depth={depth + 1} label={String(index)} />)}
    </div>;
  }

  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    return <div className="technical-json-node" style={{ paddingLeft: `${Math.min(depth, 12) * 14}px` }}>
      <div>{prefix}{prefix && <span>: </span>}<span className="technical-json-kind">Object({entries.length})</span></div>
      {entries.map(([key, entry]) => <JsonNode key={key} value={entry} depth={depth + 1} label={key} />)}
    </div>;
  }

  return <div className="technical-json-leaf" style={{ paddingLeft: `${Math.min(depth, 12) * 14}px` }}>
    {prefix}{prefix && <span>: </span>}<JsonScalar value={value} />
  </div>;
}

function JsonScalar({ value }: { value: unknown }) {
  if (value === null) return <span className="technical-json-null">null</span>;
  if (typeof value === 'string') return <span className="technical-json-string">“{value}”</span>;
  if (typeof value === 'number') return <span className="technical-json-number">{String(value)}</span>;
  if (typeof value === 'boolean') return <span className="technical-json-boolean">{String(value)}</span>;
  return <span>{String(value)}</span>;
}


function buildHtmlPreviewDocument(content: string): string {
  if (/<!doctype\s+html|<html[\s>]/i.test(content)) return content;
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <base target="_blank">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:;">
  <style>
    html, body { margin: 0; min-height: 100%; background: #fff; }
    body { font-family: Arial, Helvetica, sans-serif; }
    *, *::before, *::after { box-sizing: border-box; }
  </style>
</head>
<body>
${content}
</body>
</html>`;
}
