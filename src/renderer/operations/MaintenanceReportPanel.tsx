import { useEffect, useRef, useState } from 'react';
import type { MaintenanceReportData } from '../../shared/maintenanceReport';
import { requestUnsavedExit, useUnsavedDraft } from '../unsaved/unsaved';
import './MaintenanceReportPanel.css';

function duration(seconds: number): string {
  const minutes = Math.max(0, Math.round(seconds / 60));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours} h ${String(rest).padStart(2, '0')}` : `${rest} min`;
}

export function MaintenanceReportPanel({ periodId, onMessage }: { periodId: string; onMessage: (message: string) => void }) {
  const [report, setReport] = useState<MaintenanceReportData | null>(null);
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [anomalies, setAnomalies] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [saving, setSaving] = useState(false);
  const loadGeneration = useRef(0);
  const savingRef = useRef(false);
  const [saved, setSaved] = useState({ summary: '', anomalies: '', recommendations: '' });
  const draft = { summary, anomalies, recommendations };
  const dirty = summary !== saved.summary || anomalies !== saved.anomalies || recommendations !== saved.recommendations;
  useUnsavedDraft('Rapport de maintenance', draft, {
    group: `maintenance-report:${periodId}`,
    dirty,
    pending: saving,
    discard: () => { setSummary(saved.summary); setAnomalies(saved.anomalies); setRecommendations(saved.recommendations); },
  });

  async function load(generation: number): Promise<void> {
    try {
      const next = await window.atoumweb.maintenanceReports.get(periodId);
      if (generation !== loadGeneration.current) return;
      setReport(next);
      setSummary(next.clientSummary ?? '');
      setAnomalies(next.anomaliesActions ?? '');
      setRecommendations(next.recommendations ?? '');
      setSaved({ summary: next.clientSummary ?? '', anomalies: next.anomaliesActions ?? '', recommendations: next.recommendations ?? '' });
    } catch (error) {
      if (generation === loadGeneration.current) {
        onMessage(error instanceof Error ? error.message : 'Impossible de préparer le rapport de maintenance.');
      }
    }
  }

  useEffect(() => {
    if (!open) return;
    const generation = ++loadGeneration.current;
    void load(generation);
    return () => { loadGeneration.current += 1; };
  }, [periodId, open]);

  async function save(): Promise<void> {
    // Un double clic avant le prochain rendu React ne doit pas lancer deux écritures.
    if (savingRef.current) return;
    savingRef.current = true;
    const submitted = { summary, anomalies, recommendations };
    setSaving(true);
    try {
      const next = await window.atoumweb.maintenanceReports.updateDraft(periodId, {
        clientSummary: submitted.summary,
        anomaliesActions: submitted.anomalies,
        recommendations: submitted.recommendations,
      });
      setReport(next);
      // La base de comparaison est l'envoi effectivement sauvegardé ; la saisie
      // réalisée pendant la requête reste un brouillon local non enregistré.
      setSaved(submitted);
      onMessage('Brouillon du rapport client enregistré.');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible d’enregistrer le rapport.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return <section className="maintenance-report-box">
    <button className="maintenance-report-toggle" type="button" onClick={() => { if (open) requestUnsavedExit(() => setOpen(false)); else setOpen(true); }}>
      <span><span className="eyebrow">Rapport client</span><strong>Rapport de maintenance de la période</strong></span>
      <span aria-hidden="true">{open ? '−' : '+'}</span>
    </button>
    {open && !report && <p className="muted maintenance-report-loading">Préparation du rapport…</p>}
    {open && report && <div className="maintenance-report-content">
      <div className="maintenance-report-preview-head"><div><strong>{report.clientLabel}</strong><small>{report.planName}{report.projectLabel ? ` · ${report.projectLabel}` : ''}</small></div><div><strong>{report.periodStart} → {report.periodEnd}</strong><small>{report.interventionCount} intervention(s) · {duration(report.totalTimeSeconds)}</small></div></div>
      <div className="maintenance-report-fields">
        <label>Synthèse client<textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Résumé clair des opérations réalisées pendant la période…" /></label>
        <label>Anomalies / actions<textarea value={anomalies} onChange={(event) => setAnomalies(event.target.value)} placeholder="Anomalies constatées et actions réalisées, sans notes internes…" /></label>
        <label>Recommandations<textarea value={recommendations} onChange={(event) => setRecommendations(event.target.value)} placeholder="Recommandations éventuelles pour le client…" /></label>
      </div>
      <div className="maintenance-report-section"><strong>Checklist</strong>{report.checks.map((check) => <div key={`${check.label}-${check.status}`} className="maintenance-report-line"><span>{check.status === 'done' ? '✓' : check.status === 'not_applicable' ? '—' : '○'} {check.label}</span><small>{check.status === 'done' ? 'Réalisé' : check.status === 'not_applicable' ? 'Non applicable' : 'À faire'}</small></div>)}</div>
      <div className="maintenance-report-section"><strong>Interventions</strong>{report.interventions.length ? report.interventions.map((intervention) => <div key={intervention.id} className="maintenance-report-line"><span>{intervention.number} · {intervention.subject}</span><small>{duration(intervention.durationSeconds)}</small></div>) : <p className="muted">Aucune intervention sur la période.</p>}</div>
      <div className="maintenance-report-stats"><span>Quota : <strong>{report.interventionCount}{report.includedInterventions ? ` / ${report.includedInterventions}` : ''}</strong></span><span>Restant : <strong>{report.remainingInterventions ?? 'Sans quota standard'}</strong></span><span>Dépassement : <strong>{report.overageCount}</strong></span></div>
      <div className="button-row"><button className="primary-button" type="button" disabled={saving} onClick={() => void save()}>{saving ? 'Enregistrement…' : 'Enregistrer le brouillon'}</button><span className="muted maintenance-report-note">Le PDF final sera produit par Documents & Contrats en Phase 5.</span></div>
    </div>}
  </section>;
}
