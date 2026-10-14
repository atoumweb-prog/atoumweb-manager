import { CatalogService } from './CatalogService';
import { CommercialRulesService } from './CommercialRulesService';
import { ContractTypeService } from './ContractTypeService';
import { ContractSectionReviewService } from './ContractSectionReviewService';
import {decideCanonicalContractMode} from '../../shared/canonicalContractMode';
import {assembleReviewedDraftContract,renderApprovedDraftContract} from '../../shared/reviewedDraftContract';
import { formatContractPresentation, type ContractPresentation } from '../../shared/contractPresentation';
import type { ContractAdministration, QuoteContractParameters } from '../../shared/quoteContractPreparation';
import type { ContractTypeReference } from '../../shared/contractTypes';
import type { CommercialVersionRules } from '../../shared/commercialRules';
import { QuoteContractPreparationService } from './QuoteContractPreparationService';
import type { ClientDocumentService } from '../crm/ClientDocumentService';
import { randomUUID } from 'node:crypto';
import { compareWordDraftText, type WordDraftManifest } from './wordDraftReview';
import type { DatabaseAdapter, SqlValue } from '../database/DatabaseAdapter';
import {
  CONTRACT_CLAUSE_AUDIENCES,
  CONTRACT_CLAUSE_SCOPES,
  CONTRACT_CLAUSE_STATUSES,
  type ContractClauseAudience,
  type ContractClauseReviewMetadata,
  type ContractClauseScope,
  type ContractClauseStatus,
  type ContractClauseTemplate,
  type ContractClauseTemplateInput,
  type ContractClauseVersion,
  type ContractClauseVersionInput,
  type ContractClauseVersionStatus,
  type QuoteContractAudience,
  type QuoteContractBuild,
  type QuoteContractClause,
  type QuoteContractClauseInput,
  type QuoteContractClauseSource,
  type QuoteContractClauseUpdate,
} from '../../shared/contractTerms';

const nowIso = (): string => new Date().toISOString();
const clean = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

interface TemplateRow extends Record<string, unknown> {
  id: string;
  code: string;
  title: string;
  scope: ContractClauseScope;
  audience: ContractClauseAudience;
  status: ContractClauseStatus;
  sort_order: number;
  current_version_id: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

interface VersionRow extends Record<string, unknown> {
  id: string;
  clause_id: string;
  version_number: number;
  body: string;
  status: ContractClauseVersionStatus;
  published_at: string | null;
  review_metadata_json: string | null;
  created_at: string;
}

interface QuoteClauseRow extends Record<string, unknown> {
  id: string;
  quote_id: string;
  source_key: string;
  source_kind: QuoteContractClauseSource;
  source_clause_id: string | null;
  source_clause_version_id: string | null;
  source_catalog_item_ids_json: string;
  title: string;
  body: string;
  sort_order: number;
  enabled: number;
  is_customized: number;
  is_orphaned: number;
  created_at: string;
  updated_at: string;
}

interface QuoteStateRow extends Record<string, unknown> {
  id: string;
  quote_number: string;
  status: string;
  finalized_at: string | null;
  special_terms: string | null;
  contract_text_snapshot: string | null;
  contract_snapshot_json: string | null;
  contract_compiled_at: string | null;
  contract_audience: QuoteContractAudience | null;
}

interface QuoteLineSourceRow extends Record<string, unknown> {
  id: string;
  catalog_item_id: string | null;
  catalog_version_id: string | null;
  label: string;
  snapshot_json: string | null;
}

interface PublishedTemplateRow extends Record<string, unknown> {
  id: string;
  title: string;
  scope: ContractClauseScope;
  sort_order: number;
  version_id: string;
  body: string;
}

interface LinkedTemplateRow extends PublishedTemplateRow {
  catalog_item_id: string;
  link_sort_order: number;
}

interface DesiredClause {
  sourceKey: string;
  sourceKind: QuoteContractClauseSource;
  sourceClauseId: string | null;
  sourceClauseVersionId: string | null;
  sourceCatalogItemIds: string[];
  title: string;
  body: string;
  sortOrder: number;
}

export class ContractTermsService {
  constructor(private readonly database: DatabaseAdapter, private readonly documents?: ClientDocumentService) {}

  listTemplates(includeArchived = false): ContractClauseTemplate[] {
    const rows = this.database.all<TemplateRow>(
      `SELECT * FROM contract_clause_templates
       ${includeArchived ? '' : "WHERE status <> 'archived'"}
       ORDER BY CASE scope WHEN 'base' THEN 0 ELSE 1 END, sort_order, title COLLATE NOCASE`,
    );
    return rows.map((row) => this.getTemplate(row.id));
  }

  getTemplate(id: string): ContractClauseTemplate {
    const row = this.database.get<TemplateRow>('SELECT * FROM contract_clause_templates WHERE id=?', [id]);
    if (!row) throw new Error('Clause contractuelle introuvable.');
    const versions = this.database
      .all<VersionRow>('SELECT * FROM contract_clause_versions WHERE clause_id=? ORDER BY version_number DESC', [id])
      .map((version) => this.mapVersion(version));
    const catalogItemIds = this.database
      .all<{ catalog_item_id: string }>('SELECT catalog_item_id FROM catalog_contract_clause_links WHERE clause_id=? ORDER BY sort_order, catalog_item_id', [id])
      .map((link) => link.catalog_item_id);
    return {
      id: row.id,
      code: row.code,
      title: row.title,
      scope: row.scope,
      audience: row.audience,
      status: row.status,
      sortOrder: Number(row.sort_order),
      currentVersionId: row.current_version_id,
      currentVersion: row.current_version_id ? versions.find((version) => version.id === row.current_version_id) ?? null : null,
      versions,
      catalogItemIds,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      archivedAt: row.archived_at,
    };
  }

  createTemplate(input: ContractClauseTemplateInput, firstVersion: ContractClauseVersionInput): ContractClauseTemplate {
    const code = clean(input.code)?.toUpperCase();
    const title = clean(input.title);
    if (!code) throw new Error('Le code de la clause est requis.');
    if (!/^[A-Z0-9][A-Z0-9._-]*$/.test(code)) throw new Error('Le code de la clause ne peut contenir que lettres, chiffres, points, tirets et underscores.');
    if (!title) throw new Error('Le titre de la clause est requis.');
    if (!CONTRACT_CLAUSE_SCOPES.includes(input.scope)) throw new Error('Type de clause invalide.');
    const audience = input.audience ?? 'all';
    if (!CONTRACT_CLAUSE_AUDIENCES.includes(audience)) throw new Error('Public contractuel invalide.');
    if (this.database.get<{ id: string }>('SELECT id FROM contract_clause_templates WHERE code=? COLLATE NOCASE', [code])) {
      throw new Error('Ce code de clause existe déjà.');
    }

    const id = randomUUID();
    const versionId = randomUUID();
    const now = nowIso();
    this.database.exec('SAVEPOINT contract_library_operation;');
    try {
      this.database.run(
        `INSERT INTO contract_clause_templates
         (id,code,title,scope,audience,status,sort_order,current_version_id,created_at,updated_at,archived_at)
         VALUES (?,?,?,?,?,'active',?,NULL,?,?,NULL)`,
        [id, code, title, input.scope, audience, Math.trunc(input.sortOrder ?? 0), now, now],
      );
      this.database.run(
        `INSERT INTO contract_clause_versions
         (id,clause_id,version_number,body,status,published_at,created_at,review_metadata_json)
         VALUES (?,?,1,?,'draft',NULL,?,?)`,
        [versionId, id, firstVersion.body ?? '', now, firstVersion.review ? JSON.stringify(firstVersion.review) : null],
      );
      this.writeActivity('contract_clause', id, 'contract_clause_created', `Clause ${code} créée`);
      this.database.exec('RELEASE SAVEPOINT contract_library_operation;');
    } catch (error) {
      this.database.exec('ROLLBACK TO SAVEPOINT contract_library_operation; RELEASE SAVEPOINT contract_library_operation;');
      throw error;
    }
    return this.getTemplate(id);
  }

  createVersion(clauseId: string, input: ContractClauseVersionInput): ContractClauseVersion {
    const template = this.getTemplate(clauseId);
    if (template.status === 'archived') throw new Error('Réactive la clause avant de créer une nouvelle version.');
    const next = this.database.get<{ next_version: number }>(
      'SELECT COALESCE(MAX(version_number),0)+1 AS next_version FROM contract_clause_versions WHERE clause_id=?',
      [clauseId],
    );
    const id = randomUUID();
    const now = nowIso();
    this.database.run(
      `INSERT INTO contract_clause_versions
       (id,clause_id,version_number,body,status,published_at,created_at,review_metadata_json)
       VALUES (?,?,?,?, 'draft', NULL, ?, ?)`,
      [id, clauseId, Number(next?.next_version ?? 1), input.body ?? '', now, input.review ? JSON.stringify(input.review) : null],
    );
    this.database.run('UPDATE contract_clause_templates SET updated_at=? WHERE id=?', [now, clauseId]);
    this.writeActivity('contract_clause', clauseId, 'contract_clause_version_created', `Nouvelle version de ${template.code}`);
    const row = this.database.get<VersionRow>('SELECT * FROM contract_clause_versions WHERE id=?', [id]);
    if (!row) throw new Error('Version contractuelle introuvable après création.');
    return this.mapVersion(row);
  }

  /**
   * Human-approved DOCX text is saved as a new draft, never as an edit of the
   * source version. Re-check ownership and version inside the main process.
   */
  createReviewedWordDraft(manifest: WordDraftManifest, body: string): ContractClauseVersion {
    if(!manifest || typeof body !== 'string')throw Error('Révision Word invalide.');
    const template=this.getTemplate(manifest.clauseId);
    if(template.status==='archived')throw Error('Clause archivée : révision Word refusée.');
    const source=template.versions.find(version=>version.id===manifest.versionId);
    if(!source)throw Error('Version Word source introuvable.');
    // First-created draft after an export invalidates that export, preventing
    // double acceptance and "last import wins" on concurrent revisions.
    if(template.versions[0]?.id!==source.id)throw Error('Conflit : une version plus récente existe. Réexporte le dernier brouillon.');
    const review=compareWordDraftText(manifest,
      {kind:'contract_clause',clauseId:template.id,versionId:source.id,status:source.status,body:source.body},body);
    if(!review.changed)throw Error('Aucune modification textuelle à enregistrer.');
    const now=new Date().toISOString();
    this.database.exec('SAVEPOINT contract_word_review');
    try{
      const version=this.createVersion(template.id,{body});
      this.database.run(
        'INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,?,?)',
        ['contract_clause',template.id,'contract_word_draft_approved',
          'Révision Word approuvée en nouvelle version brouillon : '+template.code,
          JSON.stringify({previousVersionId:source.id,newVersionId:version.id,
            sourceSha256:manifest.sourceSha256,exportId:manifest.exportId,
            added:review.paragraphs.filter(item=>item.kind==='added').length,
            removed:review.paragraphs.filter(item=>item.kind==='removed').length,
            limits:review.warnings}),now],
      );
      this.database.exec('RELEASE SAVEPOINT contract_word_review');
      return version;
    }catch(error){
      this.database.exec('ROLLBACK TO SAVEPOINT contract_word_review');
      this.database.exec('RELEASE SAVEPOINT contract_word_review');
      throw error;
    }
  }

  publishVersion(versionId: string): ContractClauseTemplate {
    const version = this.database.get<VersionRow>('SELECT * FROM contract_clause_versions WHERE id=?', [versionId]);
    if (!version) throw new Error('Version de clause introuvable.');
    const body = clean(version.body);
    if (!body) throw new Error('Le texte de la clause doit être renseigné avant publication.');
    if (/\[À RENSEIGNER/i.test(body)) throw new Error('Cette clause contient encore un placeholder « À RENSEIGNER » et ne peut pas être publiée.');
    const template = this.getTemplate(version.clause_id);
    if (template.status === 'archived') throw new Error('Réactive la clause avant publication.');

    const now = nowIso();
    this.database.exec('BEGIN IMMEDIATE;');
    try {
      this.database.run(
        "UPDATE contract_clause_versions SET status='retired' WHERE clause_id=? AND status='published' AND id<>?",
        [version.clause_id, versionId],
      );
      this.database.run(
        "UPDATE contract_clause_versions SET status='published',published_at=? WHERE id=?",
        [now, versionId],
      );
      this.database.run(
        'UPDATE contract_clause_templates SET current_version_id=?,updated_at=? WHERE id=?',
        [versionId, now, version.clause_id],
      );
      this.writeActivity('contract_clause', version.clause_id, 'contract_clause_version_published', `Version ${version.version_number} de ${template.code} publiée`);
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }
    return this.getTemplate(version.clause_id);
  }

  setTemplateStatus(id: string, status: ContractClauseStatus): ContractClauseTemplate {
    if (!CONTRACT_CLAUSE_STATUSES.includes(status)) throw new Error('Statut de clause invalide.');
    const template = this.getTemplate(id);
    const now = nowIso();
    this.database.run(
      'UPDATE contract_clause_templates SET status=?,archived_at=?,updated_at=? WHERE id=?',
      [status, status === 'archived' ? now : null, now, id],
    );
    this.writeActivity('contract_clause', id, 'contract_clause_status_changed', `${template.code} · ${status}`);
    return this.getTemplate(id);
  }

  setTemplateAudience(id: string, audience: ContractClauseAudience): ContractClauseTemplate {
    if (!CONTRACT_CLAUSE_AUDIENCES.includes(audience)) throw new Error('Public contractuel invalide.');
    const template = this.getTemplate(id);
    if (template.status === 'archived') throw new Error('Réactive la clause avant de modifier son public.');
    const now = nowIso();
    this.database.run('UPDATE contract_clause_templates SET audience=?,updated_at=? WHERE id=?', [audience, now, id]);
    this.writeActivity('contract_clause', id, 'contract_clause_audience_changed', `${template.code} · public ${audience}`);
    return this.getTemplate(id);
  }

  setCatalogLinks(id: string, catalogItemIds: string[]): ContractClauseTemplate {
    const template = this.getTemplate(id);
    if (template.scope !== 'catalog') throw new Error('Seules les clauses de prestation peuvent être liées au catalogue.');
    const unique = [...new Set(catalogItemIds.map((item) => item.trim()).filter(Boolean))];
    for (const itemId of unique) {
      if (!this.database.get<{ id: string }>('SELECT id FROM catalog_items WHERE id=?', [itemId])) {
        throw new Error('Une prestation liée au contrat est introuvable dans le catalogue.');
      }
    }

    const now = nowIso();
    this.database.exec('BEGIN IMMEDIATE;');
    try {
      this.database.run('DELETE FROM catalog_contract_clause_links WHERE clause_id=?', [id]);
      unique.forEach((itemId, index) => this.database.run(
        'INSERT INTO catalog_contract_clause_links (catalog_item_id,clause_id,sort_order,created_at) VALUES (?,?,?,?)',
        [itemId, id, index, now],
      ));
      this.database.run('UPDATE contract_clause_templates SET updated_at=? WHERE id=?', [now, id]);
      this.writeActivity('contract_clause', id, 'contract_clause_catalog_links_changed', `${template.code} · ${unique.length} prestation(s)`);
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }
    return this.getTemplate(id);
  }

  getQuoteBuild(quoteId: string): QuoteContractBuild {
    const state = this.quoteState(quoteId);
    const frozen = this.hasSnapshot(state);
    const locked = frozen || state.status !== 'draft' || Boolean(state.finalized_at);
    const snapshotState = frozen ? 'frozen' : locked ? 'historical_missing' : 'draft';
    const clauses = this.quoteClauses(quoteId);
    const audience = this.resolveQuoteAudience(state);
    const compiledText = this.compile(clauses);
    const warnings: string[] = [];
    if (snapshotState === 'historical_missing') {
      warnings.push('Devis historique sans snapshot contractuel : cette absence est conservée. Aucune reconstruction depuis la bibliothèque actuelle.');
    } else if (frozen && (state.contract_text_snapshot === null || state.contract_snapshot_json === null)) {
      warnings.push('Snapshot historique incomplet : les données conservées ne sont pas recalculées.');
    }
    if (!clauses.some((clause) => clause.sourceKind === 'base' && clause.enabled && !clause.isOrphaned)) {
      warnings.push('Aucune clause publiée du socle CGV n’est incluse.');
    }
    if (clauses.some((clause) => clause.enabled && !clean(clause.body))) {
      warnings.push('Au moins une clause incluse ne contient aucun texte.');
    }
    if (clauses.some((clause) => clause.isOrphaned && clause.enabled)) {
      warnings.push('Une clause liée à une prestation retirée est encore incluse.');
    }
    if (clauses.some((clause) => clause.enabled && /\[À RENSEIGNER/i.test(clause.body))) {
      warnings.push('Au moins une clause contient encore un placeholder « À RENSEIGNER ».');
    }
    const dedicatedAudienceClause = this.database.get<{ id: string }>(
      `SELECT qc.id
       FROM quote_contract_clauses qc
       JOIN contract_clause_templates t ON t.id=qc.source_clause_id
       WHERE qc.quote_id=? AND qc.enabled=1 AND qc.is_orphaned=0 AND t.audience=?
       LIMIT 1`,
      [quoteId, audience],
    );
    if (!dedicatedAudienceClause) {
      warnings.push(audience === 'consumer'
        ? 'Aucune clause dédiée aux particuliers / consommateurs n’est incluse.'
        : 'Aucune clause dédiée aux clients professionnels n’est incluse.');
    }
    if(snapshotState==='draft')warnings.push(...new ContractTypeService(this.database).orderWarnings(new ContractTypeService(this.database).quoteReferences(quoteId),new Set(clauses.filter(c=>c.enabled&&c.sourceClauseId).map(c=>c.sourceClauseId!))));
    return {
      quoteId,
      audience,
      locked,
      snapshotState,
      clauses,
      compiledText,
      snapshotText: state.contract_text_snapshot,
      compiledAt: state.contract_compiled_at,
      warnings,
      types: frozen ? (state.contract_snapshot_json ? JSON.parse(state.contract_snapshot_json).types ?? [] : []) : locked ? [] : new ContractTypeService(this.database).quoteReferences(quoteId),
    };
  }

  /** Contract-type reading without persisting a quote, line, parameter or snapshot. Same applicability resolver as a quote. */
  previewReference(typeId:string,typeVersionId:string,catalogVersionId:string,audience:QuoteContractAudience):ContractPresentation {
    if(!['professional','consumer'].includes(audience))throw Error('Audience invalide.');
    const type=new ContractTypeService(this.database).get(typeId),version=type.versions.find(v=>v.id===typeVersionId);
    if(!version||!type.catalogLinks.some(l=>l.catalogVersionId===catalogVersionId))throw Error('Version ou prestation non rattachée à ce type.');
    const catalog=new CatalogService(this.database),source=this.database.get<{item_id:string}>('SELECT item_id FROM catalog_versions WHERE id=?',[catalogVersionId]);
    if(!source)throw Error('Version Catalogue introuvable.');
    const item=catalog.getItem(source.item_id),v=item.versions.find(x=>x.id===catalogVersionId)!;
    const components=item.type==='offer'?catalog.listOfferComponents(v.id).map(c=>({...c,serviceVersionId:c.serviceVersionId,specialTerms:catalog.getItem(c.serviceItemId).versions.find(x=>x.id===c.serviceVersionId)?.specialTerms})):[];
    const row:QuoteLineSourceRow={id:'reference:'+v.id,catalog_item_id:item.id,catalog_version_id:v.id,label:item.name,
      snapshot_json:JSON.stringify({specialTerms:v.specialTerms,offerComponents:components,commercialRules:new CommercialRulesService(this.database).rules(v.id)})};
    const refs:ContractTypeReference[]=[{id:type.id,code:type.code,name:version.name,versionId:version.id,versionNumber:version.versionNumber,moduleIds:version.moduleIds,catalogVersionIds:[v.id]}];
    const state:QuoteStateRow={id:'',quote_number:'',status:'draft',finalized_at:null,special_terms:null,contract_text_snapshot:null,contract_snapshot_json:null,contract_compiled_at:null,contract_audience:audience};
    const desired=[...this.desiredClauses('',state,{lines:[row],types:refs}).values()].sort((a,b)=>a.sortOrder-b.sortOrder);
    const clauses:QuoteContractClause[]=desired.map(c=>({id:c.sourceKey,quoteId:'',...c,enabled:true,isCustomized:false,isOrphaned:false,createdAt:'',updatedAt:''}));
    const modules=clauses.map(c=>{const source=c.sourceClauseVersionId?this.database.get<Record<string,unknown>>('SELECT t.code,v.version_number FROM contract_clause_versions v JOIN contract_clause_templates t ON t.id=v.clause_id WHERE v.id=?',[c.sourceClauseVersionId]):null;
      return {code:source?String(source.code):'Particulière',title:c.title,version:source?Number(source.version_number):null,source:c.sourceKind};});
    return formatContractPresentation({template:{referenceName:item.name,referenceCode:item.canonicalCode??null,catalogueVersion:v.versionNumber,audience,inclusions:v.inclusions,exclusions:v.exclusions},state:'draft',number:'',subject:'',totalCents:0,estimatedDelay:null,prerequisites:null,compiledAt:null,clauseText:this.compile(clauses),clauses,parameters:null,administration:null,types:refs,modules});
  }

  /** Read-only presentation shared by Devis, client preview, copy and PDF. */
  presentation(quoteId: string): ContractPresentation {
    const build = this.getQuoteBuild(quoteId);
    const row=this.database.get<Record<string,unknown>>('SELECT * FROM quotes WHERE id=?',[quoteId])!;
    const snapshot=row.contract_snapshot_json ? JSON.parse(String(row.contract_snapshot_json)) : null;
    if(build.snapshotState==='frozen' && snapshot?.presentation) return snapshot.presentation as ContractPresentation;
    const clauses:QuoteContractClause[]=build.snapshotState==='frozen' ? snapshot?.clauses ?? [] : build.clauses;
    const preparation=new QuoteContractPreparationService(this.database,this.documents);
    const parameters=preparation.parameters(quoteId);
    const administration:ContractAdministration|null=build.snapshotState==='draft'?preparation.administration():snapshot?.administration??null;
    const types:ContractTypeReference[]=build.types??[];
    const modules=clauses.filter(c=>c.enabled).map(c=>{
      const source=c.sourceClauseVersionId?this.database.get<Record<string,unknown>>('SELECT t.code,v.version_number FROM contract_clause_versions v JOIN contract_clause_templates t ON t.id=v.clause_id WHERE v.id=?',[c.sourceClauseVersionId]):null;
      return {code:source?String(source.code):'Particulière',title:c.title,version:source?Number(source.version_number):null,source:c.sourceKind};
    });
    const sold=build.snapshotState==='frozen'?snapshot?.soldCatalogue??[]:this.database.all<Record<string,unknown>>('SELECT id,label,quantity_milli,snapshot_json FROM quote_lines WHERE quote_id=? ORDER BY sort_order,created_at',[quoteId]).map(l=>({lineId:l.id,dossier:new CommercialRulesService(this.database).parameters(String(l.id)),quantityMilli:l.quantity_milli,catalogue:l.snapshot_json?JSON.parse(String(l.snapshot_json)):null,label:l.label}));
    const warrantyLabels:Record<string,string>=Object.fromEntries(sold.map((l:Record<string,unknown>)=>[String(l.lineId),String((l.catalogue as Record<string,unknown>|null)?.itemName??l.label??'Prestation du devis')]));
    const lineDetails:string[]=sold.flatMap((l:Record<string,unknown>)=>{
      const catalogue=l.catalogue as Record<string,unknown>|null;
      const dossier=l.dossier as Record<string,unknown>|null;
      const description=[catalogue?.itemName??l.label,`Quantité : ${Number(l.quantityMilli??1000)/1000}`,dossier?.scope,dossier?.acceptedDeadline].filter(Boolean).join(' — ');
      const inclusions=Array.isArray(catalogue?.inclusions)?catalogue.inclusions.filter(x=>typeof x==='string'):[];
      const exclusions=Array.isArray(catalogue?.exclusions)?catalogue.exclusions.filter(x=>typeof x==='string'):[];
      return description?[[description,...inclusions.map(x=>`• Inclus : ${x}`),...exclusions.map(x=>`• Non inclus : ${x}`)].join('\n')]:[];
    });
    const familyNames:Record<string,string>={WEB:'Site vitrine / Web',LANDING:'Landing page',ECOM:'E-commerce',CONTENU:'Contenu',IDENTITE:'Identité visuelle',PHOTO:'Photographie',DATA:'Analytics',MAINT:'Maintenance',MARIAGE:'Site mariage',APP:'Application métier',DEVWP:'Développement WordPress',TECH:'Prestations techniques',SEO:'Référencement'};
    const itemGroups:Record<string,string>=Object.fromEntries(sold.map((l:Record<string,unknown>)=>{const c=l.catalogue as Record<string,unknown>|null;return [String(c?.itemId??l.itemId??''),familyNames[String(c?.familyCode)]??'Prestations du devis'];}));
    const clauseGroupLabels=Object.fromEntries(clauses.map(c=>[c.id,[...new Set(c.sourceCatalogItemIds.map(id=>itemGroups[id]).filter(Boolean))].join(' / ')||'Prestations du devis']));
    return formatContractPresentation({state:build.snapshotState,number:String(row.quote_number),subject:String(row.subject),totalCents:Number(row.contract_value_cents),estimatedDelay:row.estimated_delay as string|null,prerequisites:row.prerequisites_text as string|null,compiledAt:build.compiledAt??null,clauseText:build.snapshotState==='draft'?build.compiledText:build.snapshotText??'',clauses,parameters,administration,types,modules,lineDetails,warrantyLabels,clauseGroupLabels});
  }

  syncQuote(quoteId: string): QuoteContractBuild {
    this.assertQuoteEditable(quoteId);
    this.syncQuoteInternal(quoteId);
    this.writeActivity('quote', quoteId, 'quote_contract_synced', 'CGV synchronisées avec les prestations du devis');
    return this.getQuoteBuild(quoteId);
  }

  addCustomQuoteClause(quoteId: string, input: QuoteContractClauseInput): QuoteContractBuild {
    this.assertQuoteEditable(quoteId);
    const title = clean(input.title);
    if (!title) throw new Error('Le titre de la clause particulière est requis.');
    const next = this.database.get<{ next_order: number }>(
      'SELECT COALESCE(MAX(sort_order),1990)+10 AS next_order FROM quote_contract_clauses WHERE quote_id=?',
      [quoteId],
    );
    const now = nowIso();
    this.database.run(
      `INSERT INTO quote_contract_clauses
       (id,quote_id,source_key,source_kind,source_clause_id,source_clause_version_id,source_catalog_item_ids_json,
        title,body,sort_order,enabled,is_customized,is_orphaned,created_at,updated_at)
       VALUES (?,?,?,'custom',NULL,NULL,'[]',?,?,?,?,1,0,?,?)`,
      [
        randomUUID(), quoteId, `custom:${randomUUID()}`, title, input.body ?? '',
        Number(next?.next_order ?? 2000), input.enabled === false ? 0 : 1, now, now,
      ],
    );
    this.writeActivity('quote', quoteId, 'quote_contract_custom_clause_added', `Clause particulière ajoutée : ${title}`);
    return this.getQuoteBuild(quoteId);
  }

  updateQuoteClause(id: string, input: QuoteContractClauseUpdate): QuoteContractBuild {
    const row = this.database.get<QuoteClauseRow>('SELECT * FROM quote_contract_clauses WHERE id=?', [id]);
    if (!row) throw new Error('Clause du devis introuvable.');
    this.assertQuoteEditable(row.quote_id);
    if (row.source_kind === 'base') {
      if (input.enabled === false) throw new Error('Le socle CGV AtoumWeb est fixe et ne peut pas être exclu d’un devis.');
      if (input.title !== undefined || input.body !== undefined) {
        throw new Error('Une clause du socle fixe se modifie dans la Bibliothèque CGV, par nouvelle version.');
      }
    }
    const nextTitle = input.title === undefined ? row.title : clean(input.title);
    if (!nextTitle) throw new Error('Le titre de la clause est requis.');
    const nextBody = input.body === undefined ? row.body : input.body;
    const nextEnabled = input.enabled === undefined ? Boolean(row.enabled) : input.enabled;
    const textCustomized = input.title !== undefined || input.body !== undefined;
    this.database.run(
      `UPDATE quote_contract_clauses
       SET title=?,body=?,enabled=?,is_customized=?,updated_at=? WHERE id=?`,
      [nextTitle, nextBody, nextEnabled ? 1 : 0, textCustomized ? 1 : row.is_customized, nowIso(), id],
    );
    this.writeActivity('quote', row.quote_id, 'quote_contract_clause_updated', `Clause du devis mise à jour : ${nextTitle}`);
    return this.getQuoteBuild(row.quote_id);
  }

  resetQuoteClause(id: string): QuoteContractBuild {
    const row = this.database.get<QuoteClauseRow>('SELECT * FROM quote_contract_clauses WHERE id=?', [id]);
    if (!row) throw new Error('Clause du devis introuvable.');
    this.assertQuoteEditable(row.quote_id);
    if (row.source_kind === 'base') throw new Error('Le socle fixe reprend toujours la version publiée de la Bibliothèque CGV.');
    if (!row.source_clause_id) throw new Error('Cette clause particulière ne dépend pas d’un modèle réinitialisable.');
    const template = this.getTemplate(row.source_clause_id);
    if (!template.currentVersion) throw new Error('Aucune version publiée n’est disponible pour cette clause.');
    this.database.run(
      `UPDATE quote_contract_clauses
       SET title=?,body=?,source_clause_version_id=?,enabled=1,is_customized=0,updated_at=? WHERE id=?`,
      [template.title, template.currentVersion.body, template.currentVersion.id, nowIso(), id],
    );
    this.writeActivity('quote', row.quote_id, 'quote_contract_clause_reset', `Clause réinitialisée : ${template.title}`);
    return this.getQuoteBuild(row.quote_id);
  }

  removeCustomQuoteClause(id: string): QuoteContractBuild {
    const row = this.database.get<QuoteClauseRow>('SELECT * FROM quote_contract_clauses WHERE id=?', [id]);
    if (!row) throw new Error('Clause du devis introuvable.');
    this.assertQuoteEditable(row.quote_id);
    if (!row.source_key.startsWith('custom:')) throw new Error('Une clause automatique doit être désactivée, pas supprimée.');
    this.database.run('DELETE FROM quote_contract_clauses WHERE id=?', [id]);
    this.writeActivity('quote', row.quote_id, 'quote_contract_custom_clause_removed', `Clause particulière supprimée : ${row.title}`);
    return this.getQuoteBuild(row.quote_id);
  }

  reorderQuoteClauses(quoteId: string, clauseIds: string[]): QuoteContractBuild {
    this.assertQuoteEditable(quoteId);
    const existing = this.database.all<{ id: string }>(
      'SELECT id FROM quote_contract_clauses WHERE quote_id=? ORDER BY sort_order,created_at',
      [quoteId],
    ).map((row) => row.id);
    if (existing.length !== clauseIds.length || new Set(clauseIds).size !== clauseIds.length || existing.some((id) => !clauseIds.includes(id))) {
      throw new Error('La liste de réordonnancement des clauses est incomplète.');
    }
    const now = nowIso();
    this.database.exec('BEGIN IMMEDIATE;');
    try {
      clauseIds.forEach((id, index) => this.database.run(
        'UPDATE quote_contract_clauses SET sort_order=?,updated_at=? WHERE id=? AND quote_id=?',
        [index * 10, now, id, quoteId],
      ));
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }
    this.writeActivity('quote', quoteId, 'quote_contract_reordered', 'Ordre des clauses du devis modifié');
    return this.getQuoteBuild(quoteId);
  }

  freezeQuote(quoteId: string, explicitCanonicalReview=false): QuoteContractBuild {
    const state = this.quoteState(quoteId);
    // A timestamp/JSON (including an empty clause list) is evidence of freezing.
    // Locked legacy quotes must retain their historical absence, even with instances.
    if (this.hasSnapshot(state) || state.status !== 'draft' || state.finalized_at) return this.getQuoteBuild(quoteId);
    const payload=new QuoteContractPreparationService(this.database, this.documents).freezePayload(quoteId);
    if(explicitCanonicalReview&&!payload)throw Error('Préparation du devis indispensable pour la validation canonique du contrat.');
    this.database.exec('SAVEPOINT quote_contract_freeze;');
    try {
    this.syncQuoteInternal(quoteId);
    const clauses = this.quoteClauses(quoteId);
    const audience = this.resolveQuoteAudience(state);
    const included = clauses.filter((clause) => clause.enabled && !clause.isOrphaned);
    const activeOrphans = clauses.filter((clause) => clause.enabled && clause.isOrphaned);
    // Quote finalization shares this same transaction: a failed legal review rolls back the entire freeze.
    // Only a reviewed, complete contract may replace the legacy ordering for new prepared quotes.
    let compiledText=this.compile(clauses);
    let usedCanonical=false;
    if(payload){
      const reviewService=new ContractSectionReviewService(this.database);
      const entries=clauses.filter(clause=>clause.sourceKind!=='custom').map(clause=>({
        clause,
        review:clause.sourceClauseVersionId
          ?reviewService.get(clause.sourceClauseVersionId)
          :{status:'unclassified' as const,sectionKey:null,rankInSection:null},
      }));
      const assembly=assembleReviewedDraftContract(entries,{audience});
      // Legacy prepared quotes and intentional custom clauses have no approved 05C
      // classification. Do not break their existing finalization path.
      // Once a quote elects reviewed 05C classification, all selected clauses
      // must pass the approved canonical assembly gate.
      // A quote with a partially approved existing library remains on the
      // historical compiler until a complete human-approved set is available.
      // No incomplete canonical document may be emitted or labelled reviewed.
      const hasApprovedClassification=entries.some(({clause,review})=>
        clause.enabled&&!clause.isOrphaned&&review.status==='approved');
      const mode=decideCanonicalContractMode({explicitOptIn:explicitCanonicalReview,hasApprovedClassification,assemblyReady:assembly.ready});
      if(mode==='requires_review')throw Error('Classement juridique incomplet : approbation humaine requise.');
      if(mode==='canonical'){
        usedCanonical=true;
        const particular=included.filter(clause=>clause.sourceKind==='custom');
        const append=particular.length?'\n\nCONDITIONS PARTICULIÈRES\n\n'+particular.map((clause,index)=>`${index+1}. ${clause.title.trim()}\n${clause.body.trim()}`).join('\n\n'):'';
        compiledText='CONDITIONS GÉNÉRALES DE VENTE – ATOUMWEB\n\n'+renderApprovedDraftContract(assembly)+append;
      }
    }
    if(payload && !included.some(c=>c.sourceKind==='base'&&!c.isOrphaned)) throw Error('Préparation contractuelle incomplète : aucun socle publié disponible ; les brouillons ne sont pas consommés.');

    if(payload && (activeOrphans.length > 0 || included.some(c=>!clean(c.body)||/\[À RENSEIGNER/i.test(c.body)))) throw Error('Clause incluse vide, orpheline ou incomplète : finalisation refusée.');
    const now = nowIso();
    const types=new ContractTypeService(this.database).quoteReferences(quoteId);
    const orderConflicts=new ContractTypeService(this.database).orderWarnings(types,new Set(included.filter(c=>c.sourceClauseId).map(c=>c.sourceClauseId!)));
    if(orderConflicts.length&&!this.database.get("SELECT id FROM activity_log WHERE entity_type='quote' AND entity_id=? AND action='quote_contract_reordered'",[quoteId]))throw Error(orderConflicts.join(' '));
    const currentPresentation=payload?this.presentation(quoteId):null;
    const presentation= currentPresentation ? (() => {
      if(!usedCanonical)return {...currentPresentation,state:'frozen' as const,compiledAt:now};
      // Keep commercial/parameter sections, replace only the displayed clause
      // sections with the exact canonical text stored in the frozen snapshot.
      const sections=currentPresentation.sections.filter(section=>!['base','catalog','custom'].includes(section.id));
      sections.push({id:'clauses',title:'Contrat contractuel approuvé',text:compiledText});
      return {
        ...currentPresentation,state:'frozen' as const,compiledAt:now,sections,
        text:sections.map(section=>section.title.toUpperCase()+'\n\n'+section.text).join('\n\n'),
      };
    })():null;
    this.database.run(
      `UPDATE quotes
       SET contract_text_snapshot=?,contract_snapshot_json=?,contract_compiled_at=?,contract_audience=?,updated_at=?
       WHERE id=?`,
      [compiledText, JSON.stringify({ ...(payload ?? {}), audience, clauses: included, ...(payload ? {compiledAt:now,finalizationAt:now,types,presentation} : {}) }), now, audience, now, quoteId],
    );
    this.writeActivity('quote', quoteId, 'quote_contract_frozen', 'Version contractuelle des CGV figée');
    this.database.exec('RELEASE quote_contract_freeze;');
    return this.getQuoteBuild(quoteId);
    } catch(error) {this.database.exec('ROLLBACK TO quote_contract_freeze; RELEASE quote_contract_freeze;');throw error;}
  }

  copyQuoteCustomizations(sourceQuoteId: string, targetQuoteId: string, lineIds?: Map<string,string>): QuoteContractBuild {
    this.assertQuoteEditable(targetQuoteId);
    this.syncQuoteInternal(targetQuoteId);
    const source = this.quoteClauses(sourceQuoteId);
    const target = this.quoteClauses(targetQuoteId);
    const targetByKey = new Map(target.map((clause) => [clause.sourceKey, clause]));

    for (const clause of source) {
      if (clause.sourceKey.startsWith('custom:')) {
        this.addCustomQuoteClause(targetQuoteId, { title: clause.title, body: clause.body, enabled: clause.enabled });
        continue;
      }
      const targetKey = clause.sourceKey.startsWith('particular-line:') && lineIds ? `particular-line:${lineIds.get(clause.sourceKey.slice('particular-line:'.length))}` : clause.sourceKey;
      const match = targetByKey.get(targetKey);
      if (!match) continue;
      this.database.run(
        `UPDATE quote_contract_clauses
         SET enabled=?,title=?,body=?,is_customized=?,updated_at=? WHERE id=?`,
        [
          clause.enabled ? 1 : 0,
          clause.isCustomized ? clause.title : match.title,
          clause.isCustomized ? clause.body : match.body,
          clause.isCustomized ? 1 : match.isCustomized ? 1 : 0,
          nowIso(),
          match.id,
        ],
      );
    }
    return this.getQuoteBuild(targetQuoteId);
  }

  private syncQuoteInternal(quoteId: string): void {
    const state = this.quoteState(quoteId);
    if (this.hasSnapshot(state) || state.status !== 'draft' || state.finalized_at) {
      throw new Error('Les CGV de ce devis sont figées. Duplique le devis pour les modifier.');
    }

    const desired = this.desiredClauses(quoteId, state);
    const existing = this.database.all<QuoteClauseRow>(
      'SELECT * FROM quote_contract_clauses WHERE quote_id=? ORDER BY sort_order,created_at',
      [quoteId],
    );
    const existingByKey = new Map(existing.map((row) => [row.source_key, row]));
    const manualOrder=!!this.database.get("SELECT id FROM activity_log WHERE entity_type='quote' AND entity_id=? AND action='quote_contract_reordered' LIMIT 1",[quoteId]);
    const now = nowIso();

    this.database.exec('SAVEPOINT quote_clause_sync;');
    try {
      for (const clause of desired.values()) {
        const row = existingByKey.get(clause.sourceKey);
        if (row) {
          const reenable = Boolean(row.is_orphaned) && !Boolean(row.is_customized);
          this.database.run(
            `UPDATE quote_contract_clauses SET
             source_kind=?,source_clause_id=?,source_clause_version_id=?,source_catalog_item_ids_json=?,
             title=?,body=?,enabled=?,sort_order=?,is_orphaned=0,updated_at=? WHERE id=?`,
            [
              clause.sourceKind,
              clause.sourceClauseId,
              row.is_customized ? row.source_clause_version_id : clause.sourceClauseVersionId,
              JSON.stringify(clause.sourceCatalogItemIds),
              row.is_customized ? row.title : clause.title,
              row.is_customized ? row.body : clause.body,
              reenable ? 1 : row.enabled,
              manualOrder ? row.sort_order : clause.sortOrder,
              now,
              row.id,
            ],
          );
        } else {
          this.database.run(
            `INSERT INTO quote_contract_clauses
             (id,quote_id,source_key,source_kind,source_clause_id,source_clause_version_id,source_catalog_item_ids_json,
              title,body,sort_order,enabled,is_customized,is_orphaned,created_at,updated_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,1,0,0,?,?)`,
            [
              randomUUID(), quoteId, clause.sourceKey, clause.sourceKind, clause.sourceClauseId, clause.sourceClauseVersionId,
              JSON.stringify(clause.sourceCatalogItemIds), clause.title, clause.body, clause.sortOrder, now, now,
            ],
          );
        }
      }

      for (const row of existing) {
        if (desired.has(row.source_key) || row.source_key.startsWith('custom:')) continue;
        const autoDisable = !Boolean(row.is_customized);
        this.database.run(
          'UPDATE quote_contract_clauses SET is_orphaned=1,enabled=?,updated_at=? WHERE id=?',
          [autoDisable ? 0 : row.enabled, now, row.id],
        );
      }
      this.database.exec('RELEASE quote_clause_sync;');
    } catch (error) {
      this.database.exec('ROLLBACK TO quote_clause_sync; RELEASE quote_clause_sync;');
      throw error;
    }
  }

  private desiredClauses(quoteId: string, state: QuoteStateRow, reference?:{lines:QuoteLineSourceRow[];types:ContractTypeReference[]}): Map<string, DesiredClause> {
    const desired = new Map<string, DesiredClause>();
    const audience = this.resolveQuoteAudience(state);
    const baseRows = this.database.all<PublishedTemplateRow>(
      `SELECT t.id,t.title,t.scope,t.sort_order,v.id AS version_id,v.body
       FROM contract_clause_templates t
       JOIN contract_clause_versions v ON v.id=t.current_version_id
       WHERE t.scope='base' AND t.status='active' AND v.status='published'
         AND t.audience IN ('all', ?)
       ORDER BY t.sort_order,t.title COLLATE NOCASE`,
      [audience],
    );
    baseRows.forEach((row, index) => desired.set(`template:${row.id}`, {
      sourceKey: `template:${row.id}`,
      sourceKind: 'base',
      sourceClauseId: row.id,
      sourceClauseVersionId: row.version_id,
      sourceCatalogItemIds: [],
      title: row.title,
      body: row.body,
      sortOrder: index * 10,
    }));

    const lines = reference?.lines ?? this.database.all<QuoteLineSourceRow>(
      'SELECT id,catalog_item_id,catalog_version_id,label,snapshot_json FROM quote_lines WHERE quote_id=? ORDER BY sort_order,created_at',
      [quoteId],
    );
    const catalogItemIds = new Set<string>();
    const componentLegacyTerms: Array<{ itemId: string; versionId: string | null; name: string; body: string }> = [];
    const lineSnapshots: Array<{ row: QuoteLineSourceRow; snapshot: Record<string, unknown> | null }> = [];
    for (const row of lines) {
      if (row.catalog_item_id) catalogItemIds.add(row.catalog_item_id);
      let snapshot: Record<string, unknown> | null = null;
      if (row.snapshot_json) {
        try {
          const parsed = JSON.parse(row.snapshot_json) as unknown;
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) snapshot = parsed as Record<string, unknown>;
        } catch {
          snapshot = null;
        }
      }
      const components = Array.isArray(snapshot?.offerComponents) ? snapshot.offerComponents : [];
      for (const raw of components) {
        if (!raw || typeof raw !== 'object') continue;
        const component = raw as Record<string, unknown>;
        if (component.isOptional) continue;
        if (typeof component.serviceItemId === 'string' && component.serviceItemId) {
          catalogItemIds.add(component.serviceItemId);
          const componentTerms = typeof component.specialTerms === 'string' ? clean(component.specialTerms) : null;
          if (componentTerms) {
            componentLegacyTerms.push({
              itemId: component.serviceItemId,
              versionId: typeof component.serviceVersionId === 'string' ? component.serviceVersionId : null,
              name: typeof component.serviceName === 'string' ? component.serviceName : 'Prestation',
              body: componentTerms,
            });
          }
        }
      }
      lineSnapshots.push({ row, snapshot });
    }

    const linkedItemIds = new Set<string>();
    if (catalogItemIds.size > 0) {
      const ids = [...catalogItemIds];
      const placeholders = ids.map(() => '?').join(',');
      const linked = this.database.all<LinkedTemplateRow>(
        `SELECT l.catalog_item_id,l.sort_order AS link_sort_order,
                t.id,t.title,t.scope,t.sort_order,v.id AS version_id,v.body
         FROM catalog_contract_clause_links l
         JOIN contract_clause_templates t ON t.id=l.clause_id
         JOIN contract_clause_versions v ON v.id=t.current_version_id
         WHERE l.catalog_item_id IN (${placeholders})
           AND t.scope='catalog' AND t.status='active' AND v.status='published'
           AND t.audience IN ('all', ?)
         ORDER BY l.sort_order,t.sort_order,t.title COLLATE NOCASE`,
        [...ids, audience] as SqlValue[],
      );

      const grouped = new Map<string, { row: LinkedTemplateRow; itemIds: Set<string> }>();
      for (const row of linked) {
        linkedItemIds.add(row.catalog_item_id);
        const current = grouped.get(row.id);
        if (current) current.itemIds.add(row.catalog_item_id);
        else grouped.set(row.id, { row, itemIds: new Set([row.catalog_item_id]) });
      }
      let index = 0;
      for (const { row, itemIds } of grouped.values()) {
        desired.set(`template:${row.id}`, {
          sourceKey: `template:${row.id}`,
          sourceKind: 'catalog',
          sourceClauseId: row.id,
          sourceClauseVersionId: row.version_id,
          sourceCatalogItemIds: [...itemIds],
          title: row.title,
          body: row.body,
          sortOrder: 1000 + index * 10,
        });
        index += 1;
      }
    }

    // Explicit per-version particular conditions coexist with shared modules.
    // Source identity follows the actual sold line; existing orphan/customization rules apply.
    for (const { row, snapshot } of lineSnapshots) {
      const terms = (snapshot?.commercialRules as CommercialVersionRules | undefined)?.particularTerms;
      if (!terms || !row.catalog_item_id) continue;
      const sourceKey = `particular-line:${row.id}`;
      desired.set(sourceKey, {sourceKey,sourceKind:'catalog',sourceClauseId:null,sourceClauseVersionId:null,
        sourceCatalogItemIds:[row.catalog_item_id],title:terms.title,body:terms.body,sortOrder:1800+desired.size});
    }

    let legacyIndex = 0;
    for (const { row, snapshot } of lineSnapshots) {
      if (!row.catalog_item_id || linkedItemIds.has(row.catalog_item_id)) continue;
      const specialTerms = typeof snapshot?.specialTerms === 'string' ? clean(snapshot.specialTerms) : null;
      if (!specialTerms) continue;
      const sourceId = row.catalog_version_id ?? row.catalog_item_id;
      const sourceKey = `legacy-catalog:${sourceId}`;
      if (desired.has(sourceKey)) continue;
      desired.set(sourceKey, {
        sourceKey,
        sourceKind: 'catalog',
        sourceClauseId: null,
        sourceClauseVersionId: null,
        sourceCatalogItemIds: [row.catalog_item_id],
        title: `Conditions spécifiques — ${row.label}`,
        body: specialTerms,
        sortOrder: 1500 + legacyIndex * 10,
      });
      legacyIndex += 1;
    }

    for (const component of componentLegacyTerms) {
      if (linkedItemIds.has(component.itemId)) continue;
      const sourceKey = `legacy-catalog:${component.versionId ?? component.itemId}`;
      if (desired.has(sourceKey)) continue;
      desired.set(sourceKey, {
        sourceKey,
        sourceKind: 'catalog',
        sourceClauseId: null,
        sourceClauseVersionId: null,
        sourceCatalogItemIds: [component.itemId],
        title: `Conditions spécifiques — ${component.name}`,
        body: component.body,
        sortOrder: 1500 + legacyIndex * 10,
      });
      legacyIndex += 1;
    }

    const legacySpecialTerms = clean(state.special_terms);
    const duplicatesExistingTerm = legacySpecialTerms
      ? [...desired.values()].some((clause) => clause.body.trim() === legacySpecialTerms)
      : false;
    if (legacySpecialTerms && !duplicatesExistingTerm) {
      desired.set('legacy:quote-special', {
        sourceKey: 'legacy:quote-special',
        sourceKind: 'custom',
        sourceClauseId: null,
        sourceClauseVersionId: null,
        sourceCatalogItemIds: [],
        title: 'Conditions particulières',
        body: legacySpecialTerms,
        sortOrder: 2000,
      });
    }
    // Types reorder only clauses already applicable; membership never activates an option.
    const refs=reference?.types ?? new ContractTypeService(this.database).quoteReferences(quoteId);
    const ranks=new Map<string,number>();
    for(const type of refs)for(const id of type.moduleIds)if(!ranks.has(id))ranks.set(id,ranks.size);
    let trailing=ranks.size;
    for(const clause of desired.values())if(clause.sourceKind==='catalog'&&clause.sourceClauseId)
      clause.sortOrder=1000+10*(ranks.get(clause.sourceClauseId)??trailing++);
    return desired;
  }

  private quoteState(quoteId: string): QuoteStateRow {
    const row = this.database.get<QuoteStateRow>(
      `SELECT id,quote_number,status,finalized_at,special_terms,
              contract_text_snapshot,contract_snapshot_json,contract_compiled_at,contract_audience
       FROM quotes WHERE id=?`,
      [quoteId],
    );
    if (!row) throw new Error('Devis introuvable.');
    return row;
  }

  private resolveQuoteAudience(state: QuoteStateRow): QuoteContractAudience {
    if (state.contract_audience) return state.contract_audience;
    const owner = this.database.get<{ client_organization_id: string | null; prospect_organization_id: string | null }>(
      `SELECT ca.organization_id AS client_organization_id, p.organization_id AS prospect_organization_id
       FROM quotes q
       LEFT JOIN client_accounts ca ON ca.id=COALESCE(q.client_account_id,q.accepted_client_account_id)
       LEFT JOIN prospects p ON p.id=q.prospect_id
       WHERE q.id=?`,
      [state.id],
    );
    return owner?.client_organization_id || owner?.prospect_organization_id ? 'professional' : 'consumer';
  }

  private assertQuoteEditable(quoteId: string): void {
    const state = this.quoteState(quoteId);
    if (this.hasSnapshot(state) || state.status !== 'draft' || state.finalized_at) {
      throw new Error('Les CGV de ce devis sont figées. Duplique le devis pour les modifier.');
    }
  }

  private hasSnapshot(state: QuoteStateRow): boolean {
    return state.contract_compiled_at !== null || state.contract_text_snapshot !== null || state.contract_snapshot_json !== null;
  }

  private quoteClauses(quoteId: string): QuoteContractClause[] {
    return this.database
      .all<QuoteClauseRow>('SELECT * FROM quote_contract_clauses WHERE quote_id=? ORDER BY sort_order,created_at', [quoteId])
      .map((row) => this.mapQuoteClause(row));
  }

  private compile(clauses: QuoteContractClause[]): string {
    const included = clauses.filter((clause) => clause.enabled && !clause.isOrphaned);

    if (included.length === 0) return '';
    const body = included.map((clause, index) => {
      const text = clause.body.trim();
      return `${index + 1}. ${clause.title.trim()}\n${text}`.trimEnd();
    }).join('\n\n');
    return `CONDITIONS GÉNÉRALES DE VENTE – ATOUMWEB\n\n${body}`;
  }

  private mapVersion(row: VersionRow): ContractClauseVersion {
    return {
      id: row.id,
      clauseId: row.clause_id,
      versionNumber: Number(row.version_number),
      body: row.body,
      status: row.status,
      publishedAt: row.published_at,
      review: row.review_metadata_json ? JSON.parse(row.review_metadata_json) as ContractClauseReviewMetadata : null,
      createdAt: row.created_at,
    };
  }

  private mapQuoteClause(row: QuoteClauseRow): QuoteContractClause {
    let sourceCatalogItemIds: string[] = [];
    try {
      const parsed = JSON.parse(row.source_catalog_item_ids_json) as unknown;
      if (Array.isArray(parsed)) sourceCatalogItemIds = parsed.filter((value): value is string => typeof value === 'string');
    } catch {
      sourceCatalogItemIds = [];
    }
    return {
      id: row.id,
      quoteId: row.quote_id,
      sourceKey: row.source_key,
      sourceKind: row.source_kind,
      sourceClauseId: row.source_clause_id,
      sourceClauseVersionId: row.source_clause_version_id,
      sourceCatalogItemIds,
      title: row.title,
      body: row.body,
      sortOrder: Number(row.sort_order),
      enabled: Boolean(row.enabled),
      isCustomized: Boolean(row.is_customized),
      isOrphaned: Boolean(row.is_orphaned),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private writeActivity(entityType: string, entityId: string, action: string, summary: string): void {
    this.database.run(
      'INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,NULL,?)',
      [entityType, entityId, action, summary, nowIso()],
    );
  }
}
