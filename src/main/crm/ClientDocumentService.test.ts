import { QuoteContractPreparationService } from '../commercial/QuoteContractPreparationService';
import { ContractTermsService } from '../commercial/ContractTermsService';
import { finalizeForTest, acceptForTest } from '../testSupport/quotePreparationFixture';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { QuoteService } from '../commercial/QuoteService';
import { createWorkspacePaths } from '../workspace';
import { CrmService } from './CrmService';
import { ClientDocumentService } from './ClientDocumentService';

let database: NodeSqliteAdapter;
let documents: ClientDocumentService;
let quotes: QuoteService;
let root: string;
let quoteId: string;
let clientId: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'atoumweb-contract-proof-'));
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys=ON;');
  applyPendingMigrations(database);
  const crm = new CrmService(database);

  documents = new ClientDocumentService(database, createWorkspacePaths(root));
  quotes = new QuoteService(database, crm,new ContractTermsService(database,documents),new QuoteContractPreparationService(database,documents));
  const org = crm.createOrganization({ name: 'Preuve contractuelle' });
  const prospect = crm.createProspect({ organizationId: org.id, primaryNeed: 'Site' });
  quoteId = quotes.create({ prospectId: prospect.id, subject: 'PDF accepté' }).id;
  quotes.addCustomLine(quoteId, { label: 'Site', proposedUnitPriceCents: 10000 });
  finalizeForTest(database,quotes,quoteId);
  quotes.markSent(quoteId);
  clientId = acceptForTest(database,quotes,quoteId).acceptedClientAccountId!;
});

afterEach(() => {
  database.close();
  const target = resolve(root);
  if (!target.startsWith(resolve(tmpdir()) + sep) || !target.includes('atoumweb-contract-proof-')) throw new Error('Chemin temporaire invalide');
  rmSync(target, { recursive: true, force: true });
});

function importPdf(category: 'contract' | 'quote' = 'contract') {
  const source = join(root, 'preuve.pdf');
  writeFileSync(source, '%PDF-1.4\nPreuve de recette isolée');
  return documents.importPaths(clientId, [source], { category, title: 'PDF accepté' })[0];
}

describe('preuve contractuelle rattachée', () => {
  it.each(['contract', 'quote'] as const)('empêche la suppression avant toute écriture disque/base, même archivé (%s)', (category) => {
    const doc = importPdf(category);
    const path = documents.absolutePath(doc);
    const bytes = readFileSync(path);
    quotes.attachContractDocument(quoteId, doc.id);
    const attached = quotes.get(quoteId);
    expect(() => documents.deletePermanently(doc.id)).toThrow(/preuve contractuelle/);
    documents.archive(doc.id);
    expect(() => documents.deletePermanently(doc.id)).toThrow(/preuve contractuelle/);
    expect(readFileSync(path)).toEqual(bytes);
    expect(documents.get(doc.id).archivedAt).toBeTruthy();
    expect(documents.get(doc.id).missing).toBe(false);
    expect(quotes.get(quoteId).contractDocumentId).toBe(doc.id);
    expect(quotes.get(quoteId).contractDocumentAttachedAt).toBe(attached.contractDocumentAttachedAt);
    documents.archive(doc.id, false);
    expect(documents.list(clientId).some((item) => item.id === doc.id)).toBe(true);
    expect(database.all('PRAGMA foreign_key_check')).toEqual([]);
  });

  it('interdit de supprimer une facture rattachée à la facturation, même archivée', () => {
    const source = join(root, 'facture.pdf');
    writeFileSync(source, '%PDF-1.4\\nFacture fictive de recette');
    const doc = documents.importPaths(clientId, [source], { category: 'invoice', title: 'Facture test' })[0];
    const path = documents.absolutePath(doc);
    const bytes = readFileSync(path);
    const now = new Date().toISOString();
    database.run(
      "INSERT INTO billing_items (id,client_account_id,source_type,source_id,source_key,description,expected_amount_cents,theoretical_value_cents,status,invoice_document_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
      ['lot09-linked-bill', clientId, 'other', 'lot09-test', 'lot09-test-invoice', 'Facture fictive', 10000, 10000, 'invoiced', doc.id, now, now],
    );
    expect(() => documents.deletePermanently(doc.id)).toThrow(/facture PDF.*rattachée/);
    documents.archive(doc.id);
    expect(() => documents.deletePermanently(doc.id)).toThrow(/facture PDF.*rattachée/);
    expect(readFileSync(path)).toEqual(bytes);
    expect(documents.get(doc.id).missing).toBe(false);
    expect(database.all('PRAGMA foreign_key_check')).toEqual([]);
  });

  it('conserve la suppression explicite d’un document sans rattachement contractuel', () => {
    const doc = importPdf();
    const path = documents.absolutePath(doc);
    documents.deletePermanently(doc.id);
    expect(existsSync(path)).toBe(false);
    expect(() => documents.get(doc.id)).toThrow(/introuvable/);
  });

  it('conserve une ancienne facture Abby remplacée même si elle est archivée', () => {
    const source = join(root, 'ancienne-facture.pdf');
    writeFileSync(source, '%PDF-1.4\\nFacture historique fictive');
    const doc = documents.importPaths(clientId, [source], { category: 'invoice', title: 'Ancienne facture' })[0];
    const path = documents.absolutePath(doc);
    const bytes = readFileSync(path);
    const now = new Date().toISOString();
    database.run(
      "INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,?,?)",
      ['billing_item', 'billing-history-test', 'billing_invoice_replaced', 'Remplacement Abby',
        JSON.stringify({ previousDocumentId: doc.id, currentDocumentId: 'new-invoice-id' }), now],
    );
    documents.archive(doc.id);
    expect(() => documents.deletePermanently(doc.id)).toThrow(/historique de facturation Abby/);
    expect(readFileSync(path)).toEqual(bytes);
    expect(documents.get(doc.id).archivedAt).toBeTruthy();
    expect(database.all('PRAGMA foreign_key_check')).toEqual([]);
  });

});
