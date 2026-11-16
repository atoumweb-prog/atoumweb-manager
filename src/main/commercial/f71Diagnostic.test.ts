import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { ApprovedPackService } from './ApprovedPackService';
import { CrmService } from '../crm/CrmService';
import { QuoteService } from './QuoteService';
import { ContractTermsService } from './ContractTermsService';
import { QuoteContractPreparationService } from './QuoteContractPreparationService';
import { applyStarterPublication, planStarterPublication } from './StarterOffersPublication';
import { approvedPaymentPlanForCode } from '../../shared/approvedPaymentPlans';
import { emptyAdministration } from '../../shared/quoteContractPreparation';

/**
 * F71, relevé du moteur des devis (lecture seule, opt-in) : lancé seulement avec F71_DIAG_OUT=<dossier>.
 * Base en mémoire construite par le pack approuvé (aucune base réelle). Pour chaque prestation publiée :
 * échéancier posé, clauses posées, clauses rattachées absentes, champs restés vides, clauses des options
 * suggérées qui ne viennent pas sans « comparer puis appliquer ».
 */
const OUT = process.env.F71_DIAG_OUT;

describe.skipIf(!OUT)('F71 : relevé du moteur des devis sur le catalogue approuvé', () => {
  it('écrit le relevé', { timeout: 600000 }, () => {
    // F71_DIAG_DB : copie jetable d’une base existante (le fichier source est seulement lu), sinon pack approuvé en mémoire.
    const source = process.env.F71_DIAG_DB;
    let file = ':memory:';
    if (source) { mkdirSync(OUT!, { recursive: true }); file = join(OUT!, 'copie-jetable.sqlite'); copyFileSync(source, file); }
    const db = new NodeSqliteAdapter(file); db.exec('PRAGMA foreign_keys=ON'); applyPendingMigrations(db);
    if (!source) { const pack = new ApprovedPackService(db); pack.apply(pack.simulate().planSha256); applyStarterPublication(db, planStarterPublication(db).planSha256); }
    const crm = new CrmService(db), terms = new ContractTermsService(db), preparation = new QuoteContractPreparationService(db);
    const quotes = new QuoteService(db, crm, terms, preparation);
    if (!source) {
      const admin = emptyAdministration();
      for (const key of Object.keys(admin) as (keyof typeof admin)[]) admin[key] = { state: 'filled', value: `TEST ${key}`, reason: '' };
      preparation.saveAdministration(admin);
    }

    const versions = db.all<{ vid: string; iid: string; type: string; name: string; code: string | null; price: number | null }>(
      `SELECT v.id vid, i.id iid, i.item_type type, i.name, json_extract(v.provenance_json,'$.recordKey') code, v.price_cents price
       FROM catalog_versions v JOIN catalog_items i ON i.id=v.item_id WHERE v.status='published' AND i.status='active' ORDER BY i.item_type, i.name`);
    const clauseCode = (versionId: string | null) => versionId ? db.get<{ code: string }>('SELECT t.code FROM contract_clause_versions v JOIN contract_clause_templates t ON t.id=v.clause_id WHERE v.id=?', [versionId])?.code ?? '?' : 'particulière';
    const placeholders = (text: string) => [...new Set(text.match(/\[[^\]\r\n]{4,}\]/g) ?? [])];
    const org = crm.createOrganization({ name: 'TEST F71' }).id;
    const rows: Record<string, unknown>[] = [];

    for (const v of versions) {
      for (const audience of ['professional', 'consumer'] as const) {
        const row: Record<string, unknown> = { code: v.code ?? '', name: v.name, type: v.type, audience, price: v.price };
        try {
          const prospect = crm.createProspect({ organizationId: org, primaryNeed: 'TEST F71' });
          const plan = approvedPaymentPlanForCode(v.code);
          const unit = v.price ?? 100000;
          const q = quotes.createWithLines({ prospectId: prospect.id, subject: `TEST ${v.name}`, contractAudience: audience, ...(plan ? { paymentPlan: plan.id } : {}) },
            [{ catalogVersionId: v.vid, input: { label: v.name, proposedUnitPriceCents: unit, catalogUnitPriceCents: unit } }], { applyContractTerms: true });
          const build = terms.getQuoteBuild(q.id);
          const enabled = build.clauses.filter((c) => c.enabled);
          const codes = enabled.map((c) => clauseCode(c.sourceClauseVersionId ?? null));
          const linked = db.all<{ code: string }>('SELECT t.code FROM catalog_contract_clause_links l JOIN contract_clause_templates t ON t.id=l.clause_id WHERE l.catalog_item_id=? AND t.status=\'active\'', [v.iid]).map((r) => r.code);
          row.deposit = q.depositPercent;
          row.preset = preparation.parameters(q.id)?.payment.preset ?? null;
          row.milestones = (preparation.parameters(q.id)?.payment.milestones ?? []).map((m) => m.percent).join('/');
          row.clauses = codes.length;
          row.clauseCodes = codes.join(' ');
          row.linkedMissing = linked.filter((c) => !codes.includes(c)).join(' ');
          row.emptyFields = placeholders(build.compiledText).join(' | ');
          row.emptyClauses = enabled.filter((c) => !c.body.trim()).map((c) => c.title).join(' | ');
          row.warnings = build.warnings.join(' | ');
          if (audience === 'professional') {
            const options = db.all<{ target: string; name: string; code: string | null; price: number | null; stale: string }>(
              `SELECT DISTINCT p.id target, i.name, json_extract(p.provenance_json,'$.recordKey') code, p.price_cents price, t.status stale FROM catalog_version_recommendations r
               JOIN catalog_versions t ON t.id=r.target_version_id JOIN catalog_items i ON i.id=t.item_id
               JOIN catalog_versions p ON p.item_id=i.id AND p.status='published' WHERE r.source_version_id=? ORDER BY r.sort_order`, [v.vid]);
            const optionGaps: string[] = [];
            for (const o of options) {
              const p2 = crm.createProspect({ organizationId: org, primaryNeed: 'TEST F71 option' });
              const q2 = quotes.createWithLines({ prospectId: p2.id, subject: `TEST option ${o.name}`, contractAudience: audience, ...(plan ? { paymentPlan: plan.id } : {}) },
                [{ catalogVersionId: v.vid, input: { label: v.name, proposedUnitPriceCents: unit, catalogUnitPriceCents: unit } }], { applyContractTerms: true });
              quotes.addCatalogLine(q2.id, o.target, { label: o.name, proposedUnitPriceCents: o.price ?? 10000, catalogUnitPriceCents: o.price ?? 10000 });
              const before = terms.getQuoteBuild(q2.id).clauses.filter((x) => x.enabled).length;
              const changes = terms.proposeQuoteUpdate(q2.id).changes;
              row.changeDetails = [String(row.changeDetails ?? ''), ...changes.map((c) => {
                const x = c as unknown as { before?: Record<string, unknown> | null; after?: Record<string, unknown> | null };
                const keys = Object.keys({ ...(x.before ?? {}), ...(x.after ?? {}) }).filter((k) => JSON.stringify(x.before?.[k]) !== JSON.stringify(x.after?.[k]));
                return `${o.code}: ${String(x.after?.title ?? x.before?.title ?? '?')} [${!x.before ? 'ajout' : !x.after ? 'retrait' : keys.join(',')}]`;
              })].filter(Boolean).join(' | ');
              // Même offre et même option choisies ensemble dès la création (chemin de l'assistant).
              const p3 = crm.createProspect({ organizationId: org, primaryNeed: 'TEST F71 option à la création' });
              const q3 = quotes.createWithLines({ prospectId: p3.id, subject: `TEST création ${o.name}`, contractAudience: audience, ...(plan ? { paymentPlan: plan.id } : {}) },
                [{ catalogVersionId: v.vid, input: { label: v.name, proposedUnitPriceCents: unit, catalogUnitPriceCents: unit } },
                  { catalogVersionId: o.target, input: { label: o.name, proposedUnitPriceCents: o.price ?? 10000, catalogUnitPriceCents: o.price ?? 10000 } }], { applyContractTerms: true });
              const atCreation = terms.proposeQuoteUpdate(q3.id).changes.length;
              optionGaps.push(`${o.code ?? o.name}${o.stale !== 'published' ? ' [suggestion sur version retirée]' : ''} : ajoutée après, ${changes.length} changement(s) de clauses à appliquer à la main ; choisie à la création, ${atCreation}`);
            }
            row.options = options.length;
            row.optionClausesNotAutomatic = optionGaps.join(' ');
          }
        } catch (error) {
          row.error = error instanceof Error ? error.message : String(error);
          row.stack = error instanceof Error ? (error.stack ?? '').split('\n').slice(1, 6).map((l) => l.trim()).join(' < ') : '';
        }
        rows.push(row);
      }
    }
    db.close();
    mkdirSync(OUT!, { recursive: true });
    writeFileSync(join(OUT!, source ? 'f71-releve-copie.json' : 'f71-releve.json'), JSON.stringify(rows, null, 2));
    expect(rows.length).toBeGreaterThan(0);
  });
});
