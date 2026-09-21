import { randomUUID } from 'node:crypto';
import type {
  BusinessBackupAlert,
  BusinessBackupPolicy,
  BusinessBackupPolicyInput,
  InterventionBackupRecordInput,
  InterventionBackupReview,
} from '../../shared/businessBackupAlerts';
import type { BusinessBackupRecord } from '../../shared/businessBackups';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import { BusinessBackupService } from './BusinessBackupService';

const DEFAULT_KNOWN_AGE_DAYS = 7;
const DEFAULT_LOCAL_AGE_DAYS = 7;
const TECHNICAL_INTERVENTION_TYPES = new Set(['correction', 'modification', 'addition', 'maintenance', 'incident']);
const MAJOR_CHANGE_TYPES = new Set(['modification', 'addition', 'incident']);

interface PolicyRow extends Record<string, unknown> {
  client_account_id: string | null;
  project_id: string | null;
  max_known_age_days: number;
  max_local_age_days: number;
  warn_server_only: number;
  remind_before_intervention: number;
  remind_after_major_change: number;
}

interface InterventionRow extends Record<string, unknown> {
  id: string;
  intervention_number: string;
  client_account_id: string;
  project_id: string | null;
  intervention_type: string;
  status: string;
  subject: string;
  completed_at: string | null;
}

interface ProjectRow extends Record<string, unknown> {
  id: string;
  client_account_id: string | null;
  name: string;
  status: string;
}

export class BusinessBackupAlertService {
  constructor(
    private readonly database: DatabaseAdapter,
    private readonly backups: BusinessBackupService,
  ) {}

  getPolicy(input: { clientAccountId?: string | null; projectId?: string | null }): BusinessBackupPolicy {
    const context = this.resolveContext(input.clientAccountId, input.projectId);
    const projectPolicy = context.projectId
      ? this.database.get<PolicyRow>('SELECT * FROM backup_policies WHERE project_id=?', [context.projectId])
      : undefined;
    const clientPolicy = !projectPolicy && context.clientAccountId
      ? this.database.get<PolicyRow>('SELECT * FROM backup_policies WHERE project_id IS NULL AND client_account_id=?', [context.clientAccountId])
      : undefined;
    const row = projectPolicy ?? clientPolicy;
    if (row) return this.mapPolicy(row, !projectPolicy);

    return {
      clientAccountId: context.clientAccountId,
      projectId: context.projectId,
      maxKnownAgeDays: this.settingNumber('business_backups_default_max_known_age_days', DEFAULT_KNOWN_AGE_DAYS),
      maxLocalAgeDays: this.settingNumber('business_backups_default_max_local_age_days', DEFAULT_LOCAL_AGE_DAYS),
      warnServerOnly: this.settingBoolean('business_backups_default_warn_server_only', true),
      remindBeforeIntervention: this.settingBoolean('business_backups_default_remind_before_intervention', true),
      remindAfterMajorChange: this.settingBoolean('business_backups_default_remind_after_major_change', true),
      inherited: true,
    };
  }

  updatePolicy(input: BusinessBackupPolicyInput): BusinessBackupPolicy {
    if (!Number.isInteger(input.maxKnownAgeDays) || input.maxKnownAgeDays < 1) throw new Error('Le seuil de sauvegarde connue doit être supérieur ou égal à 1 jour.');
    if (!Number.isInteger(input.maxLocalAgeDays) || input.maxLocalAgeDays < 1) throw new Error('Le seuil de copie locale doit être supérieur ou égal à 1 jour.');
    const context = this.resolveContext(input.clientAccountId, input.projectId);
    const existing = context.projectId
      ? this.database.get<{ id: string }>('SELECT id FROM backup_policies WHERE project_id=?', [context.projectId])
      : this.database.get<{ id: string }>('SELECT id FROM backup_policies WHERE project_id IS NULL AND client_account_id=?', [context.clientAccountId]);
    const now = new Date().toISOString();
    if (existing) {
      this.database.run(
        `UPDATE backup_policies SET client_account_id=?,project_id=?,max_known_age_days=?,max_local_age_days=?,
         warn_server_only=?,remind_before_intervention=?,remind_after_major_change=?,updated_at=? WHERE id=?`,
        [
          context.clientAccountId, context.projectId, input.maxKnownAgeDays, input.maxLocalAgeDays,
          input.warnServerOnly ? 1 : 0, input.remindBeforeIntervention ? 1 : 0,
          input.remindAfterMajorChange ? 1 : 0, now, existing.id,
        ],
      );
    } else {
      this.database.run(
        `INSERT INTO backup_policies (
          id,client_account_id,project_id,max_known_age_days,max_local_age_days,warn_server_only,
          remind_before_intervention,remind_after_major_change,created_at,updated_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [
          randomUUID(), context.clientAccountId, context.projectId, input.maxKnownAgeDays, input.maxLocalAgeDays,
          input.warnServerOnly ? 1 : 0, input.remindBeforeIntervention ? 1 : 0,
          input.remindAfterMajorChange ? 1 : 0, now, now,
        ],
      );
    }
    this.activity('backup_policy_updated', context.projectId ?? context.clientAccountId ?? 'global', 'Politique de sauvegarde mise à jour.');
    return this.getPolicy(context);
  }

  listAlerts(): BusinessBackupAlert[] {
    const projects = this.database.all<ProjectRow>(
      `SELECT id,client_account_id,name,status FROM projects WHERE status NOT IN ('completed','archived') ORDER BY updated_at DESC`,
    );
    return projects.flatMap((project) => this.projectAlerts(project));
  }

  reviewIntervention(interventionId: string): InterventionBackupReview {
    const intervention = this.requireIntervention(interventionId);
    const policy = this.getPolicy({ clientAccountId: intervention.client_account_id, projectId: intervention.project_id });
    const overview = this.backups.overview({ clientAccountId: intervention.client_account_id, projectId: intervention.project_id });
    const pre = this.linkedBackup(intervention.id, 'pre_intervention');
    const post = this.linkedBackup(intervention.id, 'post_intervention');
    const alerts: BusinessBackupAlert[] = [];

    const technical = TECHNICAL_INTERVENTION_TYPES.has(intervention.intervention_type);
    if (technical && policy.remindBeforeIntervention && !pre && !['completed', 'cancelled', 'archived'].includes(intervention.status)) {
      alerts.push(this.alert(
        'pre_intervention_missing', 'warning', 'Sauvegarde avant intervention à confirmer',
        `Aucune sauvegarde n’est encore reliée comme sauvegarde avant ${intervention.intervention_number}.`,
        intervention.client_account_id, intervention.project_id, intervention.id, overview.latestKnown?.id ?? null,
      ));
    }

    const majorCompleted = MAJOR_CHANGE_TYPES.has(intervention.intervention_type) && intervention.status === 'completed';
    if (majorCompleted && policy.remindAfterMajorChange && !post) {
      alerts.push(this.alert(
        'post_change_missing', 'info', 'Nouvelle version stable à envisager',
        `L’intervention ${intervention.intervention_number} est terminée après un changement important. Une sauvegarde post-validation peut être enregistrée puis marquée stable.`,
        intervention.client_account_id, intervention.project_id, intervention.id, overview.latestStable?.id ?? null,
      ));
    }

    return {
      interventionId: intervention.id,
      projectId: intervention.project_id,
      clientAccountId: intervention.client_account_id,
      policy,
      latestKnown: overview.latestKnown,
      latestLocal: overview.latestLocal,
      preInterventionBackup: pre,
      postInterventionBackup: post,
      alerts,
    };
  }

  recordForIntervention(input: InterventionBackupRecordInput): InterventionBackupReview {
    const intervention = this.requireIntervention(input.interventionId);
    const backupType = input.role === 'pre_intervention'
      ? 'pre_intervention'
      : input.role === 'post_intervention' ? 'post_validation' : 'other';
    const defaultLabel = input.role === 'pre_intervention'
      ? `Avant ${intervention.intervention_number} — ${intervention.subject}`
      : input.role === 'post_intervention'
        ? `Après ${intervention.intervention_number} — ${intervention.subject}`
        : `Référence ${intervention.intervention_number} — ${intervention.subject}`;
    const record = this.backups.create({
      clientAccountId: intervention.client_account_id,
      projectId: intervention.project_id,
      backupType,
      label: input.label?.trim() || defaultLabel,
      notes: input.notes?.trim() || null,
    });
    this.linkExisting(intervention.id, record.id, input.role);
    return this.reviewIntervention(intervention.id);
  }

  linkExisting(interventionId: string, backupRecordId: string, role: 'pre_intervention' | 'post_intervention' | 'reference'): InterventionBackupReview {
    const intervention = this.requireIntervention(interventionId);
    const record = this.backups.get(backupRecordId);
    if (intervention.project_id) {
      if (record.projectId !== intervention.project_id) throw new Error('La sauvegarde choisie n’appartient pas au projet de cette intervention.');
    } else if (record.clientAccountId !== intervention.client_account_id) {
      throw new Error('La sauvegarde choisie n’appartient pas au client de cette intervention.');
    }
    this.database.run(
      `INSERT OR IGNORE INTO backup_intervention_links (id,backup_record_id,intervention_id,link_role,created_at)
       VALUES (?,?,?,?,?)`,
      [randomUUID(), backupRecordId, interventionId, role, new Date().toISOString()],
    );
    this.activity('backup_linked_to_intervention', interventionId, `Sauvegarde ${record.label} reliée à ${intervention.intervention_number} (${role}).`);
    return this.reviewIntervention(interventionId);
  }

  private projectAlerts(project: ProjectRow): BusinessBackupAlert[] {
    const policy = this.getPolicy({ clientAccountId: project.client_account_id, projectId: project.id });
    const overview = this.backups.overview({ clientAccountId: project.client_account_id, projectId: project.id });
    if (!overview.latestKnown) {
      return [this.alert('no_backup', 'warning', 'Aucune sauvegarde connue', `Le projet « ${project.name} » ne possède aucune sauvegarde métier enregistrée.`, project.client_account_id, project.id)];
    }

    const alerts: BusinessBackupAlert[] = [];
    const knownAge = this.ageDays(overview.latestKnown.backupAt);
    if (knownAge > policy.maxKnownAgeDays) {
      alerts.push(this.alert(
        'known_too_old', 'warning', 'Sauvegarde connue trop ancienne',
        `La dernière sauvegarde connue du projet « ${project.name} » date de ${knownAge} jours (seuil : ${policy.maxKnownAgeDays}).`,
        project.client_account_id, project.id, null, overview.latestKnown.id, knownAge,
      ));
    }

    if (!overview.latestLocal) {
      const hasRemote = overview.latestKnown.locations.some((location) => location.locationType !== 'local');
      if (hasRemote && policy.warnServerOnly) {
        alerts.push(this.alert(
          'server_only', 'warning', 'Sauvegarde connue sans copie locale',
          `Le projet « ${project.name} » possède une sauvegarde connue côté serveur/externe mais aucune copie locale présente.`,
          project.client_account_id, project.id, null, overview.latestKnown.id,
        ));
      } else {
        alerts.push(this.alert(
          'no_recent_local', 'warning', 'Aucune copie locale disponible',
          `Aucune copie locale présente n’est enregistrée pour le projet « ${project.name} ».`,
          project.client_account_id, project.id, null, overview.latestKnown.id,
        ));
      }
    } else {
      const localAge = this.ageDays(overview.latestLocal.backupAt);
      if (localAge > policy.maxLocalAgeDays) {
        alerts.push(this.alert(
          'no_recent_local', 'warning', 'Copie locale trop ancienne',
          `La dernière copie locale du projet « ${project.name} » date de ${localAge} jours (seuil : ${policy.maxLocalAgeDays}).`,
          project.client_account_id, project.id, null, overview.latestLocal.id, localAge,
        ));
      }
    }
    return alerts;
  }

  private linkedBackup(interventionId: string, role: 'pre_intervention' | 'post_intervention'): BusinessBackupRecord | null {
    const row = this.database.get<{ backup_record_id: string }>(
      `SELECT backup_record_id FROM backup_intervention_links
       WHERE intervention_id=? AND link_role=? ORDER BY created_at DESC LIMIT 1`,
      [interventionId, role],
    );
    return row ? this.backups.get(row.backup_record_id) : null;
  }

  private requireIntervention(id: string): InterventionRow {
    const row = this.database.get<InterventionRow>(
      `SELECT id,intervention_number,client_account_id,project_id,intervention_type,status,subject,completed_at
       FROM interventions WHERE id=?`,
      [id],
    );
    if (!row) throw new Error('Intervention introuvable.');
    return row;
  }

  private resolveContext(clientAccountId?: string | null, projectId?: string | null): { clientAccountId: string | null; projectId: string | null } {
    const project = projectId
      ? this.database.get<{ client_account_id: string | null }>('SELECT client_account_id FROM projects WHERE id=?', [projectId])
      : undefined;
    if (projectId && !project) throw new Error('Projet introuvable.');
    const resolvedClient = clientAccountId ?? project?.client_account_id ?? null;
    if (!resolvedClient && !projectId) throw new Error('Un Client ou un Projet est requis pour la politique de sauvegarde.');
    if (clientAccountId && project?.client_account_id && clientAccountId !== project.client_account_id) {
      throw new Error('Le Client choisi ne correspond pas au Projet.');
    }
    return { clientAccountId: resolvedClient, projectId: projectId ?? null };
  }

  private mapPolicy(row: PolicyRow, inherited: boolean): BusinessBackupPolicy {
    return {
      clientAccountId: row.client_account_id,
      projectId: row.project_id,
      maxKnownAgeDays: Number(row.max_known_age_days),
      maxLocalAgeDays: Number(row.max_local_age_days),
      warnServerOnly: Boolean(row.warn_server_only),
      remindBeforeIntervention: Boolean(row.remind_before_intervention),
      remindAfterMajorChange: Boolean(row.remind_after_major_change),
      inherited,
    };
  }

  private settingNumber(key: string, fallback: number): number {
    const row = this.database.get<{ value_json: string }>('SELECT value_json FROM settings WHERE key=?', [key]);
    if (!row) return fallback;
    try {
      const value = JSON.parse(row.value_json) as unknown;
      return typeof value === 'number' && Number.isInteger(value) && value >= 1 ? value : fallback;
    } catch {
      return fallback;
    }
  }

  private settingBoolean(key: string, fallback: boolean): boolean {
    const row = this.database.get<{ value_json: string }>('SELECT value_json FROM settings WHERE key=?', [key]);
    if (!row) return fallback;
    try {
      const value = JSON.parse(row.value_json) as unknown;
      return typeof value === 'boolean' ? value : fallback;
    } catch {
      return fallback;
    }
  }

  private ageDays(value: string): number {
    const timestamp = new Date(value).getTime();
    if (!Number.isFinite(timestamp)) return Number.MAX_SAFE_INTEGER;
    return Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
  }

  private alert(
    code: BusinessBackupAlert['code'], severity: BusinessBackupAlert['severity'], title: string, detail: string,
    clientAccountId?: string | null, projectId?: string | null, interventionId?: string | null,
    backupRecordId?: string | null, ageDays?: number | null,
  ): BusinessBackupAlert {
    return {
      id: [code, projectId ?? clientAccountId ?? 'none', interventionId ?? 'none', backupRecordId ?? 'none'].join(':'),
      code, severity, title, detail, clientAccountId, projectId, interventionId, backupRecordId, ageDays,
    };
  }

  private activity(action: string, entityId: string, summary: string): void {
    this.database.run(
      `INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at)
       VALUES ('backup_policy',?,?,?,?,?)`,
      [entityId, action, summary, null, new Date().toISOString()],
    );
  }
}
