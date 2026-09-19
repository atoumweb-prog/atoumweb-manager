import { useEffect, useState } from 'react';
import type { ProspectResearchSnapshot, ProspectSummary } from '../../shared/crm';

function date(value?: string | null): string {
  if (!value) return 'Jamais';
  const parsed = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('fr-FR');
}

export function ProspectReferenceSummary({ prospect }: { prospect: ProspectSummary }) {
  const [latest, setLatest] = useState<ProspectResearchSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    void window.atoumweb.crm.prospects.research.list(prospect.id).then((items) => {
      if (!cancelled) setLatest(items[0] ?? null);
    });
    return () => { cancelled = true; };
  }, [prospect.id, prospect.researchSnapshotCount]);

  const opportunities = (latest?.opportunities ?? []).filter((item) => item.keep);
  const talkingPoints = latest?.conversation?.talkingPoints?.trim();
  const approach = latest?.conversation?.approach?.trim();
  const strengths = latest?.conversation?.strengths?.trim();

  return <section className="prospect-reference-summary">
    <div className="reference-summary-heading">
      <div><span className="eyebrow">Référence prospect</span><strong>À avoir sous les yeux pendant l’échange</strong></div>
      <small>Vérifié : {date(latest?.checkedAt)}</small>
    </div>
    <div className="reference-summary-grid">
      <div><span>Activité</span><strong>{prospect.organizationIndustry || 'À compléter'}</strong></div>
      <div><span>Ville</span><strong>{prospect.organizationCity || 'À compléter'}</strong></div>
      <div><span>Contact</span><strong>{prospect.secondaryLabel || 'À identifier'}</strong></div>
      <div><span>Site</span><strong>{prospect.organizationWebsite || prospect.existingUrl || 'À vérifier'}</strong></div>
    </div>
    {talkingPoints && <div className="reference-priority-block"><span>Points à évoquer</span><strong>{talkingPoints}</strong></div>}
    {approach && <div className="reference-priority-block"><span>Angle d’approche</span><p>{approach}</p></div>}
    {strengths && <div className="reference-priority-block"><span>Points forts repérés</span><p>{strengths}</p></div>}
    {opportunities.length > 0 && <div className="reference-opportunity-summary"><span>Opportunités AtoumWeb retenues</span>{opportunities.map((item, index) => <div key={index}><strong>{item.service || item.finding}</strong>{item.finding && item.service && <small>{item.finding}</small>}</div>)}</div>}
    {!latest && <p className="muted">Aucune fiche de connaissance entreprise enregistrée pour le moment.</p>}
  </section>;
}
