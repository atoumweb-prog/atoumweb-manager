import { useEffect, useState } from 'react';
import type { ProspectSummary } from '../../shared/crm';
import { ProspectIdentityPanel } from './ProspectIdentityPanel';
import { ProspectResearchPanel } from './ProspectResearchPanel';

export function ProspectReferenceWindow({ prospectId }: { prospectId: string }) {
  const [prospect, setProspect] = useState<ProspectSummary | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  async function load(message?: string) {
    setLoading(true);
    try {
      const prospects = await window.atoumweb.crm.prospects.list({ includeArchived: true });
      setProspect(prospects.find((item) => item.id === prospectId) ?? null);
      if (message) setMessage(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [prospectId]);

  if (loading) return <div className="reference-window-shell"><p className="muted">Chargement de la référence prospect…</p></div>;
  if (!prospect) return <div className="reference-window-shell"><h1>Prospect introuvable</h1><p className="muted">Cette fiche n’est plus disponible dans le workspace actif.</p></div>;

  return <div className="reference-window-shell">
    <header className="reference-window-header">
      <div><span className="eyebrow">Référence prospect détachée</span><h1>{prospect.displayName}</h1><p>{prospect.organizationIndustry || 'Activité à compléter'}{prospect.organizationCity ? ` · ${prospect.organizationCity}` : ''}</p></div>
      <div className="reference-window-badge">Fenêtre indépendante · déplaçable sur un autre écran</div>
    </header>
    {message && <div className="notice"><span>{message}</span><button type="button" onClick={() => setMessage('')}>×</button></div>}
    <section className="reference-window-identity">
      <ProspectIdentityPanel prospect={prospect} onSaved={() => void load('Informations entreprise / contact mises à jour.')} />
    </section>
    <ProspectResearchPanel prospect={prospect} defaultOpen onChanged={(next) => void load(next)} />
  </div>;
}
