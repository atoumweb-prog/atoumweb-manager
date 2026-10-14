
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CrmService } from '../crm/CrmService';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { createWorkspacePaths } from '../workspace';
import { ExpenseService } from './ExpenseService';

describe('ExpenseService', () => {
  let database: NodeSqliteAdapter;
  let expenses: ExpenseService;
  let root: string;
  let clientId: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'atoumweb-expenses-'));
    database = new NodeSqliteAdapter(':memory:');
    database.exec('PRAGMA foreign_keys = ON;');
    applyPendingMigrations(database);
    const crm = new CrmService(database);
    const organization = crm.createOrganization({ name: 'Client Dépenses' });
    clientId = crm.createClient({ organizationId: organization.id }).id;
    expenses = new ExpenseService(database, createWorkspacePaths(root));
  });

  afterEach(() => {
    database.close();
    const target = resolve(root);
    if (!target.startsWith(resolve(tmpdir()))) throw new Error('Chemin temporaire invalide.');
    rmSync(target, { recursive: true, force: true });
  });

  it('crée une dépense récurrente et la rattache au client', () => {
    const item = expenses.create({
      clientAccountId: clientId,
      category: 'hosting',
      supplier: 'Hébergeur',
      label: 'Hébergement annuel',
      amountCents: 12000,
      vatCents: 2000,
      status: 'committed',
      expenseDate: '2026-09-23T12:00:00.000Z',
      frequency: 'yearly',
      nextDueAt: '2027-09-23T12:00:00.000Z',
    });

    expect(item).toMatchObject({
      clientAccountId: clientId,
      clientLabel: 'Client Dépenses',
      category: 'hosting',
      amountCents: 12000,
      vatCents: 2000,
      status: 'committed',
      frequency: 'yearly',
    });
    expect(expenses.list({ clientAccountId: clientId })).toHaveLength(1);
  });

  it('importe un justificatif puis marque la dépense comme payée', () => {
    const item = expenses.create({
      clientAccountId: clientId,
      category: 'software',
      label: 'Licence annuelle',
      amountCents: 9900,
      status: 'committed',
      expenseDate: '2026-09-23T12:00:00.000Z',
      frequency: 'none',
    });
    const source = join(root, 'facture-fournisseur.pdf');
    writeFileSync(source, 'pdf-test');

    const withReceipt = expenses.importReceipt(item.id, source);
    expect(withReceipt.receiptFileName).toBe('facture-fournisseur.pdf');
    expect(withReceipt.receiptRelativePath).toContain('09 Depenses');
    expect(existsSync(expenses.absoluteReceiptPath(item.id))).toBe(true);

    const paid = expenses.changeStatus(item.id, 'paid');
    expect(paid.status).toBe('paid');
    expect(paid.paidAt).toBeTruthy();
  });
  it('refuse un chemin justificatif hors du workspace même avec un préfixe commun', () => {
    const item = expenses.create({
      clientAccountId: clientId, category: 'software', label: 'Pièce à contrôler',
      amountCents: 1200, expenseDate: '2026-09-23T12:00:00.000Z',
    });
    database.run('UPDATE expenses SET receipt_relative_path=? WHERE id=?', ['../atoumweb-expenses-external/facture.pdf', item.id]);
    expect(() => expenses.absoluteReceiptPath(item.id)).toThrow(/Chemin de justificatif invalide/);
  });

});
