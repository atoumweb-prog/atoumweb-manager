import { useEffect, useMemo, useState } from 'react';
import type {
  BusinessBackupLocationInput,
  BusinessBackupLocationType,
  BusinessBackupOverview,
  BusinessBackupRecord,
  BusinessBackupType,
} from '../../shared/businessBackups';
import type { ClientSummary } from '../../shared/crm';
import type { ProjectSummary } from '../../shared/projects';
import './BusinessBackupsPage.css';

const BACKUP_TYPES: Array<{ id: BusinessBackupType; label: string }> = [
  { id: 'complete', label: 'Complète' },
  { id: 'database', label: 'Base de données' },
  { id: 'files_code', label: 'Fichiers / code' },
  { id: 'config_export', label: 'Configuration / export' },
  { id: 'pre_intervention', label: 'Avant intervention' },
  { id: 'post_validation', label: 'Après validation' },
  { id: 'other', label: 'Autre' },
];

const LOCATION_TYPES: Array<{ id: BusinessBackupLocationType; label: string }> = [
  { id: 'server', label: 'Serveur / hébergeur' },
  { id: 'local', label: 'Copie locale' },
  { id: 'external', label: 'Stockage externe' },
  { id: 'other', label: 'Autre emplacement' },
];

interface Props {
  onMessage: (message: string) => void;
  initialRecordId?: string | null;
}

export function BusinessBackupsPage({ onMessage, initialRecordId }: Props) {
  const [records, setRecords] = useState<BusinessBackupRecord[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [overview, setOverview] = useState<BusinessBackupOverview | null>(null);
  const [selected, setSelected] = useState<BusinessBackupRecord | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<BusinessBackupType | ''>('');
  const [locationFilter, setLocationFilter] = useState<BusinessBackupLocationType | ''>('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    projectId: '', clientAccountId: '', backupType: 'complete' as BusinessBackupType,
    label: '', backupAt: '', notes: '',
  });
  const [locationForm, setLocationForm] = useState({
    locationType: 'server' as BusinessBackupLocationType,
    label: '', pathOrReference: '', notes: '',
  });

  async function load(preferredId?: string | null): Promise<void> {
    try {
      setError(null);
      const [nextRecords, nextProjects, nextClients, nextOverview] = await Promise.all([
        window.atoumweb.businessBackups.list({
          search: search || null,
          backupType: typeFilter || null,
          locationType: locationFilter || null,
        }),
        window.atoumweb.projects.projects.list(),
        window.atoumweb.crm.clients.list({ includeArchived: true }),
        window.atoumweb.businessBackups.overview(),
      ]);
      setRecords(nextRecords);
      setProjects(nextProjects);
      setClients(nextClients);
      setOverview(nextOverview);
      const targetId = preferredId ?? initialRecordId ?? selected?.id;
      if (targetId) {
        const found = nextRecords.find((record) => record.id === targetId)
          ?? await window.atoumweb.businessBackups.get(targetId).catch(() => null);
        setSelected(found);
      } else if (selected && !nextRecords.some((record) => record.id === selected.id)) {
        setSelected(null);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger les sauvegardes métier.');
    }
  }

  useEffect(() => {
    void load(initialRecordId ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, typeFilter, locationFilter, initialRecordId]);

  const projectById = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);
  const clientById = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients]);

  async function createRecord(): Promise<void> {
    try {
      setError(null);
      const created = await window.atoumweb.businessBackups.create({
        projectId: form.projectId || null,
        clientAccountId: form.clientAccountId || null,
        backupType: form.backupType,
        label: form.label,
        backupAt: form.backupAt ? new Date(form.backupAt).toISOString() : null,
        notes: form.notes || null,
      });
      setCreating(false);
      setForm({ projectId: '', clientAccountId: '', backupType: 'complete', label: '', backupAt: '', notes: '' });
      await load(created.id);
      setSelected(created);
      onMessage(`Sauvegarde métier « ${created.label} » enregistrée.`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Création de la sauvegarde impossible.');
    }
  }

  async function addLocation(): Promise<void> {
    if (!selected) return;
    try {
      setError(null);
      const input: BusinessBackupLocationInput = {
        locationType: locationForm.locationType,
        label: locationForm.label,
        pathOrReference: locationForm.pathOrReference,
        notes: locationForm.notes || null,
      };
      const changed = await window.atoumweb.businessBackups.addLocation(selected.id, input);
      setLocationForm({ locationType: 'server', label: '', pathOrReference: '', notes: '' });
      setSelected(changed);
      await load(changed.id);
      onMessage(`Emplacement « ${input.label} » ajouté à la sauvegarde.`);
    } catch (locationError) {
      setError(locationError instanceof Error ? locationError.message : 'Ajout de l’emplacement impossible.');
    }
  }

  async function verifyLocation(locationId: string): Promise<void> {
    try {
      const changed = await window.atoumweb.businessBackups.verifyLocation(locationId);
      setSelected(changed);
      await load(changed.id);
      onMessage('État de l’emplacement vérifié et enregistré.');
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'Vérification impossible.');
    }
  }

  async function relocalize(locationId: string): Promise<void> {
    try {
      const changed = await window.atoumweb.businessBackups.relocalize(locationId);
      setSelected(changed);
      await load(changed.id);
      onMessage('Emplacement local mis à jour.');
    } catch (relocalizeError) {
      setError(relocalizeError instanceof Error ? relocalizeError.message : 'Relocalisation impossible.');
    }
  }

  async function openLocal(locationId: string): Promise<void> {
    const result = await window.atoumweb.businessBackups.openLocation(locationId);
    if (!result.ok) setError(result.error ?? 'Impossible d’ouvrir cette copie locale.');
  }

  async function markStable(): Promise<void> {
    if (!selected) return;
    try {
      const changed = await window.atoumweb.businessBackups.markStable(selected.id);
      setSelected(changed);
      await load(changed.id);
      onMessage(`« ${changed.label} » est maintenant la version stable de référence.`);
    } catch (stableError) {
      setError(stableError instanceof Error ? stableError.message : 'Impossible de définir cette version comme stable.');
    }
  }

  return (
    <div className="business-backups-page">
      <div className="business-backups-kpis">
        <BackupKpi label="Sauvegardes connues" value={overview?.totalRecords ?? 0} detail={overview?.latestKnown ? dateLabel(overview.latestKnown.backupAt) : 'Aucune'} />
        <BackupKpi label="Copies locales présentes" value={overview?.localCopies ?? 0} detail={overview?.latestLocal ? `Dernière : ${dateLabel(overview.latestLocal.backupAt)}` : 'Aucune copie locale'} />
        <BackupKpi label="Copies locales manquantes" value={overview?.missingLocalCopies ?? 0} detail={overview?.missingLocalCopies ? 'À relocaliser' : 'Aucune anomalie'} />
        <BackupKpi label="Version stable" value={overview?.latestStable ? '1' : '0'} detail={overview?.latestStable?.label ?? 'Non définie'} />
      </div>

      {error && <div className="notice business-backups-error"><span>{error}</span><button type="button" onClick={() => setError(null)}>×</button></div>}

      <article className="panel business-backups-toolbar">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une sauvegarde ou un emplacement…" />
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as BusinessBackupType | '')}><option value="">Tous les types</option>{BACKUP_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}</select>
        <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value as BusinessBackupLocationType | '')}><option value="">Tous les emplacements</option>{LOCATION_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}</select>
        <button className="primary-button" type="button" onClick={() => setCreating((value) => !value)}>{creating ? 'Fermer' : 'Nouvelle sauvegarde'}</button>
      </article>

      {creating && <article className="panel business-backups-create">
        <div className="panel-title"><div><span className="eyebrow">Nouvel enregistrement</span><h2>Sauvegarde métier</h2></div></div>
        <div className="business-backups-form-grid">
          <label>Projet<select value={form.projectId} onChange={(event) => setForm((value) => ({ ...value, projectId: event.target.value }))}><option value="">Aucun projet</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.number} · {project.name}</option>)}</select></label>
          <label>Client<select value={form.clientAccountId} onChange={(event) => setForm((value) => ({ ...value, clientAccountId: event.target.value }))}><option value="">Déduit du projet / aucun</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.displayName}{client.status === 'archived' ? ' · Archivé' : client.status === 'inactive' ? ' · Ancien client' : ''}</option>)}</select></label>
          <label>Type<select value={form.backupType} onChange={(event) => setForm((value) => ({ ...value, backupType: event.target.value as BusinessBackupType }))}>{BACKUP_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}</select></label>
          <label>Date / heure<input type="datetime-local" value={form.backupAt} onChange={(event) => setForm((value) => ({ ...value, backupAt: event.target.value }))} /></label>
        </div>
        <label>Libellé<input value={form.label} onChange={(event) => setForm((value) => ({ ...value, label: event.target.value }))} placeholder="Ex. Sauvegarde complète avant mise à jour WooCommerce" /></label>
        <label>Notes<textarea rows={2} value={form.notes} onChange={(event) => setForm((value) => ({ ...value, notes: event.target.value }))} /></label>
        <p className="technical-safety-note">Cet écran enregistre la traçabilité d’une sauvegarde de site/projet. Il ne s’agit pas de la sauvegarde SQLite interne d’AtoumWeb Manager.</p>
        <button className="primary-button" type="button" onClick={() => void createRecord()}>Créer l’enregistrement</button>
      </article>}

      <div className="business-backups-layout">
        <article className="panel business-backups-list">
          <div className="panel-title"><div><span className="eyebrow">Historique</span><h2>Sauvegardes</h2></div><span className="status-pill">{records.length}</span></div>
          {records.length === 0 && <p className="muted">Aucune sauvegarde ne correspond aux filtres.</p>}
          {records.map((record) => <button type="button" key={record.id} className={`business-backup-row ${selected?.id === record.id ? 'selected' : ''}`} onClick={() => setSelected(record)}>
            <div><strong>{record.label}</strong><span>{backupTypeLabel(record.backupType)} · {dateLabel(record.backupAt)}</span></div>
            <div>{record.stable && <span className="stable-badge">Stable</span>}<span>{record.locations.length} emplacement{record.locations.length > 1 ? 's' : ''}</span></div>
          </button>)}
        </article>

        <article className="panel business-backups-detail">
          {!selected ? <div className="business-backups-empty"><span className="eyebrow">Sauvegardes métier</span><h2>Sélectionne une sauvegarde</h2><p className="muted">Les emplacements serveur et locaux sont suivis séparément.</p></div> : <>
            <div className="panel-title"><div><span className="eyebrow">{backupTypeLabel(selected.backupType)} · {dateLabel(selected.backupAt)}</span><h2>{selected.label}</h2></div>{!selected.stable && <button className="secondary-button" type="button" onClick={() => void markStable()}>Marquer stable</button>}</div>
            <div className="business-backup-context">
              <div><span>Projet</span><strong>{selected.projectId ? projectById.get(selected.projectId)?.name ?? selected.projectId : '—'}</strong></div>
              <div><span>Client</span><strong>{selected.clientAccountId ? clientById.get(selected.clientAccountId)?.displayName ?? selected.clientAccountId : '—'}</strong></div>
              <div><span>Version stable</span><strong>{selected.stable ? 'Oui' : 'Non'}</strong></div>
            </div>
            {selected.notes && <p className="muted">{selected.notes}</p>}

            <div className="business-backup-locations">
              <h3>Emplacements</h3>
              {selected.locations.length === 0 && <p className="muted">Aucun emplacement enregistré. Une sauvegarde connue sans emplacement ne constitue pas une copie locale.</p>}
              {selected.locations.map((location) => <div className={`business-backup-location ${location.locationType === 'local' && location.exists === false ? 'missing' : ''}`} key={location.id}>
                <div><strong>{location.label}</strong><span>{locationTypeLabel(location.locationType)} · {location.pathOrReference}</span></div>
                <div className="business-backup-location-state">{location.locationType === 'local' ? <span>{location.exists ? 'Présente' : 'Introuvable'}</span> : <span>{location.verifiedAt ? `Confirmé ${dateLabel(location.verifiedAt)}` : 'Non confirmé'}</span>}</div>
                <div className="button-row">
                  <button className="secondary-button" type="button" onClick={() => void verifyLocation(location.id)}>{location.locationType === 'local' ? 'Vérifier' : 'Confirmer'}</button>
                  {location.locationType === 'local' && location.exists && <button className="secondary-button" type="button" onClick={() => void openLocal(location.id)}>Ouvrir</button>}
                  {location.locationType === 'local' && <button className="secondary-button" type="button" onClick={() => void relocalize(location.id)}>Relocaliser</button>}
                </div>
              </div>)}
            </div>

            <div className="business-backup-add-location">
              <h3>Ajouter un emplacement</h3>
              <div className="business-backups-form-grid">
                <label>Type<select value={locationForm.locationType} onChange={(event) => setLocationForm((value) => ({ ...value, locationType: event.target.value as BusinessBackupLocationType }))}>{LOCATION_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}</select></label>
                <label>Nom<input value={locationForm.label} onChange={(event) => setLocationForm((value) => ({ ...value, label: event.target.value }))} placeholder="Ex. JetBackup o2switch" /></label>
              </div>
              <label>{locationForm.locationType === 'local' ? 'Chemin local' : 'Référence / emplacement'}<input value={locationForm.pathOrReference} onChange={(event) => setLocationForm((value) => ({ ...value, pathOrReference: event.target.value }))} placeholder={locationForm.locationType === 'local' ? 'C:\\Sauvegardes\\site.zip' : 'Snapshot hébergeur / URL / référence'} /></label>
              <label>Notes<textarea rows={2} value={locationForm.notes} onChange={(event) => setLocationForm((value) => ({ ...value, notes: event.target.value }))} /></label>
              <button className="primary-button" type="button" onClick={() => void addLocation()}>Ajouter l’emplacement</button>
            </div>
          </>}
        </article>
      </div>
    </div>
  );
}

function BackupKpi({ label, value, detail }: { label: string; value: number | string; detail: string }) {
  return <article className="kpi-card"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}

function backupTypeLabel(type: BusinessBackupType): string {
  return BACKUP_TYPES.find((item) => item.id === type)?.label ?? type;
}

function locationTypeLabel(type: BusinessBackupLocationType): string {
  return LOCATION_TYPES.find((item) => item.id === type)?.label ?? type;
}

function dateLabel(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}
