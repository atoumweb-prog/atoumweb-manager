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
    const insertDocument = (id: string, owner: string, archivedAt: string | null) => database.run(
      `INSERT INTO client_documents
       (id,client_account_id,category,title,original_name,relative_path,mime_type,size_bytes,archived_at,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [id, owner, 'invoice', 'Facture', id + '.pdf', 'Clients/test/Documents/03 Factures/' + id + '.pdf', 'application/pdf', 1200, archivedAt, now, now],
    );
    insertDocument('invoice-foreign', otherId, null);
    insertDocument('invoice-archived', clientId, now);
    expect(() => billing.attachInvoice('billing-isolated', 'invoice-foreign')).toThrow(/autre client/);
    expect(() => billing.attachInvoice('billing-isolated', 'invoice-archived')).toThrow(/Restaure/);
    expect(billing.get('billing-isolated')).toMatchObject({
      status: 'ready', invoiceDocumentId: null, invoiceReference: null,
    });
  });

});
