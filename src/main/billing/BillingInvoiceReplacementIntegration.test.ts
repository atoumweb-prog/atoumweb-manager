import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { CrmService } from '../crm/CrmService';
import { ClientDocumentService } from '../crm/ClientDocumentService';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { createWorkspacePaths } from '../workspace';
import { BillingHandoffService } from './BillingHandoffService';

describe('09B — remplacement de facture Abby sur vrai workspace temporaire', () => {
  const roots: string[] = [];
  afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
  });

  it('conserve les octets et la trace de la facture précédente et refuse une nouvelle pièce altérée', () => {
    const root = mkdtempSync(join(tmpdir(), 'atoumweb-09b-invoice-'));
    roots.push(root);
    const db = new NodeSqliteAdapter(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    try {
      applyPendingMigrations(db);
      const crm = new CrmService(db);
      const org = crm.createOrganization({ name: 'Client facture TEST' });
      const clientId = crm.createClient({ organizationId: org.id }).id;
      const docs = new ClientDocumentService(db, createWorkspacePaths(root));
      const billing = new BillingHandoffService(db, (id) => docs.fingerprint(id));
      const now = '2026-10-14T10:00:00.000Z';
      db.run(
        `INSERT INTO billing_items
         (id,client_account_id,source_type,source_id,source_key,description,expected_amount_cents,theoretical_value_cents,status,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        ['item-09b', clientId, 'other', 'origin-09b', 'other:origin-09b',
          'Facture Abby test', 4900, 4900, 'ready', now, now],
      );
      const sourceA = join(root, 'abby-original.pdf');
      const sourceB = join(root, 'abby-revised.pdf');
      writeFileSync(sourceA, '%PDF-1.4\nOriginal Abby');
      writeFileSync(sourceB, '%PDF-1.4\nRévision Abby');
      const original = docs.importPaths(clientId, [sourceA], { category: 'invoice', title: 'Abby originale' })[0];
      const revised = docs.importPaths(clientId, [sourceB], { category: 'invoice', title: 'Abby révisée' })
        .find((doc) => doc.id !== original.id)!;
      billing.attachInvoice('item-09b', original.id, { reference: 'ABBY-1' });
      const originalBytes = readFileSync(docs.absolutePath(original.id));
      billing.attachInvoice('item-09b', revised.id, { reference: 'ABBY-2' });
      expect(billing.get('item-09b')).toMatchObject({ status: 'invoiced', invoiceDocumentId: revised.id });
      expect(readFileSync(docs.absolutePath(original.id))).toEqual(originalBytes);
      expect(() => docs.deletePermanently(original.id)).toThrow(/historique de facturation Abby/);
      expect(() => docs.update(original.id, { category: 'other', title: 'Reclassement interdit' }))
        .toThrow(/doit rester classée dans Factures/);
      expect(() => docs.update(revised.id, { category: 'other', title: 'Reclassement interdit' }))
        .toThrow(/doit rester classée dans Factures/);
      expect(docs.get(original.id).category).toBe('invoice');
      expect(docs.get(revised.id).category).toBe('invoice');
      const history = db.all<{ action: string; metadata_json: string }>(
        "SELECT action,metadata_json FROM activity_log WHERE entity_type='billing_item' AND entity_id=? AND action='billing_invoice_replaced'",
        ['item-09b'],
      );
      expect(history).toHaveLength(1);
      expect(JSON.parse(history[0].metadata_json)).toMatchObject({
        previousDocumentId: original.id, currentDocumentId: revised.id,
      });
      writeFileSync(docs.absolutePath(original.id), '%PDF-1.4\nDocument ancien altéré');
      expect(() => docs.verifiedPath(original.id)).toThrow(/empreinte SHA-256 différente/);
      const sourceC = join(root, 'abby-tampered.pdf');
      writeFileSync(sourceC, '%PDF-1.4\nFacture 3');
      const bad = docs.importPaths(clientId, [sourceC], { category: 'invoice', title: 'Document altéré' })
        .find((doc) => doc.id !== original.id && doc.id !== revised.id)!;
      writeFileSync(docs.absolutePath(bad.id), '%PDF-1.4\nModifiée après import');
      expect(() => billing.attachInvoice('item-09b', bad.id)).toThrow(/empreinte SHA-256 différente/);
      expect(billing.get('item-09b').invoiceDocumentId).toBe(revised.id);
      const fakePdf = join(root, 'abby-not-a-pdf.pdf');
      writeFileSync(fakePdf, 'This is not a PDF despite the filename.');
      const invalid = docs.importPaths(clientId, [fakePdf], { category: 'invoice', title: 'Fausse facture' })
        .find((doc) => doc.id !== original.id && doc.id !== revised.id && doc.id !== bad.id)!;
      expect(() => billing.attachInvoice('item-09b', invalid.id)).toThrow(/signature PDF absente/);
      expect(() => docs.verifiedPath(invalid.id)).toThrow(/signature PDF absente/);
      expect(billing.get('item-09b').invoiceDocumentId).toBe(revised.id);
      expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
    } finally {
      db.close();
    }
  });
});
