import { randomUUID } from 'node:crypto';
import type { DatabaseAdapter, SqlValue } from '../database/DatabaseAdapter';
import {
  CLIENT_STATUSES,
  PROSPECT_SOURCES,
  PROSPECT_STAGES,
  PROSPECT_TEMPERATURES,
  type ActivityEvent,
  type ClientFilters,
  type ClientInput,
  type ClientStatus,
  type ClientSummary,
  type Contact,
  type ContactMethod,
  type ContactMethodInput,
  type ContactInput,
  type ConvertProspectResult,
  type Organization,
  type OrganizationInput,
  type ProspectFilters,
  type ProspectInput,
  type ProspectStage,
  type ProspectSummary,
  type SearchResult,
} from '../../shared/crm';

const nowIso = (): string => new Date().toISOString();
const clean = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const MANUAL_PROSPECT_STAGE_TRANSITIONS: Record<ProspectStage, readonly ProspectStage[]> = {
  new: ['qualifying', 'lost'],
  qualifying: ['new', 'need_identified', 'lost'],
  need_identified: ['qualifying', 'lost'],
  quote_to_prepare: ['lost'],
  quote_to_send: ['lost'],
  quote_sent: ['follow_up', 'negotiation', 'waiting', 'lost'],
  follow_up: ['quote_sent', 'negotiation', 'waiting', 'lost'],
  negotiation: ['follow_up', 'waiting', 'lost'],
  waiting: ['quote_sent', 'follow_up', 'negotiation', 'lost'],
  won: [],
  lost: ['new', 'qualifying'],
};

function assertEmail(value?: string | null): void {
  const email = clean(value);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Adresse email invalide.');
  }
}

function assertMoney(value: number | null | undefined, label: string): void {
  if (value != null && (!Number.isInteger(value) || value < 0)) {
    throw new Error(`${label} doit être un montant positif en centimes.`);
  }
}

function assertIdentity(organizationId?: string | null, contactId?: string | null): void {
  if (!clean(organizationId) && !clean(contactId)) {
    throw new Error('Une organisation ou un contact est requis.');
  }
}

function assertProspectInput(input: ProspectInput): void {
  assertIdentity(input.organizationId, input.contactId);
  if (input.stage && !PROSPECT_STAGES.includes(input.stage)) throw new Error('Étape prospect invalide.');
  if (input.temperature && !PROSPECT_TEMPERATURES.includes(input.temperature)) throw new Error('Température prospect invalide.');
  if (input.source && !PROSPECT_SOURCES.includes(input.source)) throw new Error('Source prospect invalide.');
  assertMoney(input.budgetMinCents, 'Le budget minimum');
  assertMoney(input.budgetMaxCents, 'Le budget maximum');
  assertMoney(input.estimatedValueCents, 'La valeur estimée');
  if (input.budgetMinCents != null && input.budgetMaxCents != null && input.budgetMinCents > input.budgetMaxCents) {
    throw new Error('Le budget minimum ne peut pas dépasser le budget maximum.');
  }
  if (input.probabilityPercent != null && (!Number.isInteger(input.probabilityPercent) || input.probabilityPercent < 0 || input.probabilityPercent > 100)) {
    throw new Error('La probabilité doit être comprise entre 0 et 100.');
  }
}

function assertClientInput(input: ClientInput): void {
  assertIdentity(input.organizationId, input.primaryContactId);
  if (input.status && !CLIENT_STATUSES.includes(input.status)) throw new Error('Statut client invalide.');
}

interface ProspectRow extends Record<string, unknown> {
  id: string;
  organization_id: string | null;
  contact_id: string | null;
  client_account_id: string | null;
  stage: ProspectStage;
  temperature: ProspectSummary['temperature'];
  source: ProspectSummary['source'];
  source_detail: string | null;
  primary_need: string | null;
  secondary_need: string | null;
  budget_min_cents: number | null;
  budget_max_cents: number | null;
  estimated_value_cents: number | null;
  probability_percent: number | null;
  next_action_at: string | null;
  next_action_text: string | null;
  target_date: string | null;
  lost_reason: string | null;
  notes: string | null;
  won_at: string | null;
  lost_at: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  decision_status: ProspectSummary['decisionStatus']; decision_maker_details: string | null;
  project_summary: string | null; project_context: string | null; budget_status: ProspectSummary['budgetStatus'];
  timeline_status: ProspectSummary['timelineStatus']; timeline_note: string | null; existing_status: ProspectSummary['existingStatus'];
  existing_url: string | null; existing_notes: string | null; missing_information: string | null;
  waiting_reason_code: string | null; waiting_reason_text: string | null; waiting_resume_at: string | null; lost_reason_code: string | null;
  organization_name: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  contact_email: string | null;
}

interface ClientRow extends Record<string, unknown> {
  id: string;
  organization_id: string | null;
  primary_contact_id: string | null;
  status: ClientStatus;
  became_client_at: string;
  next_action_at: string | null;
  next_action_text: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  relationship_status: ClientSummary['relationshipStatus'];
  relationship_note: string | null;
  organization_name: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  organization_email: string | null;
  organization_phone: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

export class CrmService {
  constructor(private readonly database: DatabaseAdapter) {}

  private transaction<T>(work: () => T): T {
    this.database.exec('BEGIN IMMEDIATE;');
    try {
      const result = work();
      this.database.exec('COMMIT;');
      return result;
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }
  }

  private activity(input: {
    entityType: string;
    entityId: string;
    action: string;
    summary: string;
    metadata?: Record<string, unknown>;
    prospectId?: string | null;
    clientId?: string | null;
    organizationId?: string | null;
    contactId?: string | null;
  }): void {
    this.database.run(
      `INSERT INTO activity_events (
        id, entity_type, entity_id, action, summary, metadata_json,
        prospect_id, client_account_id, organization_id, contact_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(), input.entityType, input.entityId, input.action, input.summary,
        input.metadata ? JSON.stringify(input.metadata) : null,
        input.prospectId ?? null, input.clientId ?? null, input.organizationId ?? null,
        input.contactId ?? null, nowIso(),
      ],
    );
  }

  createOrganization(input: OrganizationInput): Organization {
    const name = clean(input.name);
    if (!name) throw new Error('Le nom de l’organisation est requis.');
    assertEmail(input.email);
    const id = randomUUID();
    const now = nowIso();
    this.database.run(
      `INSERT INTO organizations (
        id, name, legal_name, siret, email, phone, website, address_line1, address_line2,
        postal_code, city, country, industry, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, name, clean(input.legalName), clean(input.siret), clean(input.email), clean(input.phone),
        clean(input.website), clean(input.addressLine1), clean(input.addressLine2), clean(input.postalCode),
        clean(input.city), clean(input.country), clean(input.industry), clean(input.notes), now, now,
      ],
    );
    this.activity({ entityType: 'organization', entityId: id, action: 'created', summary: `Organisation créée : ${name}`, organizationId: id });
    this.rebuildSearchIndex();
    return this.getOrganization(id);
  }

  updateOrganization(id: string, input: OrganizationInput): Organization {
    const name = clean(input.name);
    if (!name) throw new Error('Le nom de l’organisation est requis.');
    assertEmail(input.email);
    const result = this.database.run(
      `UPDATE organizations SET
        name=?, legal_name=?, siret=?, email=?, phone=?, website=?, address_line1=?, address_line2=?,
        postal_code=?, city=?, country=?, industry=?, notes=?, updated_at=?
       WHERE id=? AND archived_at IS NULL`,
      [
        name, clean(input.legalName), clean(input.siret), clean(input.email), clean(input.phone), clean(input.website),
        clean(input.addressLine1), clean(input.addressLine2), clean(input.postalCode), clean(input.city), clean(input.country),
        clean(input.industry), clean(input.notes), nowIso(), id,
      ],
    );
    if (Number(result.changes) !== 1) throw new Error('Organisation introuvable.');
    this.activity({ entityType: 'organization', entityId: id, action: 'updated', summary: `Organisation mise à jour : ${name}`, organizationId: id });
    this.rebuildSearchIndex();
    return this.getOrganization(id);
  }

  getOrganization(id: string): Organization {
    const row = this.database.get<Record<string, unknown>>('SELECT * FROM organizations WHERE id=?', [id]);
    if (!row) throw new Error('Organisation introuvable.');
    return {
      id: String(row.id), name: String(row.name), legalName: row.legal_name as string | null,
      siret: row.siret as string | null, email: row.email as string | null, phone: row.phone as string | null,
      website: row.website as string | null, addressLine1: row.address_line1 as string | null,
      addressLine2: row.address_line2 as string | null, postalCode: row.postal_code as string | null,
      city: row.city as string | null, country: row.country as string | null, industry: row.industry as string | null,
      notes: row.notes as string | null, createdAt: String(row.created_at), updatedAt: String(row.updated_at),
      archivedAt: row.archived_at as string | null,
    };
  }

  createContact(input: ContactInput): Contact {
    const firstName = clean(input.firstName);
    const lastName = clean(input.lastName);
    if (!firstName || !lastName) throw new Error('Le prénom et le nom sont requis.');
    assertEmail(input.email);
    const id = randomUUID();
    const now = nowIso();
    this.database.run(
      `INSERT INTO contacts (
        id, organization_id, first_name, last_name, job_title, email, phone, preferred_channel,
        notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, clean(input.organizationId), firstName, lastName, clean(input.jobTitle), clean(input.email),
        clean(input.phone), clean(input.preferredChannel), clean(input.notes), now, now,
      ],
    );
    this.activity({ entityType: 'contact', entityId: id, action: 'created', summary: `Contact créé : ${firstName} ${lastName}`, contactId: id, organizationId: clean(input.organizationId) });
    this.rebuildSearchIndex();
    return this.getContact(id);
  }

  updateContact(id: string, input: ContactInput): Contact {
    const firstName = clean(input.firstName);
    const lastName = clean(input.lastName);
    if (!firstName || !lastName) throw new Error('Le prénom et le nom sont requis.');
    assertEmail(input.email);
    const result = this.database.run(
      `UPDATE contacts SET organization_id=?, first_name=?, last_name=?, job_title=?, email=?, phone=?,
       preferred_channel=?, notes=?, updated_at=? WHERE id=? AND archived_at IS NULL`,
      [
        clean(input.organizationId), firstName, lastName, clean(input.jobTitle), clean(input.email), clean(input.phone),
        clean(input.preferredChannel), clean(input.notes), nowIso(), id,
      ],
    );
    if (Number(result.changes) !== 1) throw new Error('Contact introuvable.');
    this.activity({ entityType: 'contact', entityId: id, action: 'updated', summary: `Contact mis à jour : ${firstName} ${lastName}`, contactId: id, organizationId: clean(input.organizationId) });
    this.rebuildSearchIndex();
    return this.getContact(id);
  }

  getContact(id: string): Contact {
    const row = this.database.get<Record<string, unknown>>('SELECT * FROM contacts WHERE id=?', [id]);
    if (!row) throw new Error('Contact introuvable.');
    return {
      id: String(row.id), organizationId: row.organization_id as string | null,
      firstName: String(row.first_name), lastName: String(row.last_name), jobTitle: row.job_title as string | null,
      email: row.email as string | null, phone: row.phone as string | null,
      preferredChannel: row.preferred_channel as string | null, notes: row.notes as string | null,
      createdAt: String(row.created_at), updatedAt: String(row.updated_at), archivedAt: row.archived_at as string | null,
    };
  }

  listContactMethods(owner: 'organization' | 'contact', id: string, includeArchived = false): ContactMethod[] {
    const column = owner === 'organization' ? 'organization_id' : 'contact_id';
    return this.database.all<Record<string, unknown>>(
      `SELECT * FROM contact_methods WHERE ${column}=? ${includeArchived ? '' : 'AND archived_at IS NULL'} ORDER BY is_primary DESC,method_type,label,value`, [id],
    ).map((row) => ({ id:String(row.id), organizationId:row.organization_id as string|null, contactId:row.contact_id as string|null,
      type:row.method_type as ContactMethod['type'], value:String(row.value), label:row.label as string|null, isPrimary:Boolean(row.is_primary),
      notes:row.notes as string|null, createdAt:String(row.created_at), updatedAt:String(row.updated_at), archivedAt:row.archived_at as string|null }));
  }

  saveContactMethod(input: ContactMethodInput, id?: string): ContactMethod {
    const value=clean(input.value); if(!value) throw new Error('La coordonnée est requise.');
    if(!['email','phone'].includes(input.type)) throw new Error('Type de coordonnée invalide.');
    if(input.type==='email') assertEmail(value);
    if(Boolean(input.organizationId)===Boolean(input.contactId)) throw new Error('La coordonnée doit être rattachée à une seule identité.');
    const ownerColumn=input.organizationId?'organization_id':'contact_id'; const ownerId=input.organizationId??input.contactId??'';
    const now=nowIso(); const methodId=id ?? randomUUID();
    if(input.isPrimary) this.database.run(`UPDATE contact_methods SET is_primary=0,updated_at=? WHERE method_type=? AND ${ownerColumn}=?`,[now,input.type,ownerId]);
    if(id) {
      const result=this.database.run('UPDATE contact_methods SET method_type=?,value=?,label=?,is_primary=?,notes=?,archived_at=NULL,updated_at=? WHERE id=?',
        [input.type,value,clean(input.label),input.isPrimary?1:0,clean(input.notes),now,id]);
      if(Number(result.changes)!==1) throw new Error('Coordonnée introuvable.');
    } else this.database.run('INSERT INTO contact_methods (id,organization_id,contact_id,method_type,value,label,is_primary,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [methodId,clean(input.organizationId),clean(input.contactId),input.type,value,clean(input.label),input.isPrimary?1:0,clean(input.notes),now,now]);
    this.rebuildSearchIndex();
    return this.listContactMethods(input.organizationId?'organization':'contact',ownerId,true).find(method=>method.id===methodId)!;
  }

  archiveContactMethod(id: string, archived=true): void {
    const result=this.database.run('UPDATE contact_methods SET archived_at=?,updated_at=? WHERE id=?',[archived?nowIso():null,nowIso(),id]);
    if(Number(result.changes)!==1) throw new Error('Coordonnée introuvable.');
    this.rebuildSearchIndex();
  }

  createProspect(input: ProspectInput): ProspectSummary {
    assertProspectInput(input);
    const id = randomUUID();
    const now = nowIso();
    const stage = input.stage ?? 'new';
    this.database.run(
      `INSERT INTO prospects (
        id, organization_id, contact_id, stage, temperature, source, source_detail, primary_need,
        secondary_need, budget_min_cents, budget_max_cents, estimated_value_cents, probability_percent,
        next_action_at, next_action_text, target_date, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, clean(input.organizationId), clean(input.contactId), stage, input.temperature ?? 'neutral', input.source ?? null,
        clean(input.sourceDetail), clean(input.primaryNeed), clean(input.secondaryNeed), input.budgetMinCents ?? null,
        input.budgetMaxCents ?? null, input.estimatedValueCents ?? null, input.probabilityPercent ?? null,
        clean(input.nextActionAt), clean(input.nextActionText), clean(input.targetDate), clean(input.notes), now, now,
      ],
    );
    this.activity({ entityType: 'prospect', entityId: id, action: 'created', summary: 'Prospect créé', prospectId: id, organizationId: clean(input.organizationId), contactId: clean(input.contactId) });
    this.indexProspect(id);
    return this.getProspect(id);
  }

  updateProspect(id: string, input: ProspectInput): ProspectSummary {
    assertProspectInput(input);
    const current = this.getProspect(id);
    if (input.stage && input.stage !== current.stage) {
      throw new Error('Utilise le changement d’étape du parcours commercial pour déplacer un prospect.');
    }
    const stage = current.stage ?? 'new';
    const result = this.database.run(
      `UPDATE prospects SET organization_id=?, contact_id=?, stage=?, temperature=?, source=?, source_detail=?,
       primary_need=?, secondary_need=?, budget_min_cents=?, budget_max_cents=?, estimated_value_cents=?,
       probability_percent=?, next_action_at=?, next_action_text=?, target_date=?, notes=?, updated_at=?
       WHERE id=? AND archived_at IS NULL`,
      [
        clean(input.organizationId), clean(input.contactId), stage, input.temperature ?? current.temperature ?? 'neutral',
        input.source ?? null, clean(input.sourceDetail), clean(input.primaryNeed), clean(input.secondaryNeed),
        input.budgetMinCents ?? null, input.budgetMaxCents ?? null, input.estimatedValueCents ?? null,
        input.probabilityPercent ?? null, clean(input.nextActionAt), clean(input.nextActionText), clean(input.targetDate),
        clean(input.notes), nowIso(), id,
      ],
    );
    if (Number(result.changes) !== 1) throw new Error('Prospect introuvable.');
    this.activity({ entityType: 'prospect', entityId: id, action: 'updated', summary: 'Prospect mis à jour', prospectId: id, organizationId: clean(input.organizationId), contactId: clean(input.contactId) });
    this.indexProspect(id);
    return this.getProspect(id);
  }

  updateProspectQualification(id: string, input: Partial<ProspectInput>): ProspectSummary {
    const current=this.getProspect(id);
    this.database.run(`UPDATE prospects SET decision_status=?,decision_maker_details=?,project_summary=?,project_context=?,budget_status=?,
      timeline_status=?,timeline_note=?,existing_status=?,existing_url=?,existing_notes=?,missing_information=?,waiting_reason_code=?,
      waiting_reason_text=?,waiting_resume_at=?,lost_reason_code=?,updated_at=? WHERE id=? AND archived_at IS NULL`,[
      input.decisionStatus??current.decisionStatus??null,clean(input.decisionMakerDetails??current.decisionMakerDetails),
      clean(input.projectSummary??current.projectSummary),clean(input.projectContext??current.projectContext),input.budgetStatus??current.budgetStatus??null,
      input.timelineStatus??current.timelineStatus??null,clean(input.timelineNote??current.timelineNote),input.existingStatus??current.existingStatus??null,
      clean(input.existingUrl??current.existingUrl),clean(input.existingNotes??current.existingNotes),clean(input.missingInformation??current.missingInformation),
      clean(input.waitingReasonCode??current.waitingReasonCode),clean(input.waitingReasonText??current.waitingReasonText),
      clean(input.waitingResumeAt??current.waitingResumeAt),clean(input.lostReasonCode??current.lostReasonCode),nowIso(),id]);
    this.activity({entityType:'prospect',entityId:id,action:'qualification_updated',summary:'Qualification commerciale mise à jour',prospectId:id});
    this.indexProspect(id); return this.getProspect(id);
  }

  changeProspectStage(id: string, stage: ProspectStage, lostReason?: string | null): ProspectSummary {
    if (!PROSPECT_STAGES.includes(stage)) throw new Error('Étape prospect invalide.');
    const current = this.getProspect(id);
    if (stage === current.stage) return current;
    if (!MANUAL_PROSPECT_STAGE_TRANSITIONS[current.stage ?? 'new'].includes(stage)) {
      throw new Error(`Transition non autorisée : ${current.stage ?? 'new'} → ${stage}. Utilise l’action métier correspondante.`);
    }
    if (stage === 'lost' && !clean(lostReason)) throw new Error('Une raison est requise pour classer le prospect comme perdu.');
    if (!['new', 'qualifying', 'lost'].includes(stage)) {
      const count = this.database.get<{ count: number }>('SELECT COUNT(*) AS count FROM crm_needs WHERE prospect_id=?', [id])?.count ?? 0;
      if (Number(count) === 0) throw new Error('Ajoute au moins un besoin avant de poursuivre la qualification.');
    }
    if (current.stage === 'qualifying' && stage === 'need_identified') this.assertQualificationReady(id, current);
    const now = nowIso();
    this.database.run(
      `UPDATE prospects SET stage=?, lost_reason=?, lost_at=?, won_at=?, updated_at=? WHERE id=? AND archived_at IS NULL`,
      [
        stage, stage === 'lost' ? clean(lostReason) : null, stage === 'lost' ? now : null,
        stage === 'won' ? (current.wonAt ?? now) : null, now, id,
      ],
    );
    this.activity({
      entityType: 'prospect', entityId: id, action: 'stage_changed', summary: `Prospect déplacé vers ${stage}`,
      metadata: { from: current.stage, to: stage }, prospectId: id,
      organizationId: current.organizationId, contactId: current.contactId,
    });
    this.indexProspect(id);
    return this.getProspect(id);
  }

  private assertQualificationReady(id: string, prospect: ProspectSummary): void {
    const missing: string[] = [];
    const needCount = Number(this.database.get<{ count: number }>('SELECT COUNT(*) AS count FROM crm_needs WHERE prospect_id=?', [id])?.count ?? 0);
    if (needCount === 0) missing.push('un besoin / une prestation');
    if (!clean(prospect.projectSummary)) missing.push('le résumé du projet');
    if (!prospect.decisionStatus) missing.push('le décideur');
    if (prospect.decisionStatus === 'no' && !clean(prospect.decisionMakerDetails)) missing.push('qui prend la décision');
    const budgetReady = prospect.budgetStatus === 'not_disclosed'
      || (prospect.budgetStatus === 'known' && prospect.budgetMinCents != null)
      || (prospect.budgetStatus === 'range' && prospect.budgetMinCents != null && prospect.budgetMaxCents != null);
    if (!budgetReady) missing.push('le budget');
    const timelineReady = prospect.timelineStatus === 'not_disclosed'
      || (prospect.timelineStatus === 'date' && Boolean(clean(prospect.targetDate)))
      || (prospect.timelineStatus === 'note' && Boolean(clean(prospect.timelineNote)));
    if (!timelineReady) missing.push('le calendrier');
    if (missing.length) throw new Error(`Qualification incomplète : renseigne ${missing.join(', ')}.`);
  }

  setProspectNextAction(id: string, at: string | null, text: string | null): ProspectSummary {
    this.getProspect(id);
    this.database.run(
      'UPDATE prospects SET next_action_at=?, next_action_text=?, updated_at=? WHERE id=?',
      [clean(at), clean(text), nowIso(), id],
    );
    this.activity({
      entityType: 'prospect', entityId: id, action: 'next_action_changed',
      summary: clean(text) ? `Prochaine action : ${clean(text)}` : 'Prochaine action retirée', prospectId: id,
    });
    this.indexProspect(id);
    return this.getProspect(id);
  }

  listProspects(filters: ProspectFilters = {}): ProspectSummary[] {
    const where: string[] = [];
    const params: SqlValue[] = [];
    if (!filters.includeArchived) where.push('p.archived_at IS NULL');
    if (filters.stage) {
      where.push('p.stage=?');
      params.push(filters.stage);
    }
    if (clean(filters.search)) {
      const query = `%${clean(filters.search)}%`;
      where.push('(o.name LIKE ? COLLATE NOCASE OR c.first_name LIKE ? COLLATE NOCASE OR c.last_name LIKE ? COLLATE NOCASE OR p.primary_need LIKE ? COLLATE NOCASE)');
      params.push(query, query, query, query);
    }
    return this.database.all<ProspectRow>(
      `${this.prospectSelect()} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY p.updated_at DESC`,
      params,
    ).map((row) => this.mapProspect(row));
  }

  private getProspect(id: string): ProspectSummary {
    const row = this.database.get<ProspectRow>(`${this.prospectSelect()} WHERE p.id=?`, [id]);
    if (!row) throw new Error('Prospect introuvable.');
    return this.mapProspect(row);
  }

  private prospectSelect(): string {
    return `SELECT p.*, o.name AS organization_name, c.first_name AS contact_first_name,
      c.last_name AS contact_last_name, c.email AS contact_email,
      COALESCE((SELECT group_concat(COALESCE(ci.name,n.other_text), ' · ') FROM crm_needs n LEFT JOIN catalog_items ci ON ci.id=n.catalog_item_id WHERE n.prospect_id=p.id),p.primary_need) AS live_need
      FROM prospects p
      LEFT JOIN organizations o ON o.id=p.organization_id
      LEFT JOIN contacts c ON c.id=p.contact_id`;
  }

  private mapProspect(row: ProspectRow): ProspectSummary {
    const contactName = [row.contact_first_name, row.contact_last_name].filter(Boolean).join(' ');
    const displayName = (row.organization_name ?? contactName) || 'Prospect sans nom';
    return {
      id: row.id, organizationId: row.organization_id, contactId: row.contact_id,
      clientAccountId: row.client_account_id, stage: row.stage, temperature: row.temperature,
      source: row.source, sourceDetail: row.source_detail, primaryNeed: row.live_need as string | null,
      secondaryNeed: row.secondary_need, budgetMinCents: row.budget_min_cents,
      budgetMaxCents: row.budget_max_cents, estimatedValueCents: row.estimated_value_cents,
      probabilityPercent: row.probability_percent, nextActionAt: row.next_action_at,
      nextActionText: row.next_action_text, targetDate: row.target_date, lostReason: row.lost_reason,
      notes: row.notes, wonAt: row.won_at, lostAt: row.lost_at, createdAt: row.created_at,
      decisionStatus: row.decision_status, decisionMakerDetails: row.decision_maker_details,
      projectSummary: row.project_summary, projectContext: row.project_context, budgetStatus: row.budget_status,
      timelineStatus: row.timeline_status, timelineNote: row.timeline_note, existingStatus: row.existing_status,
      existingUrl: row.existing_url, existingNotes: row.existing_notes, missingInformation: row.missing_information,
      waitingReasonCode: row.waiting_reason_code, waitingReasonText: row.waiting_reason_text,
      waitingResumeAt: row.waiting_resume_at, lostReasonCode: row.lost_reason_code,
      updatedAt: row.updated_at, archivedAt: row.archived_at, displayName,
      secondaryLabel: row.organization_name && contactName ? contactName : row.contact_email,
    };
  }

  createClient(input: ClientInput): ClientSummary {
    assertClientInput(input);
    const id = randomUUID();
    const now = nowIso();
    this.database.run(
      `INSERT INTO client_accounts (
        id, organization_id, primary_contact_id, status, became_client_at, next_action_at,
        next_action_text, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, clean(input.organizationId), clean(input.primaryContactId), input.status ?? 'active', now,
        clean(input.nextActionAt), clean(input.nextActionText), clean(input.notes), now, now,
      ],
    );
    if (clean(input.primaryContactId)) this.ensurePrimaryContactRole(id, clean(input.primaryContactId) as string);
    this.activity({ entityType: 'client', entityId: id, action: 'created', summary: 'Client créé', clientId: id, organizationId: clean(input.organizationId), contactId: clean(input.primaryContactId) });
    this.indexClient(id);
    return this.getClient(id);
  }

  updateClient(id: string, input: ClientInput): ClientSummary {
    assertClientInput(input);
    const current = this.getClient(id);
    const status = input.status ?? current.status ?? 'active';
    const result = this.database.run(
      `UPDATE client_accounts SET organization_id=?, primary_contact_id=?, status=?, next_action_at=?,
       next_action_text=?, notes=?, relationship_status=?, relationship_note=?, updated_at=? WHERE id=?`,
      [
        clean(input.organizationId), clean(input.primaryContactId), status, clean(input.nextActionAt),
        clean(input.nextActionText), clean(input.notes), input.relationshipStatus ?? current.relationshipStatus ?? 'neutral',
        clean(input.relationshipNote), nowIso(), id,
      ],
    );
    if (Number(result.changes) !== 1) throw new Error('Client introuvable.');
    if (clean(input.primaryContactId)) this.ensurePrimaryContactRole(id, clean(input.primaryContactId) as string);
    this.activity({ entityType: 'client', entityId: id, action: 'updated', summary: 'Client mis à jour', clientId: id, organizationId: clean(input.organizationId), contactId: clean(input.primaryContactId) });
    this.indexClient(id);
    return this.getClient(id);
  }

  archiveClient(id: string): ClientSummary {
    const client = this.getClient(id);
    const now = nowIso();
    this.database.run(`UPDATE client_accounts SET status='archived', archived_at=?, updated_at=? WHERE id=?`, [now, now, id]);
    this.activity({ entityType: 'client', entityId: id, action: 'archived', summary: `Client archivé : ${client.displayName}`, clientId: id, organizationId: client.organizationId, contactId: client.primaryContactId });
    this.indexClient(id);
    return this.getClient(id);
  }

  reactivateClient(id: string, status: Exclude<ClientStatus, 'archived'>): ClientSummary {
    if (!['active', 'inactive'].includes(status)) throw new Error('Statut de réactivation invalide.');
    const client = this.getClient(id);
    this.database.run('UPDATE client_accounts SET status=?, archived_at=NULL, updated_at=? WHERE id=?', [status, nowIso(), id]);
    this.activity({ entityType: 'client', entityId: id, action: 'reactivated', summary: `Client réactivé : ${client.displayName}`, clientId: id, organizationId: client.organizationId, contactId: client.primaryContactId });
    this.indexClient(id);
    return this.getClient(id);
  }

  convertProspectToClient(prospectId: string): ConvertProspectResult {
    return this.transaction(() => {
      const prospect = this.getProspect(prospectId);
      if (prospect.clientAccountId) {
        return { prospectId, clientId: prospect.clientAccountId, createdClient: false };
      }

      let existing: { id: string } | undefined;
      if (prospect.organizationId) {
        existing = this.database.get<{ id: string }>(
          'SELECT id FROM client_accounts WHERE organization_id=? ORDER BY created_at LIMIT 1',
          [prospect.organizationId],
        );
      }
      if (!existing && prospect.contactId) {
        existing = this.database.get<{ id: string }>(
          'SELECT id FROM client_accounts WHERE primary_contact_id=? ORDER BY created_at LIMIT 1',
          [prospect.contactId],
        );
      }

      let clientId = existing?.id;
      let createdClient = false;
      if (!clientId) {
        clientId = randomUUID();
        const now = nowIso();
        this.database.run(
          `INSERT INTO client_accounts (
            id, organization_id, primary_contact_id, status, became_client_at, created_at, updated_at
          ) VALUES (?, ?, ?, 'active', ?, ?, ?)`,
          [clientId, prospect.organizationId ?? null, prospect.contactId ?? null, now, now, now],
        );
        if (prospect.contactId) this.ensurePrimaryContactRole(clientId, prospect.contactId);
        createdClient = true;
        this.activity({
          entityType: 'client', entityId: clientId, action: 'created_from_prospect',
          summary: `Client créé depuis le prospect ${prospect.displayName}`, clientId, prospectId,
          organizationId: prospect.organizationId, contactId: prospect.contactId,
        });
      }

      const now = nowIso();
      this.database.run(
        `UPDATE prospects SET stage='won', client_account_id=?, won_at=COALESCE(won_at, ?), updated_at=? WHERE id=?`,
        [clientId, now, now, prospectId],
      );
      this.activity({
        entityType: 'prospect', entityId: prospectId, action: 'converted_to_client',
        summary: `Prospect transformé en client : ${prospect.displayName}`, prospectId, clientId,
        organizationId: prospect.organizationId, contactId: prospect.contactId,
      });
      this.indexProspect(prospectId);
      this.indexClient(clientId);
      return { prospectId, clientId, createdClient };
    });
  }

  listClients(filters: ClientFilters = {}): ClientSummary[] {
    const where: string[] = [];
    const params: SqlValue[] = [];
    if (!filters.includeArchived) where.push(`ca.status <> 'archived'`);
    if (filters.status) {
      where.push('ca.status=?');
      params.push(filters.status);
    }
    if (clean(filters.search)) {
      const query = `%${clean(filters.search)}%`;
      where.push(`(o.name LIKE ? COLLATE NOCASE OR c.first_name LIKE ? COLLATE NOCASE OR c.last_name LIKE ? COLLATE NOCASE
        OR o.email LIKE ? COLLATE NOCASE OR c.email LIKE ? COLLATE NOCASE
        OR EXISTS (
          SELECT 1 FROM contact_methods cm
          WHERE cm.archived_at IS NULL
            AND (cm.organization_id=ca.organization_id OR cm.contact_id=ca.primary_contact_id)
            AND cm.value LIKE ? COLLATE NOCASE
        ))`);
      params.push(query, query, query, query, query, query);
    }
    return this.database.all<ClientRow>(
      `${this.clientSelect()} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY ca.updated_at DESC`,
      params,
    ).map((row) => this.mapClient(row));
  }

  private getClient(id: string): ClientSummary {
    const row = this.database.get<ClientRow>(`${this.clientSelect()} WHERE ca.id=?`, [id]);
    if (!row) throw new Error('Client introuvable.');
    return this.mapClient(row);
  }

  private clientSelect(): string {
    return `SELECT ca.*, o.name AS organization_name,
      COALESCE(
        (SELECT cm.value FROM contact_methods cm WHERE cm.organization_id=ca.organization_id AND cm.method_type='email' AND cm.archived_at IS NULL ORDER BY cm.is_primary DESC, cm.created_at LIMIT 1),
        o.email
      ) AS organization_email,
      COALESCE(
        (SELECT cm.value FROM contact_methods cm WHERE cm.organization_id=ca.organization_id AND cm.method_type='phone' AND cm.archived_at IS NULL ORDER BY cm.is_primary DESC, cm.created_at LIMIT 1),
        o.phone
      ) AS organization_phone,
      c.first_name AS contact_first_name, c.last_name AS contact_last_name,
      COALESCE(
        (SELECT cm.value FROM contact_methods cm WHERE cm.contact_id=ca.primary_contact_id AND cm.method_type='email' AND cm.archived_at IS NULL ORDER BY cm.is_primary DESC, cm.created_at LIMIT 1),
        c.email
      ) AS contact_email,
      COALESCE(
        (SELECT cm.value FROM contact_methods cm WHERE cm.contact_id=ca.primary_contact_id AND cm.method_type='phone' AND cm.archived_at IS NULL ORDER BY cm.is_primary DESC, cm.created_at LIMIT 1),
        c.phone
      ) AS contact_phone
      FROM client_accounts ca
      LEFT JOIN organizations o ON o.id=ca.organization_id
      LEFT JOIN contacts c ON c.id=ca.primary_contact_id`;
  }

  private mapClient(row: ClientRow): ClientSummary {
    const contactName = [row.contact_first_name, row.contact_last_name].filter(Boolean).join(' ');
    const displayName = (row.organization_name ?? contactName) || 'Client sans nom';
    return {
      id: row.id, organizationId: row.organization_id, primaryContactId: row.primary_contact_id,
      status: row.status, becameClientAt: row.became_client_at, nextActionAt: row.next_action_at,
      nextActionText: row.next_action_text, notes: row.notes, createdAt: row.created_at,
      updatedAt: row.updated_at, archivedAt: row.archived_at, displayName,
      contactName: contactName || null, email: row.organization_email ?? row.contact_email,
      phone: row.organization_phone ?? row.contact_phone,
      relationshipStatus: row.relationship_status, relationshipNote: row.relationship_note,
    };
  }

  private ensurePrimaryContactRole(clientId: string, contactId: string): void {
    const existing = this.database.get<{ id: string }>(
      'SELECT id FROM client_contact_roles WHERE client_account_id=? AND is_primary=1',
      [clientId],
    );
    if (existing) {
      this.database.run(`UPDATE client_contact_roles SET contact_id=?, role='primary' WHERE id=?`, [contactId, existing.id]);
      return;
    }
    this.database.run(
      `INSERT INTO client_contact_roles (id, client_account_id, contact_id, role, is_primary, created_at)
       VALUES (?, ?, ?, 'primary', 1, ?)`,
      [randomUUID(), clientId, contactId, nowIso()],
    );
  }

  listActivity(entityType: string, entityId: string): ActivityEvent[] {
    return this.database.all<Record<string, unknown>>(
      `SELECT id, entity_type, entity_id, action, summary, metadata_json, created_at
       FROM activity_events WHERE entity_type=? AND entity_id=? ORDER BY created_at DESC`,
      [entityType, entityId],
    ).map((row) => ({
      id: String(row.id), entityType: String(row.entity_type), entityId: String(row.entity_id),
      action: String(row.action), summary: String(row.summary),
      metadata: row.metadata_json ? JSON.parse(String(row.metadata_json)) as Record<string, unknown> : null,
      createdAt: String(row.created_at),
    }));
  }

  globalSearch(query: string): SearchResult[] {
    const normalized = clean(query)?.toLocaleLowerCase('fr-FR');
    if (!normalized || normalized.length < 2) return [];
    const like = `%${normalized}%`;
    return this.database.all<Record<string, unknown>>(
      `SELECT entity_type, entity_id, title, subtitle, status
       FROM search_documents
       WHERE lower(search_text) LIKE ?
       ORDER BY CASE entity_type WHEN 'client' THEN 1 WHEN 'prospect' THEN 2 WHEN 'organization' THEN 3 ELSE 4 END,
         title COLLATE NOCASE
       LIMIT 30`,
      [like],
    ).map((row) => ({
      entityType: row.entity_type as SearchResult['entityType'], entityId: String(row.entity_id),
      title: String(row.title), subtitle: row.subtitle as string | null, status: row.status as string | null,
    }));
  }

  rebuildSearchIndex(): { indexed: number } {
    this.database.run('DELETE FROM search_documents');
    const organizations = this.database.all<Record<string, unknown>>('SELECT id FROM organizations WHERE archived_at IS NULL');
    organizations.forEach((row) => this.indexOrganization(String(row.id)));
    const contacts = this.database.all<Record<string, unknown>>('SELECT id FROM contacts WHERE archived_at IS NULL');
    contacts.forEach((row) => this.indexContact(String(row.id)));
    const prospects = this.database.all<{ id: string }>('SELECT id FROM prospects WHERE archived_at IS NULL');
    prospects.forEach((row) => this.indexProspect(row.id));
    const clients = this.database.all<{ id: string }>('SELECT id FROM client_accounts');
    clients.forEach((row) => this.indexClient(row.id));
    return { indexed: organizations.length + contacts.length + prospects.length + clients.length };
  }

  private upsertSearchDocument(
    entityType: SearchResult['entityType'], entityId: string, title: string, subtitle: string | null,
    status: string | null, parts: Array<string | null | undefined>,
  ): void {
    const searchText = parts.filter(Boolean).join(' ').toLocaleLowerCase('fr-FR');
    this.database.run(
      `INSERT INTO search_documents (id, entity_type, entity_id, title, subtitle, status, search_text, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(entity_type, entity_id) DO UPDATE SET title=excluded.title, subtitle=excluded.subtitle,
       status=excluded.status, search_text=excluded.search_text, updated_at=excluded.updated_at`,
      [`${entityType}:${entityId}`, entityType, entityId, title, subtitle, status, searchText, nowIso()],
    );
  }

  private indexOrganization(id: string): void {
    const row = this.database.get<Record<string, unknown>>('SELECT * FROM organizations WHERE id=? AND archived_at IS NULL', [id]);
    if (!row) {
      this.database.run(`DELETE FROM search_documents WHERE entity_type='organization' AND entity_id=?`, [id]);
      return;
    }
    this.upsertSearchDocument('organization', id, String(row.name), row.city as string | null, null, [
      String(row.name), row.legal_name as string | null, row.siret as string | null, row.email as string | null,
      row.phone as string | null, row.city as string | null, row.industry as string | null,
      ...this.listContactMethods('organization',id).map((method)=>method.value),
    ]);
  }

  private indexContact(id: string): void {
    const row = this.database.get<Record<string, unknown>>(
      `SELECT c.*, o.name AS organization_name FROM contacts c LEFT JOIN organizations o ON o.id=c.organization_id
       WHERE c.id=? AND c.archived_at IS NULL`,
      [id],
    );
    if (!row) {
      this.database.run(`DELETE FROM search_documents WHERE entity_type='contact' AND entity_id=?`, [id]);
      return;
    }
    const title = `${row.first_name} ${row.last_name}`;
    this.upsertSearchDocument('contact', id, title, row.organization_name as string | null, null, [
      title, row.email as string | null, row.phone as string | null,
      row.job_title as string | null, row.organization_name as string | null,
      ...this.listContactMethods('contact',id).map((method)=>method.value),
    ]);
  }

  private indexProspect(id: string): void {
    const prospect = this.getProspect(id);
    this.upsertSearchDocument(
      'prospect', id, prospect.displayName, prospect.primaryNeed ?? prospect.secondaryLabel ?? null,
      prospect.stage ?? null, [prospect.displayName, prospect.secondaryLabel, prospect.primaryNeed, prospect.secondaryNeed, prospect.notes],
    );
  }

  private indexClient(id: string): void {
    const client = this.getClient(id);
    const methods = [
      ...(client.organizationId ? this.listContactMethods('organization', client.organizationId) : []),
      ...(client.primaryContactId ? this.listContactMethods('contact', client.primaryContactId) : []),
    ].map((method) => method.value);
    this.upsertSearchDocument(
      'client', id, client.displayName, client.contactName ?? client.email ?? null,
      client.status ?? null, [client.displayName, client.contactName, client.email, client.phone, client.notes, ...methods],
    );
  }
}
