import { createHash, randomUUID } from 'node:crypto';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import { CONTRACT_LEGAL_REVIEW_LEVELS, type ContractClauseAudience, type ContractClauseScope, type ContractClauseReviewMetadata } from '../../shared/contractTerms';
import { ContractTermsService } from './ContractTermsService';
import { catalogImportHash as hash } from './CatalogImportService';

export interface ContractLibraryRecord {
  code: string; title: string; scope: ContractClauseScope; audience: ContractClauseAudience;
  sortOrder: number; body: string; review: ContractClauseReviewMetadata;
}
export interface ContractLibraryLink { awCode: string; clauseCode: string; sortOrder: number; sourceCell: string; }
export interface ContractLibrarySource {
  schemaVersion: 1;
  source: { reference: string; sha256: string; doctrineDate: string; documents: Array<{ reference: string; sha256: string }> };
  records: ContractLibraryRecord[]; links: ContractLibraryLink[];
}
export interface ContractLibraryManifest {
  schemaVersion: 1; reference: string; sourceSha256: string; extractionSha256: string;
  canonicalCodes: string[]; awCodes: string[]; excludedCodes: string[]; dormantCodes: string[];
  expected: { clauses: number; versions: number; links: number; scope: Record<string, number>; audience: Record<string, number>; editorial: Record<string, number>; review: Record<string, number> };
}
export interface ContractLibraryImportRow {
  code: string; scope: string; audience: string; version: number; state: 'draft';
  action: 'create' | 'keep' | 'conflict'; links: number; review: string; source: string; anomaly: string | null;
}
export interface ContractLibraryDiagnostics {
  missingClauseCodes: string[]; missingAWCodes: string[]; orphanLinks: string[];
  duplicateClauses: string[]; duplicateLinks: string[]; textAnomalies: string[];
  audienceAnomalies: string[]; baseCatalogLinks: string[]; sourceAnomalies: string[];
}
export interface ContractLibraryImportPlan {
  planSha256: string; payloadSha256: string; manifestSha256: string; sourceSha256: string;
  rows: ContractLibraryImportRow[]; diagnostics: ContractLibraryDiagnostics; anomalies: string[];
  counts: { clausesToCreate: number; versionsToCreate: number; linksToCreate: number; clausesKept: number; linksKept: number; conflicts: number };
  scopes: Record<string, number>; audiences: Record<string, number>; editorial: Record<string, number>; reviews: Record<string, number>;
  dormantCodes: string[];
}
const distribution = (values: string[]) => values.reduce<Record<string, number>>((result, value) => { result[value] = (result[value] ?? 0) + 1; return result; }, {});
const duplicates = (values: string[]) => [...new Set(values.filter((value, i) => values.indexOf(value) !== i))];
export const contractLibraryExtractionHash = (source: ContractLibrarySource): string => createHash('sha256').update(JSON.stringify(source, null, 2) + '\n').digest('hex');

/** Explicit import only. No publication, quote synchronization, seed, alias migration or name matching. */
export class ContractLibraryImportService {
  constructor(private readonly database: DatabaseAdapter) {}

  simulate(source: ContractLibrarySource, manifest: ContractLibraryManifest): ContractLibraryImportPlan {
    const d: ContractLibraryDiagnostics = { missingClauseCodes: [], missingAWCodes: [], orphanLinks: [], duplicateClauses: [], duplicateLinks: [], textAnomalies: [], audienceAnomalies: [], baseCatalogLinks: [], sourceAnomalies: [] };
    const codes = source.records.map(r => r.code), awCodes = manifest.awCodes;
    d.duplicateClauses = duplicates(codes); d.duplicateLinks = duplicates(source.links.map(l => `${l.awCode} → ${l.clauseCode}`));
    d.missingClauseCodes = manifest.canonicalCodes.filter(code => !codes.includes(code));
    const sourceCheck = (ok: boolean, reason: string) => { if (!ok) d.sourceAnomalies.push(reason); };
    sourceCheck(source.schemaVersion === 1 && manifest.schemaVersion === 1, 'Version de contrat d’import inconnue.');
    sourceCheck(source.source.sha256 === manifest.sourceSha256 && /^[a-f0-9]{64}$/.test(source.source.sha256), 'Empreinte XLSX différente du manifeste validé.');
    sourceCheck(contractLibraryExtractionHash(source) === manifest.extractionSha256, 'Extraction modifiée : nouveau dry-run et accord nécessaires.');
    sourceCheck(source.source.doctrineDate === '2026-10-03', 'Doctrine du 03/10 absente.');
    sourceCheck(source.source.documents.length === 8 && source.source.documents.every(doc => /^[a-f0-9]{64}$/.test(doc.sha256)), 'Sources documentaires incomplètes.');
    sourceCheck(codes.length === 118 && manifest.expected.clauses === 118 && manifest.expected.versions === 118 && source.links.length === 409 && manifest.expected.links === 409, 'Cible 118 clauses / 118 versions / 409 liens non respectée.');
    sourceCheck(awCodes.length === 112 && new Set(awCodes).size === 112 && awCodes.every(code => /^AW-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(code)), 'Référentiel AW incomplet/invalide.');
    sourceCheck(hash([...codes].sort()) === hash([...manifest.canonicalCodes].sort()), 'Codes canoniques différents du manifeste.');
    sourceCheck(manifest.dormantCodes.length === 1 && manifest.dormantCodes[0] === 'LANDING-GESTION', 'Clause dormante différente de LANDING-GESTION.');
    for (const r of source.records) {
      if (!/^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*$/.test(r.code) || manifest.excludedCodes.includes(r.code) || r.code === 'CONS-RETRACTATION-EN-LIGNE') d.sourceAnomalies.push(`${r.code} : code non canonique/ancien/contrôle applicatif.`);
      if (typeof r.body !== 'string' || !r.body.trim() || r.body.includes('\ufffd') || r.body.startsWith('=')) d.textAnomalies.push(`${r.code} : texte absent, formule ou encodage invalide.`);
      if (!r.title?.trim()) d.textAnomalies.push(`${r.code} : titre absent.`);
      if (!['base','catalog'].includes(r.scope) || (r.code.startsWith('BASE-') && r.scope !== 'base')) d.sourceAnomalies.push(`${r.code} : scope invalide.`);
      if (!['all','professional','consumer'].includes(r.audience) || r.code.startsWith('PRO-') && (r.audience !== 'professional' || r.scope !== 'base') || r.code.startsWith('CONS-') && (r.audience !== 'consumer' || r.scope !== 'base')) d.audienceAnomalies.push(`${r.code} : audience/scope incohérent.`);
      if (!CONTRACT_LEGAL_REVIEW_LEVELS.includes(r.review.level) || r.review.businessDecisions !== 'Aucun arbitrage métier ouvert') d.sourceAnomalies.push(`${r.code} : revue/doctrine incohérente.`);
      if (r.review.provenance.sha256 !== source.source.sha256 || r.review.provenance.reference !== source.source.reference || !r.review.provenance.bodyCell.startsWith('Textes brouillons!B')) d.sourceAnomalies.push(`${r.code} : provenance textuelle incohérente.`);
    }
    const scopes = distribution(source.records.map(r => r.scope)), audiences = distribution(source.records.map(r => r.audience));
    const editorial = distribution(source.records.map(r => r.review.editorialDecision)), reviews = distribution(source.records.map(r => r.review.level));
    for (const [label, actual, expected] of [['scopes',scopes,{base:19,catalog:99}],['audiences',audiences,{all:105,professional:3,consumer:10}],['suivi',editorial,{modifier:42,'inchangé':52,'compléter hors clause':22,'qualification préalable':2}],['revues',reviews,manifest.expected.review]] as const) sourceCheck(hash(actual) === hash(expected), `Répartition ${label} différente de la cible.`);
    sourceCheck(hash(scopes) === hash(manifest.expected.scope) && hash(audiences) === hash(manifest.expected.audience) && hash(editorial) === hash(manifest.expected.editorial), 'Répartition du manifeste incohérente.');
    const items = this.database.all<{ id: string; canonical_code: string; status: string }>('SELECT id,canonical_code,status FROM catalog_items WHERE canonical_code IS NOT NULL ORDER BY canonical_code');
    const byAW = new Map(items.map(i => [i.canonical_code, i]));
    d.missingAWCodes = awCodes.filter(code => !byAW.has(code));
    for (const l of source.links) {
      const r = source.records.find(r => r.code === l.clauseCode);
      if (!r || !awCodes.includes(l.awCode) || !byAW.has(l.awCode)) d.orphanLinks.push(`${l.awCode} → ${l.clauseCode} : référence absente.`);
      if (r?.scope === 'base' || l.clauseCode.startsWith('BASE-')) d.baseCatalogLinks.push(`${l.awCode} → ${l.clauseCode}`);
      if (byAW.has(l.awCode) && byAW.get(l.awCode)!.status !== 'active') d.sourceAnomalies.push(`${l.awCode} : référence archivée/inactive, accord nécessaire.`);
      if (!Number.isInteger(l.sortOrder)) d.sourceAnomalies.push(`${l.awCode} → ${l.clauseCode} : ordre invalide.`);
    }
    const dormantCodes = source.records.filter(r => r.scope === 'catalog' && !source.links.some(l => l.clauseCode === r.code)).map(r => r.code).sort();
    sourceCheck(hash(dormantCodes) === hash(manifest.dormantCodes), 'Clause catalogue sans déclencheur ou LANDING-GESTION liée.');
    const payloadSha256 = hash({source,manifest}), manifestSha256 = hash(manifest);
    const terms = new ContractTermsService(this.database);
    const rows: ContractLibraryImportRow[] = source.records.map(r => {
      const template = this.database.get<{id:string}>('SELECT id FROM contract_clause_templates WHERE code=? COLLATE NOCASE',[r.code]);
      let action: ContractLibraryImportRow['action'] = template ? 'conflict' : 'create', anomaly: string | null = null;
      if (template) {
        const t = terms.getTemplate(template.id);
        const entry = this.database.get<{version_id:string;source_record_sha256:string;payload_sha256:string}>('SELECT e.version_id,e.source_record_sha256,r.payload_sha256 FROM contract_library_import_entries e JOIN contract_library_import_runs r ON r.id=e.run_id WHERE e.clause_id=?',[t.id]);
        const expectedLinks = source.links.filter(l => l.clauseCode === r.code).map(l => ({catalog_item_id:byAW.get(l.awCode)?.id ?? null,sort_order:l.sortOrder})).sort((a,b) => String(a.catalog_item_id).localeCompare(String(b.catalog_item_id)));
        const actualLinks = this.database.all('SELECT catalog_item_id,sort_order FROM catalog_contract_clause_links WHERE clause_id=?',[t.id]).sort((a,b) => String(a.catalog_item_id).localeCompare(String(b.catalog_item_id)));
        const recordHash = hash({record:r,links:source.links.filter(l => l.clauseCode === r.code)});
        const v = t.versions.find(v => v.id === entry?.version_id);
        if (entry && entry.payload_sha256 === payloadSha256 && entry.source_record_sha256 === recordHash && t.code === r.code && t.title === r.title && t.scope === r.scope && t.audience === r.audience && t.sortOrder === r.sortOrder && t.status === 'active' && t.currentVersionId === null && t.versions.length === 1 && v?.status === 'draft' && v.versionNumber === 1 && v.publishedAt === null && v.body === r.body && hash(v.review) === hash(r.review) && hash(expectedLinks) === hash(actualLinks)) action = 'keep';
        else anomaly = `${r.code} : code existant sans provenance identique ou modifié ; aucun rapprochement/écrasement automatique.`;
      }
      return {code:r.code,scope:r.scope,audience:r.audience,version:1,state:'draft',action,links:source.links.filter(l => l.clauseCode === r.code).length,review:r.review.level,source:r.review.provenance.bodyCell,anomaly};
    });
    const counts = {clausesToCreate:rows.filter(r => r.action === 'create').length,versionsToCreate:rows.filter(r => r.action === 'create').length,linksToCreate:rows.filter(r => r.action === 'create').reduce((n,r) => n+r.links,0),clausesKept:rows.filter(r => r.action === 'keep').length,linksKept:rows.filter(r => r.action === 'keep').reduce((n,r) => n+r.links,0),conflicts:rows.filter(r => r.action === 'conflict').length};
    const anomalies = [...Object.values(d).flat(),...rows.flatMap(r => r.anomaly ? [r.anomaly] : [])];
    const state = ['catalog_items','catalog_versions','contract_clause_templates','contract_clause_versions','catalog_contract_clause_links','contract_library_import_runs','contract_library_import_entries'].map(table => ({table,rows:this.database.all(`SELECT * FROM ${table} ORDER BY rowid`)}));
    return {planSha256:hash({payloadSha256,rows,diagnostics:d,state}),payloadSha256,manifestSha256,sourceSha256:source.source.sha256,rows,diagnostics:d,counts,anomalies,scopes,audiences,editorial,reviews,dormantCodes};
  }

  apply(source: ContractLibrarySource, manifest: ContractLibraryManifest, expectedPlanSha256: string): ContractLibraryImportPlan {
    this.database.exec('BEGIN IMMEDIATE;');
    try {
      const plan = this.simulate(source,manifest);
      if (plan.planSha256 !== expectedPlanSha256) throw Error('Plan contractuel périmé : nouveau dry-run et accord nécessaires.');
      if (plan.anomalies.length) throw Error(`Import contractuel refusé : ${plan.anomalies.join(' ; ')}`);
      if (!plan.counts.clausesToCreate) { this.database.exec('COMMIT;'); return plan; }
      const now = new Date().toISOString(), runId = randomUUID();
      this.database.run('INSERT INTO contract_library_import_runs (id,payload_sha256,source_reference,source_sha256,manifest_sha256,document_sources_json,summary_json,created_at) VALUES (?,?,?,?,?,?,?,?)',[runId,plan.payloadSha256,source.source.reference,plan.sourceSha256,plan.manifestSha256,JSON.stringify(source.source.documents),JSON.stringify(plan.counts),now]);
      const terms = new ContractTermsService(this.database);
      for (const row of plan.rows.filter(r => r.action === 'create')) {
        const record = source.records.find(r => r.code === row.code)!;
        const t = terms.createTemplate({code:record.code,title:record.title,scope:record.scope,audience:record.audience,sortOrder:record.sortOrder},{body:record.body,review:record.review});
        const links = source.links.filter(l => l.clauseCode === record.code);
        const resolvedLinks = links.map(l => {
          const item = this.database.get<{id:string}>('SELECT id FROM catalog_items WHERE canonical_code=?',[l.awCode]);
          if (!item) throw Error(`Référence AW absente : ${l.awCode}`);
          this.database.run('INSERT INTO catalog_contract_clause_links (catalog_item_id,clause_id,sort_order,created_at) VALUES (?,?,?,?)',[item.id,t.id,l.sortOrder,now]);
          return {...l,catalogItemId:item.id};
        });
        if (t.currentVersionId !== null || t.versions.length !== 1 || t.versions[0].status !== 'draft' || t.versions[0].body !== record.body) throw Error(`Brouillon exact non conservé : ${record.code}`);
        this.database.run('INSERT INTO contract_library_import_entries (run_id,clause_code,clause_id,version_id,source_record_sha256,catalog_links_json) VALUES (?,?,?,?,?,?)',[runId,record.code,t.id,t.versions[0].id,hash({record,links}),JSON.stringify(resolvedLinks)]);
      }
      this.database.run('INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,?,?)',['contract_library',runId,'contract_library_v1_imported','Bibliothèque contractuelle V1 importée uniquement en brouillon.',JSON.stringify({source:source.source,counts:plan.counts}),now]);
      const replay = this.simulate(source,manifest);
      if (replay.anomalies.length || replay.counts.clausesToCreate || replay.counts.conflicts || replay.counts.clausesKept !== 118 || replay.counts.linksKept !== 409) throw Error('Contrôle post-import contractuel non conforme ; rollback complet.');
      this.database.exec('COMMIT;'); return plan;
    } catch (error) { this.database.exec('ROLLBACK;'); throw error; }
  }
}
