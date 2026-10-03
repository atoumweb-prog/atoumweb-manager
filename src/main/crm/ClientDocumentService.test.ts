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
  quotes = new QuoteService(database, crm);
  documents = new ClientDocumentService(database, createWorkspacePaths(root));
  const org = crm.createOrganization({ name: 'Preuve contractuelle' });
  const prospect = crm.createProspect({ organizationId: org.id, primaryNeed: 'Site' });
  quoteId = quotes.create({ prospectId: prospect.id, subject: 'PDF accepté' }).id;
  quotes.addCustomLine(quoteId, { label: 'Site', proposedUnitPriceCents: 10000 });
  quotes.finalize(quoteId);
  quotes.markSent(quoteId);
  clientId = quotes.accept(quoteId).acceptedClientAccountId!;
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

  it('conserve la suppression explicite d’un document sans rattachement contractuel', () => {
    const doc = importPdf();
    const path = documents.absolutePath(doc);
    documents.deletePermanently(doc.id);
    expect(existsSync(path)).toBe(false);
    expect(() => documents.get(doc.id)).toThrow(/introuvable/);
  });
});
