import { useEffect, useMemo, useState } from 'react';
import type { InterventionBackupReview } from '../../shared/businessBackupAlerts';
import type { BusinessBackupRecord } from '../../shared/businessBackups';
import type { Intervention } from '../../shared/operations';

function dateLabel(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

export function InterventionBackupPanel({ intervention, onMessage, onChanged }: {
  intervention: Intervention;
  onMessage: (message: string) => void;
  onChanged?: () => void;
}) {
  const [review, setReview] = useState<InterventionBackupReview | null>(null);
  const [records, setRecords] = useState<BusinessBackupRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const [busy, setBusy] = useState(false);

  async function load(): Promise<void> {
    try {
      const [nextReview, nextRecords] = await Promise.all([
        window.atoumweb.businessBackupAlerts.reviewIntervention(intervention.id),
        window.atoumweb.businessBackups.list({
          clientAccountId: intervention.clientAccountId,
          projectId: intervention.projectId ?? null,
        }),
      ]);
      setReview(nextReview);
      setRecords(nextRecords);
      setSelectedRecordId((current) => nextRecords.some((record) => record.id === current) ? current : (nextRecords[0]?.id ?? ''));
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de charger les sauvegardes liées à l’intervention.');
    }
  }

  useEffect(() => { void load(); }, [intervention.id, intervention.status, intervention.updatedAt]);

  const latestLocal = useMemo(() =>
    records.find((record) => record.locations.some((location) => location.locationType === 'local' && location.exists === true))
      ?? review?.latestLocal
      ?? null,
  [records, review?.latestLocal?.id]);

  const suggestedRole = useMemo<'pre_intervention' | 'post_intervention' | 'reference'>(() => {
    if (review && !review.preInterventionBackup && !['completed', 'cancelled', 'archived'].includes(intervention.status)) return 'pre_intervention';
    if (review && !review.postInterventionBackup && intervention.status === 'completed') return 'post_intervention';
    return 'reference';
  }, [review, intervention.status]);

  async function record(role: 'pre_intervention' | 'post_intervention'): Promise<void> {
    setBusy(true);
    try {
      const changed = await window.atoumweb.businessBackupAlerts.recordForIntervention({
        interventionId: intervention.id,
        role,
      });
      setReview(changed);
      await load();
      onChanged?.();
      onMessage(role === 'pre_intervention'
        ? 'Trace de sauvegarde avant intervention enregistrée.'
        : 'Trace de sauvegarde après validation enregistrée.');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible d’enregistrer la trace de sauvegarde.');
    } finally {
      setBusy(false);
    }
  }

  async function linkExisting(): Promise<void> {
    if (!selectedRecordId) return;
    setBusy(true);
    try {
      const changed = await window.atoumweb.businessBackupAlerts.linkExisting(intervention.id, selectedRecordId, suggestedRole);
      setReview(changed);
      onChanged?.();
      onMessage('Sauvegarde existante reliée à l’intervention.');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de relier cette sauvegarde.');
    } finally {
      setBusy(false);
    }
  }

  if (!review) {
    return <section className="intervention-backup-panel"><span className="muted">Chargement du contrôle de sauvegarde…</span></section>;
  }

  return <section className="intervention-backup-panel">
    <div className="intervention-backup-heading">
      <div><span className="eyebrow">Sécurité & sauvegardes</span><h3>Protection de l’intervention</h3></div>
      <button className="secondary-button" type="button" onClick={() => void load()}>↻</button>
    </div>

    {review.alerts.length > 0 && <div className="intervention-backup-alerts">
      {review.alerts.map((alert) => <div className={`intervention-backup-alert ${alert.severity}`} key={alert.id}>
        <strong>{alert.title}</strong>
        <span>{alert.detail}</span>
      </div>)}
    </div>}

    <div className="intervention-backup-summary">
      <div><span>Dernière sauvegarde connue</span><strong>{review.latestKnown ? review.latestKnown.label : 'Aucune'}</strong><small>{review.latestKnown ? dateLabel(review.latestKnown.backupAt) : '—'}</small></div>
      <div><span>Dernière copie locale</span><strong>{latestLocal ? latestLocal.label : 'Aucune'}</strong><small>{latestLocal ? dateLabel(latestLocal.backupAt) : '—'}</small></div>
      <div><span>Avant intervention</span><strong>{review.preInterventionBackup?.label ?? 'Non reliée'}</strong></div>
      <div><span>Après validation</span><strong>{review.postInterventionBackup?.label ?? 'Non reliée'}</strong></div>
    </div>

    <p className="technical-safety-note">
      Ces actions enregistrent la traçabilité d’une sauvegarde. Elles ne déclenchent pas automatiquement une sauvegarde chez l’hébergeur ou une copie de fichiers.
    </p>

    <div className="intervention-backup-actions">
      {!review.preInterventionBackup && !['completed', 'cancelled', 'archived'].includes(intervention.status) &&
        <button className="primary-button" type="button" disabled={busy} onClick={() => void record('pre_intervention')}>Tracer une sauvegarde avant</button>}
      {intervention.status === 'completed' && !review.postInterventionBackup &&
        <button className="primary-button" type="button" disabled={busy} onClick={() => void record('post_intervention')}>Tracer une sauvegarde après validation</button>}
      <button className="secondary-button" type="button" onClick={() => window.dispatchEvent(new CustomEvent('atoumweb:open-page', { detail: 'Sauvegardes' }))}>Ouvrir Sauvegardes</button>
    </div>

    {records.length > 0 && <div className="intervention-backup-link-existing">
      <label>Relier une sauvegarde existante
        <select value={selectedRecordId} onChange={(event) => setSelectedRecordId(event.target.value)}>
          {records.map((record) => <option key={record.id} value={record.id}>{dateLabel(record.backupAt)} · {record.label}</option>)}
        </select>
      </label>
      <button className="secondary-button" type="button" disabled={busy || !selectedRecordId} onClick={() => void linkExisting()}>
        {suggestedRole === 'pre_intervention' ? 'Lier comme sauvegarde avant' : suggestedRole === 'post_intervention' ? 'Lier comme sauvegarde après' : 'Lier comme référence'}
      </button>
    </div>}
  </section>;
}
