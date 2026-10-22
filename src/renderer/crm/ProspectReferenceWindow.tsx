import './prospect-workspace-pilot.css';
import './prospection-ux.css';
import {OperationIcon} from '../operations/OperationIcon';
import {UnsavedGroup} from '../unsaved/unsaved';
import { Component, useEffect, useRef, useState, type ErrorInfo, type ReactNode } from 'react';
import type { ProspectSummary } from '../../shared/crm';
import { ProspectIdentityPanel } from './ProspectIdentityPanel';
import { ProspectResearchPanel } from './ProspectResearchPanel';

class ProspectReferenceErrorBoundary extends Component<
  { children: ReactNode },
  { error: string | null }
> {
  state: { error: string | null } = { error: null };

  static getDerivedStateFromError(error: unknown): { error: string } {
    return { error: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error('Erreur fenêtre Référence prospect', error, info);
  }

  render(): ReactNode {
    if (this.state.error) {
      return <div className="reference-window-shell">
        <div className="panel fatal-card">
          <span className="eyebrow">Référence prospect</span>
          <h1>La fiche n’a pas pu s’afficher</h1>
          <p>{this.state.error}</p>
          <p className="muted">La fenêtre principale et les données CRM ne sont pas affectées.</p>
        </div>
      </div>;
    }
    return this.props.children;
  }
}

export function ProspectReferenceWindow({ prospectId }: { prospectId: string }) {
  return <ProspectReferenceErrorBoundary>
    <UnsavedGroup name={'reference:'+prospectId}><ProspectReferenceWindowContent prospectId={prospectId} /></UnsavedGroup>
  </ProspectReferenceErrorBoundary>;
}

function ProspectReferenceWindowContent({ prospectId }: { prospectId: string }) {
  const [prospect, setProspect] = useState<ProspectSummary | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadedOnce=useRef(false);
  async function load(message?: string) {
    if(!loadedOnce.current)setLoading(true);
    setLoadError(null);
    try {
      const prospects = await window.atoumweb.crm.prospects.list({ includeArchived: true });
      setProspect(prospects.find((item) => item.id === prospectId) ?? null);
      if (message) setMessage(message);
    } catch (error) {
      setProspect(null);
      setLoadError(error instanceof Error ? error.message : String(error));
    } finally {
      loadedOnce.current=true;setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [prospectId]);

  if (loading) return <div className="reference-window-shell"><p className="muted">Chargement de la référence prospect…</p></div>;
  if (loadError) return <div className="reference-window-shell"><div className="panel fatal-card"><span className="eyebrow">Référence prospect</span><h1>Chargement impossible</h1><p>{loadError}</p><button className="secondary-button" type="button" onClick={() => void load()}>Réessayer</button></div></div>;
  if (!prospect) return <div className="reference-window-shell"><h1>Prospect introuvable</h1><p className="muted">Cette fiche n’est plus disponible dans le workspace actif.</p></div>;

  return <div className={`reference-window-shell prospect-reference-pilot prospect-detail-v2 prospect-temperature-${prospect.temperature??'neutral'}`}>
    <header className="reference-window-header">
      <div><span className="eyebrow">Référence prospect</span><h1>{prospect.displayName}</h1><p>{prospect.organizationIndustry || 'Activité à compléter'}{prospect.organizationCity ? ` · ${prospect.organizationCity}` : ''}</p></div>
    </header>
    {message && <div className="notice"><span>{message}</span><button type="button" onClick={() => setMessage('')} aria-label="Fermer" title="Fermer"><OperationIcon name="close"/></button></div>}
    <ProspectResearchPanel prospect={prospect} defaultOpen browseFirst onChanged={(next)=>void load(next)}/>
    <details className="reference-window-identity"><summary>Identité et coordonnées</summary><ProspectIdentityPanel prospect={prospect} onSaved={()=>void load('Informations entreprise / contact mises à jour.')}/></details>
  </div>;
}
