import {useSearchTargetConfirmation,type EntityReady} from '../ui/useSearchTargetConfirmation';
import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  BusinessBackupLocationInput,
  BusinessBackupLocationType,
  BusinessBackupOverview,
  BusinessBackupRecord,
  BusinessBackupType,
} from '../../shared/businessBackups';
import type { ClientSummary } from '../../shared/crm';
import type { ProjectSummary } from '../../shared/projects';
import { OperationIcon, type OperationIconName } from '../operations/OperationIcon';
import { businessBackupLocationActionLabel, businessBackupLocationStatus } from '../../shared/businessBackupPresentation';
import { useUnsavedDraft } from '../unsaved/unsaved';
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
  initialRequest?:number;
  onEntityReady?:EntityReady;
}

export function BusinessBackupsPage({ onEntityReady, onMessage, initialRecordId, initialRequest }: Props) {
  const [records, setRecords] = useState<BusinessBackupRecord[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [overview, setOverview] = useState<BusinessBackupOverview | null>(null);
  const [selected, setSelected] = useState<BusinessBackupRecord | null>(null);
  const [detailExpanded, setDetailExpanded] = useState(false);
  const [splitPercent, setSplitPercent] = useState(38);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<BusinessBackupType | ''>('');
  const [locationFilter, setLocationFilter] = useState<BusinessBackupLocationType | ''>('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Le verrou ref protège dès le premier clic, avant toute mise à jour React.
  const mutationLock = useRef(false);
  const [mutationBusy, setMutationBusy] = useState(false);
  async function runMutation(action: () => Promise<void>): Promise<void> {
    if (mutationLock.current) return;
    mutationLock.current = true;
    setMutationBusy(true);
    try { await action(); }
    catch (actionError) { setError(actionError instanceof Error ? actionError.message : 'Opération indisponible.'); }
    finally { mutationLock.current = false; setMutationBusy(false); }
  }
  useSearchTargetConfirmation('backup_record',selected?.id,false,onEntityReady);

  const [form, setForm] = useState({
    projectId: '', clientAccountId: '', backupType: 'complete' as BusinessBackupType,
    label: '', backupAt: '', notes: '',
  });
  const [locationForm, setLocationForm] = useState({
    locationType: 'server' as BusinessBackupLocationType,
    label: '', pathOrReference: '', notes: '',
  });

  const createDraft = useUnsavedDraft('Déclaration de sauvegarde métier', form, {
    ready: creating,
    pending: mutationBusy,
    discard: setForm,
  });
  const locationDraft = useUnsavedDraft('Nouvel emplacement de sauvegarde', locationForm, {
    ready: !!selected,
    resetKey: selected?.id,
    pending: mutationBusy,
    discard: setLocationForm,
  });
  function changeSelected(next: BusinessBackupRecord | null): void {
    locationDraft.request(() => {
      setSelected(next);
      setDetailExpanded(false);
      setLocationForm({ locationType: 'server', label: '', pathOrReference: '', notes: '' });
    });
  }

  const loadEpoch=useRef(0);useEffect(()=>()=>{loadEpoch.current++;},[]);
  async function load(preferredId?: string | null): Promise<void> {
    const epoch=++loadEpoch.current;
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
      if(epoch!==loadEpoch.current)return;
      setRecords(nextRecords);
      setProjects(nextProjects);
      setClients(nextClients);
      setOverview(nextOverview);
      const targetId = preferredId ?? initialRecordId ?? selected?.id;
      if (targetId) {
        const found = nextRecords.find((record) => record.id === targetId)
          ?? await window.atoumweb.businessBackups.get(targetId).catch(() => null);
        if(epoch!==loadEpoch.current)return;
        if(!found)onEntityReady?.('backup_record',targetId,'Sauvegarde introuvable.');
        setSelected(found);
      } else if (selected && !nextRecords.some((record) => record.id === selected.id)) {
        setSelected(null);
      }
    } catch (loadError) {
      if(epoch!==loadEpoch.current)return;
      if(preferredId)onEntityReady?.('backup_record',preferredId,loadError instanceof Error?loadError.message:'Sauvegardes indisponibles.');
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger les sauvegardes métier.');
    }
  }

  useEffect(() => {
    void load(initialRecordId ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, typeFilter, locationFilter, initialRecordId,initialRequest]);

  useEffect(() => {
    if (!selected) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!mutationLock.current) changeSelected(null);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selected?.id]);

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
      const cleared = { projectId: '', clientAccountId: '', backupType: 'complete', label: '', backupAt: '', notes: '' };
      setForm(cleared);
      createDraft.saved(cleared);
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
      const cleared: typeof locationForm = { locationType: 'server', label: '', pathOrReference: '', notes: '' };
      setLocationForm(cleared);
      locationDraft.saved(cleared);
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
      const location = changed.locations.find((item) => item.id === locationId);
      onMessage(location?.locationType === 'local' ? 'Présence du chemin local contrôlée (intégrité et restauration non testées).' : 'Confirmation manuelle enregistrée (restauration non testée).');
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'Vérification impossible.');
    }
  }

  async function relocalize(locationId: string): Promise<void> {
    try {
      const changed = await window.atoumweb.businessBackups.relocalize(locationId);
      setSelected(changed);
      await load(changed.id);
      onMessage('Chemin local relocalisé ; son existence a été contrôlée, pas son intégrité.');
    } catch (relocalizeError) {
      setError(relocalizeError instanceof Error ? relocalizeError.message : 'Relocalisation impossible.');
    }
  }

  async function openLocal(locationId: string): Promise<void> {
    const result = await window.atoumweb.businessBackups.openLocation(locationId);
    if (!result.ok) setError(result.error ?? 'Impossible d’ouvrir cette copie locale.');
  }

  function beginResize(): void {
    const workspace = document.querySelector<HTMLElement>('.business-backups-layout.with-detail');
    if (!workspace) return;
    document.body.classList.add('business-backups-resizing');
    const onMove = (event: PointerEvent) => {
      const rect = workspace.getBoundingClientRect();
      if (!rect.width) return;
      const ratio = ((event.clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.max(20, Math.min(58, ratio)));
    };
    const onUp = () => {
      document.body.classList.remove('business-backups-resizing');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
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
        <BackupKpi icon="database" label="Sauvegardes connues" value={overview?.totalRecords ?? 0} detail={overview?.latestKnown ? dateLabel(overview.latestKnown.backupAt) : 'Aucune'} />
        <BackupKpi icon="folder" label="Copies locales présentes" value={overview?.localCopies ?? 0} detail={overview?.latestLocal ? `Dernière : ${dateLabel(overview.latestLocal.backupAt)}` : 'Aucune copie locale'} />
        <BackupKpi icon="alert" label="Copies locales manquantes" value={overview?.missingLocalCopies ?? 0} detail={overview?.missingLocalCopies ? 'À relocaliser' : 'Aucune anomalie'} />
        <BackupKpi icon="check-circle" label="Référence stable déclarée" value={overview?.latestStable ? '1' : '0'} detail={overview?.latestStable?.label ?? 'Non définie'} />
      </div>

      <p className="technical-safety-note" role="note">Ce registre recense des sauvegardes déclarées. Il ne crée pas de fichiers, ne restaure pas WordPress et ne certifie ni intégrité ni restauration testée. La sauvegarde SQLite du Manager est une opération distincte dans Réglages.</p>

      {error && <div className="notice business-backups-error" role="alert"><span>{error}</span><button type="button" onClick={() => setError(null)}>×</button></div>}

      <article className="panel business-backups-toolbar">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une sauvegarde ou un emplacement…" />
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as BusinessBackupType | '')}><option value="">Tous les types</option>{BACKUP_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}</select>
        <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value as BusinessBackupLocationType | '')}><option value="">Tous les emplacements</option>{LOCATION_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}</select>
        <button className="primary-button" type="button" disabled={mutationBusy} onClick={() => { if (creating) createDraft.request(() => setCreating(false)); else setCreating(true); }}>{creating ? <><OperationIcon name="close" size={16} /> Fermer</> : <><OperationIcon name="database" size={16} /> Déclarer une sauvegarde</>}</button>
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
        <p className="technical-safety-note">Cette action déclare une sauvegarde préexistante. Aucun fichier de sauvegarde WordPress n’est créé. Le registre est distinct de la sauvegarde SQLite interne du Manager.</p>
        <button className="primary-button" type="button" disabled={mutationBusy} onClick={() => void runMutation(createRecord)}>Créer l’enregistrement</button>
      </article>}

      <div
        className={`business-backups-layout ${selected ? 'with-detail' : 'list-only'} ${detailExpanded ? 'detail-expanded' : ''}`}
        style={selected && !detailExpanded ? { gridTemplateColumns: `${splitPercent}% 8px minmax(0, 1fr)` } : undefined}
      >
        {!detailExpanded && <article className="panel business-backups-list">
          <div className="panel-title"><div><span className="eyebrow">Historique</span><h2>Sauvegardes</h2></div><span className="status-pill">{records.length}</span></div>
          {records.length === 0 && <p className="muted">Aucune sauvegarde ne correspond aux filtres.</p>}
          {records.map((record) => <button type="button" key={record.id} className={`business-backup-row ${selected?.id === record.id ? 'selected' : ''}`} disabled={mutationBusy} onClick={() => changeSelected(record)}>
            <div><strong>{record.label}</strong><span>{backupTypeLabel(record.backupType)} · {dateLabel(record.backupAt)}</span></div>
            <div>{record.stable && <span className="stable-badge">Stable</span>}<span>{record.locations.length} emplacement{record.locations.length > 1 ? 's' : ''}</span></div>
          </button>)}
        </article>}

        {selected && !detailExpanded && <div className="business-backups-splitter" role="separator" aria-orientation="vertical" aria-label="Redimensionner la liste et la fiche sauvegarde" tabIndex={0} onPointerDown={beginResize} onDoubleClick={() => setSplitPercent(38)} onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') setSplitPercent((value) => Math.max(20, value - 3));
          if (event.key === 'ArrowRight') setSplitPercent((value) => Math.min(58, value + 3));
        }}><span /></div>}

        {selected && <article className={`panel business-backups-detail ${detailExpanded ? 'expanded' : ''}`}>
            <div className="panel-title business-backups-detail-heading"><div><span className="eyebrow">{backupTypeLabel(selected.backupType)} · {dateLabel(selected.backupAt)}</span><h2>{selected.label}</h2></div><div className="business-backups-detail-actions">{!selected.stable && <button className="secondary-button" type="button" disabled={mutationBusy} onClick={() => void runMutation(markStable)}><OperationIcon name="check-circle" size={16} /> Définir comme référence stable</button>}<button className="operation-detail-expand" type="button" title={detailExpanded ? 'Réduire la fiche' : 'Agrandir la fiche'} aria-label={detailExpanded ? 'Réduire la fiche' : 'Agrandir la fiche'} onClick={() => setDetailExpanded((value) => !value)}><OperationIcon name={detailExpanded ? 'collapse' : 'expand'} size={18} /></button><button className="close-detail" type="button" title="Fermer" aria-label="Fermer" disabled={mutationBusy} onClick={() => changeSelected(null)}><OperationIcon name="close" size={18} /></button></div></div>
            <div className="business-backup-context">
              <div><span>Projet</span><strong>{selected.projectId ? projectById.get(selected.projectId)?.name ?? selected.projectId : '—'}</strong></div>
              <div><span>Client</span><strong>{selected.clientAccountId ? clientById.get(selected.clientAccountId)?.displayName ?? selected.clientAccountId : '—'}</strong></div>
              <div><span>Référence stable</span><strong>{selected.stable ? 'Déclarée (restauration non testée)' : 'Non définie'}</strong></div>
            </div>
            {selected.notes && <p className="muted">{selected.notes}</p>}

            <div className="business-backup-locations">
              <h3>Emplacements</h3>
              {selected.locations.length === 0 && <p className="muted">Aucun emplacement enregistré. Une sauvegarde connue sans emplacement ne constitue pas une copie locale.</p>}
              {selected.locations.map((location) => <div className={`business-backup-location ${location.locationType === 'local' && location.exists === false ? 'missing' : ''}`} key={location.id}>
                <div><strong>{location.label}</strong><span>{locationTypeLabel(location.locationType)} · {location.pathOrReference}</span></div>
                <div className="business-backup-location-state"><span>{businessBackupLocationStatus(location)}</span></div>
                <div className="button-row">
                  <button className="secondary-button" type="button" disabled={mutationBusy} onClick={() => void runMutation(() => verifyLocation(location.id))}><OperationIcon name="check-circle" size={16} /> {businessBackupLocationActionLabel(location.locationType)}</button>
                  {location.locationType === 'local' && location.exists && <button className="secondary-button" type="button" onClick={() => void openLocal(location.id)}><OperationIcon name="external-link" size={16} /> Ouvrir</button>}
                  {location.locationType === 'local' && <button className="secondary-button" type="button" disabled={mutationBusy} onClick={() => void runMutation(() => relocalize(location.id))}><OperationIcon name="folder" size={16} /> Relocaliser</button>}
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
              <button className="primary-button" type="button" disabled={mutationBusy} onClick={() => void runMutation(addLocation)}>Ajouter l’emplacement</button>
            </div>
        </article>}
      </div>
    </div>
  );
}

function BackupKpi({ icon, label, value, detail }: { icon: OperationIconName; label: string; value: number | string; detail: string }) {
  return <article className="kpi-card business-backup-kpi"><span className="business-backup-kpi-icon"><OperationIcon name={icon} size={27} /></span><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></article>;
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
