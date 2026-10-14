import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CrmService } from '../crm/CrmService';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { HourPackService } from '../operations/HourPackService';
import { BillingHandoffService } from './BillingHandoffService';

describe('BillingHandoffService', () => {
  let database: NodeSqliteAdapter;
  let billing: BillingHandoffService;
  let clientId: string;

  beforeEach(() => {
    database = new NodeSqliteAdapter(':memory:');
    database.exec('PRAGMA foreign_keys = ON;');
    applyPendingMigrations(database);
    const crm = new CrmService(database);
    const organization = crm.createOrganization({ name: 'Client Facturation' });
    clientId = crm.createClient({ organizationId: organization.id }).id;
    billing = new BillingHandoffService(database);
  });

  afterEach(() => database.close());

  it('impose une facture PDF pour passer un élément à Facturé', () => {
    const packs = new HourPackService(database);
    const pack = packs.create({
      clientAccountId: clientId,
      name: 'Forfait 10 h',
      purchasedSeconds: 10 * 3600,
      contractPriceCents: 69000,
    });
    const item = billing.ensureForHourPack(pack.id);
    expect(item.status).toBe('ready');
    expect(() => billing.changeStatus(item.id, 'invoiced')).toThrow(/facture PDF/i);

    const now = '2026-09-23T12:00:00.000Z';
    database.run(
      `INSERT INTO client_documents
       (id,client_account_id,category,title,original_name,relative_path,mime_type,size_bytes,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      ['invoice-doc', clientId, 'invoice', 'Facture FA-2026-001', 'FA-2026-001.pdf', 'Clients/test/Documents/03 Factures/FA-2026-001.pdf', 'application/pdf', 1200, now, now],
    );

    const invoiced = billing.attachInvoice(item.id, 'invoice-doc', {
      reference: 'FA-2026-001',
      invoicedAt: now,
    });

    expect(invoiced).toMatchObject({
      status: 'invoiced',
      invoiceDocumentId: 'invoice-doc',
      invoiceReference: 'FA-2026-001',
      invoiceFileName: 'FA-2026-001.pdf',
      invoicedAt: now,
    });
    expect(() => billing.changeStatus(item.id, 'ready')).toThrow(/déjà rattachée/i);
  });

  it('met à jour la référence et la date sans perdre le PDF rattaché', () => {
    database.run(
      `INSERT INTO billing_items
       (id,client_account_id,source_type,source_id,source_key,description,expected_amount_cents,theoretical_value_cents,status,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      ['billing-1', clientId, 'other', 'source-1', 'other:source-1', 'Prestation test', 10000, 10000, 'ready', '2026-09-23T08:00:00.000Z', '2026-09-23T08:00:00.000Z'],
    );
    database.run(
      `INSERT INTO client_documents
       (id,client_account_id,category,title,original_name,relative_path,mime_type,size_bytes,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      ['invoice-doc-2', clientId, 'invoice', 'Facture', 'facture.pdf', 'Clients/test/Documents/03 Factures/facture.pdf', 'application/pdf', 1000, '2026-09-23T09:00:00.000Z', '2026-09-23T09:00:00.000Z'],
    );

    billing.attachInvoice('billing-1', 'invoice-doc-2', { reference: 'FA-1', invoicedAt: '2026-09-23T10:00:00.000Z' });
    const updated = billing.updateInvoiceMetadata('billing-1', { reference: 'FA-2', invoicedAt: '2026-09-24T10:00:00.000Z' });

    expect(updated.invoiceDocumentId).toBe('invoice-doc-2');
    expect(updated.invoiceReference).toBe('FA-2');
    expect(updated.invoicedAt).toBe('2026-09-24T10:00:00.000Z');
    expect(updated.status).toBe('invoiced');
  });

  it('refuse une facture d’un autre client ou archivée sans modifier la préparation', () => {
    const crm = new CrmService(database);
    const other = crm.createOrganization({ name: 'Autre client' });
    const otherId = crm.createClient({ organizationId: other.id }).id;
    const now = '2026-10-14T10:00:00.000Z';
    database.run(
      `INSERT INTO billing_items
       (id,client_account_id,source_type,source_id,source_key,description,expected_amount_cents,theoretical_value_cents,status,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      ['billing-isolated', clientId, 'other', 'source-isolated', 'other:source-isolated', 'Prestation à facturer', 9900, 9900, 'ready', now, now],
    );
    const insertDocument = (id: string, owner: string, archivedAt: string | null, category: 'invoice' | 'contract' = 'invoice') => database.run(
      `INSERT INTO client_documents
       (id,client_account_id,category,title,original_name,relative_path,mime_type,size_bytes,archived_at,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [id, owner, category, 'Facture', id + '.pdf', 'Clients/test/Documents/03 Factures/' + id + '.pdf', 'application/pdf', 1200, archivedAt, now, now],
    );
    insertDocument('invoice-foreign', otherId, null);
    insertDocument('invoice-archived', clientId, now);
    insertDocument('document-contract', clientId, null, 'contract');
    expect(() => billing.attachInvoice('billing-isolated', 'invoice-foreign')).toThrow(/autre client/);
    expect(() => billing.attachInvoice('billing-isolated', 'document-contract')).toThrow(/catégorie Factures/);
    expect(() => billing.attachInvoice('billing-isolated', 'invoice-archived')).toThrow(/Restaure/);
    expect(billing.get('billing-isolated')).toMatchObject({
      status: 'ready', invoiceDocumentId: null, invoiceReference: null,
    });
  });


  it('conserve dans le journal les deux références documentaires lors du remplacement Abby', () => {
    const now = '2026-10-14T10:00:00.000Z';
    database.run(
      `INSERT INTO billing_items
       (id,client_account_id,source_type,source_id,source_key,description,expected_amount_cents,theoretical_value_cents,status,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      ['billing-replacement', clientId, 'other', 'source-replacement', 'other:source-replacement',
        'Facture remplacée', 10000, 10000, 'ready', now, now],
    );
    for (const id of ['abby-original', 'abby-corrected']) {
      database.run(
        `INSERT INTO client_documents
         (id,client_account_id,category,title,original_name,relative_path,mime_type,size_bytes,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [id, clientId, 'invoice', id, id + '.pdf', 'Clients/test/Documents/03 Factures/' + id + '.pdf',
          'application/pdf', 1000, now, now],
      );
    }
    billing.attachInvoice('billing-replacement', 'abby-original', { reference: 'ABBY-1' });
    billing.attachInvoice('billing-replacement', 'abby-corrected', { reference: 'ABBY-2' });
    const history = database.all<{ action: string; metadata_json: string }>(
      "SELECT action,metadata_json FROM activity_log WHERE entity_type='billing_item' AND entity_id=? AND action IN ('billing_invoice_attached','billing_invoice_replaced') ORDER BY id",
      ['billing-replacement'],
    );
    expect(history.map((entry) => entry.action)).toEqual(['billing_invoice_attached', 'billing_invoice_replaced']);
    const replacement = JSON.parse(history[1].metadata_json) as {
      previousDocumentId: string; currentDocumentId: string; previousReference: string; currentReference: string;
    };
    expect(replacement).toMatchObject({
      previousDocumentId: 'abby-original', currentDocumentId: 'abby-corrected',
      previousReference: 'ABBY-1', currentReference: 'ABBY-2',
    });
    expect(billing.get('billing-replacement')).toMatchObject({
      status: 'invoiced', invoiceDocumentId: 'abby-corrected', invoiceReference: 'ABBY-2',
    });
    expect(database.get<{ id: string }>('SELECT id FROM client_documents WHERE id=?', ['abby-original'])?.id).toBe('abby-original');
  });

  it('refuse une facture dont la vérification physique échoue avant tout rattachement', () => {
    const now = '2026-10-14T11:00:00.000Z';
    database.run(
      `INSERT INTO billing_items
       (id,client_account_id,source_type,source_id,source_key,description,expected_amount_cents,theoretical_value_cents,status,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      ['billing-unverified', clientId, 'other', 'source-unverified', 'other:source-unverified', 'Facture à vérifier', 5000, 5000, 'ready', now, now],
    );
    database.run(
      `INSERT INTO client_documents
       (id,client_account_id,category,title,original_name,relative_path,mime_type,size_bytes,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      ['invoice-unverified', clientId, 'invoice', 'Facture', 'invoice.pdf',
        'Clients/test/Documents/03 Factures/invoice.pdf', 'application/pdf', 100, now, now],
    );
    const secured = new BillingHandoffService(database, () => { throw new Error('Document modifié : empreinte SHA-256 différente'); });
    expect(() => secured.attachInvoice('billing-unverified', 'invoice-unverified')).toThrow(/empreinte SHA-256 différente/);
    expect(billing.get('billing-unverified')).toMatchObject({ status: 'ready', invoiceDocumentId: null });
    expect(database.get<{ count: number }>(
      "SELECT COUNT(*) AS count FROM activity_log WHERE entity_id=? AND action='billing_invoice_attached'",
      ['billing-unverified'],
    )?.count).toBe(0);
  });


  it('annule intégralement le rattachement si la journalisation échoue', () => {
    const now = '2026-10-14T12:00:00.000Z';
    database.run(
      `INSERT INTO billing_items
       (id,client_account_id,source_type,source_id,source_key,description,expected_amount_cents,theoretical_value_cents,status,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      ['billing-atomic', clientId, 'other', 'source-atomic', 'other:source-atomic', 'Facture atomique', 10000, 10000, 'ready', now, now],
    );
    database.run(
      `INSERT INTO client_documents
       (id,client_account_id,category,title,original_name,relative_path,mime_type,size_bytes,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      ['invoice-atomic', clientId, 'invoice', 'Facture', 'atomic.pdf',
        'Clients/test/Documents/03 Factures/atomic.pdf', 'application/pdf', 100, now, now],
    );
    database.exec(`CREATE TRIGGER fail_billing_activity BEFORE INSERT ON activity_log
      WHEN NEW.entity_type='billing_item' AND NEW.entity_id='billing-atomic'
      BEGIN SELECT RAISE(ABORT, 'journal volontairement indisponible'); END;`);
    expect(() => billing.attachInvoice('billing-atomic', 'invoice-atomic')).toThrow(/journal volontairement indisponible/);
    expect(billing.get('billing-atomic')).toMatchObject({
      status: 'ready', invoiceDocumentId: null, invoiceReference: null, updatedAt: now,
    });
    expect(database.all('PRAGMA foreign_key_check')).toEqual([]);
  });


  it('ne crée pas de faux remplacement lorsqu’un même PDF Abby est rattaché deux fois', () => {
    const now = '2026-10-14T12:00:00.000Z';
    database.run(
      `INSERT INTO billing_items
       (id,client_account_id,source_type,source_id,source_key,description,expected_amount_cents,theoretical_value_cents,status,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      ['billing-repeat', clientId, 'other', 'source-repeat', 'other:source-repeat', 'Facture répétée', 4000, 4000, 'ready', now, now],
    );
    database.run(
      `INSERT INTO client_documents
       (id,client_account_id,category,title,original_name,relative_path,mime_type,size_bytes,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      ['invoice-repeat', clientId, 'invoice', 'Facture', 'repeat.pdf',
        'Clients/test/Documents/03 Factures/repeat.pdf', 'application/pdf', 100, now, now],
    );
    const first = billing.attachInvoice('billing-repeat', 'invoice-repeat', { reference: 'ABBY-REPEAT', invoicedAt: now });
    const repeat = billing.attachInvoice('billing-repeat', 'invoice-repeat');
    expect(repeat).toEqual(first);
    const events = database.all<{ action: string }>(
      "SELECT action FROM activity_log WHERE entity_type='billing_item' AND entity_id=? AND action LIKE 'billing_invoice_%'",
      ['billing-repeat'],
    );
    expect(events.map((event) => event.action)).toEqual(['billing_invoice_attached']);
    const revised = billing.attachInvoice('billing-repeat', 'invoice-repeat', { reference: 'ABBY-REPEAT-REV' });
    expect(revised.invoiceReference).toBe('ABBY-REPEAT-REV');
    const afterMetadata = database.all<{ action: string }>(
      "SELECT action FROM activity_log WHERE entity_type='billing_item' AND entity_id=? AND action LIKE 'billing_invoice_%' ORDER BY id",
      ['billing-repeat'],
    );
    expect(afterMetadata.map((event) => event.action)).toEqual([
      'billing_invoice_attached', 'billing_invoice_metadata_updated',
    ]);
    expect(billing.updateInvoiceMetadata('billing-repeat', {})).toMatchObject({ invoiceReference: 'ABBY-REPEAT-REV' });
    const trace = database.get<{ metadata_json: string }>(
      "SELECT metadata_json FROM activity_log WHERE entity_id=? AND action='billing_invoice_metadata_updated' ORDER BY id DESC LIMIT 1",
      ['billing-repeat'],
    );
    expect(JSON.parse(trace!.metadata_json)).toMatchObject({
      documentId: 'invoice-repeat', previousReference: 'ABBY-REPEAT', currentReference: 'ABBY-REPEAT-REV',
    });
    const eventCount = database.get<{ n: number }>(
      "SELECT COUNT(*) AS n FROM activity_log WHERE entity_id=? AND action='billing_invoice_metadata_updated'",
      ['billing-repeat'],
    );
    expect(eventCount?.n).toBe(1);
  });


  it('annule la modification des métadonnées si son historique ne peut pas être écrit', () => {
    const now = '2026-10-14T14:00:00.000Z';
    database.run(
      `INSERT INTO billing_items
       (id,client_account_id,source_type,source_id,source_key,description,expected_amount_cents,theoretical_value_cents,status,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      ['billing-meta-atomic', clientId, 'other', 'source-meta-atomic', 'other:source-meta-atomic',
        'Facture avec métadonnées', 7000, 7000, 'ready', now, now],
    );
    database.run(
      `INSERT INTO client_documents
       (id,client_account_id,category,title,original_name,relative_path,mime_type,size_bytes,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      ['invoice-meta-atomic', clientId, 'invoice', 'Facture', 'meta.pdf',
        'Clients/test/Documents/03 Factures/meta.pdf', 'application/pdf', 100, now, now],
    );
    billing.attachInvoice('billing-meta-atomic', 'invoice-meta-atomic',
      { reference: 'ABBY-ORIGINAL', invoicedAt: now });
    const before = billing.get('billing-meta-atomic');
    database.exec(`CREATE TRIGGER fail_metadata_audit BEFORE INSERT ON activity_log
      WHEN NEW.action='billing_invoice_metadata_updated' AND NEW.entity_id='billing-meta-atomic'
      BEGIN SELECT RAISE(ABORT, 'historique de métadonnées indisponible'); END;`);
    expect(() => billing.updateInvoiceMetadata('billing-meta-atomic',
      { reference: 'ABBY-CHANGED', invoicedAt: '2026-10-15T14:00:00.000Z' }))
      .toThrow(/historique de métadonnées indisponible/);
    expect(billing.get('billing-meta-atomic')).toEqual(before);
    expect(database.get<{ n: number }>(
      "SELECT COUNT(*) AS n FROM activity_log WHERE entity_id=? AND action='billing_invoice_metadata_updated'",
      ['billing-meta-atomic'],
    )?.n).toBe(0);
    expect(database.all('PRAGMA foreign_key_check')).toEqual([]);
  });


  it('refuse une pièce image classée à tort comme facture Abby', () => {
    const now='2026-10-14T14:00:00.000Z';
    database.run(
      `INSERT INTO billing_items
       (id,client_account_id,source_type,source_id,source_key,description,expected_amount_cents,theoretical_value_cents,status,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      ['billing-wrongmime',clientId,'other','source-wrongmime','other:source-wrongmime','Facture invalide',3300,3300,'ready',now,now],
    );
    database.run(
      `INSERT INTO client_documents
       (id,client_account_id,category,title,original_name,relative_path,mime_type,size_bytes,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      ['invoice-wrongmime',clientId,'invoice','Fausse facture','facture.png','Clients/test/Documents/03 Factures/facture.png','image/png',100,now,now],
    );
    expect(() => billing.attachInvoice('billing-wrongmime','invoice-wrongmime')).toThrow(/Seuls les fichiers PDF/);
    expect(billing.get('billing-wrongmime')).toMatchObject({status:'ready',invoiceDocumentId:null});
  });


  it('refuse le rapprochement implicite d’une facture Abby avec deux sources', () => {
    const now='2026-10-14T14:00:00.000Z';
    for (const id of ['bill-source-a','bill-source-b']) {
      database.run(
        `INSERT INTO billing_items
         (id,client_account_id,source_type,source_id,source_key,description,expected_amount_cents,theoretical_value_cents,status,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [id,clientId,'other',id,'other:'+id,id,1000,1000,'ready',now,now],
      );
    }
    for (const id of ['abby-shared-a','abby-shared-b']) {
      database.run(
        `INSERT INTO client_documents
         (id,client_account_id,category,title,original_name,relative_path,mime_type,size_bytes,sha256,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [id,clientId,'invoice','Facture partagée',id+'.pdf',
          'Clients/test/Documents/03 Factures/'+id+'.pdf','application/pdf',100,'a'.repeat(64),now,now],
      );
    }
    billing.attachInvoice('bill-source-a','abby-shared-a',{reference:'ABBY-MULTI'});
    expect(() => billing.attachInvoice('bill-source-b','abby-shared-a')).toThrow(/déjà associée à un autre élément/);
    expect(() => billing.attachInvoice('bill-source-b','abby-shared-b')).toThrow(/PDF Abby identique/);
    expect(billing.get('bill-source-a')).toMatchObject({status:'invoiced',invoiceDocumentId:'abby-shared-a'});
    expect(billing.get('bill-source-b')).toMatchObject({status:'ready',invoiceDocumentId:null});
    expect(database.all('PRAGMA foreign_key_check')).toEqual([]);
  });

});
