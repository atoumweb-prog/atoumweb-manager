
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
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

  it('journalise les chemins des deux versions après remplacement du justificatif', () => {
    const item = expenses.create({
      clientAccountId: clientId, category: 'software', label: 'Abonnement logiciel',
      amountCents: 2400, expenseDate: '2026-09-23T12:00:00.000Z',
    });
    const sourceA = join(root, 'original.pdf');
    const sourceB = join(root, 'remplacement.pdf');
    writeFileSync(sourceA, 'version initiale');
    writeFileSync(sourceB, 'version corrigée');
    const first = expenses.importReceipt(item.id, sourceA);
    const original = expenses.absoluteReceiptPath(item.id);
    const second = expenses.importReceipt(item.id, sourceB);
    expect(second.receiptRelativePath).not.toBe(first.receiptRelativePath);
    expect(existsSync(original)).toBe(true);
    const versions = database.all<{ metadata_json: string }>(
      "SELECT metadata_json FROM activity_log WHERE entity_type='expense' AND entity_id=? AND action='expense_receipt_version' ORDER BY id ASC",
      [item.id],
    ).map((row) => JSON.parse(row.metadata_json) as { previousRelativePath: string | null; currentRelativePath: string });
    expect(versions).toHaveLength(2);
    expect(versions[0].previousRelativePath).toBeNull();
    expect(versions[0].currentRelativePath).toBe(first.receiptRelativePath);
    expect(versions[1].previousRelativePath).toBe(first.receiptRelativePath);
    expect(versions[1].currentRelativePath).toBe(second.receiptRelativePath);
    expect(expenses.verifiedReceiptVersionPath(item.id, first.receiptRelativePath!)).toBe(original);
    const preview = expenses.prepareReceiptVersionPreview(item.id, first.receiptRelativePath!);
    try {
      expect(preview).not.toBe(original);
      expect(readFileSync(preview)).toEqual(readFileSync(original));
    } finally {
      chmodSync(preview, 0o666);
      rmSync(resolve(preview, '..'), { recursive: true, force: true });
    }
    const history = expenses.listReceiptVersions(item.id);
    expect(history).toHaveLength(2);
    expect(history.map((version) => version.integrity)).toEqual(['verified', 'verified']);
    writeFileSync(original, 'fichier modifié après import');
    expect(() => expenses.verifiedReceiptVersionPath(item.id, first.receiptRelativePath!)).toThrow(/intégrité/);
    expect(expenses.listReceiptVersions(item.id).map((version) => version.integrity)).toEqual(['verified', 'modified']);
  });


  it('restaure le justificatif précédent et nettoie la copie si la journalisation échoue', () => {
    const item = expenses.create({
      clientAccountId: clientId, category: 'software', label: 'Pièce atomique',
      amountCents: 2500, expenseDate: '2026-10-14T12:00:00.000Z',
    });
    const sourceA = join(root, 'version-validee.pdf');
    const sourceB = join(root, 'version-rejetee.pdf');
    writeFileSync(sourceA, '%PDF-1.4\\nJustificatif initial');
    writeFileSync(sourceB, '%PDF-1.4\\nJustificatif rejeté');
    expenses.importReceipt(item.id, sourceA);
    const before = expenses.get(item.id);
    const original = expenses.absoluteReceiptPath(item.id);
    const bytes = readFileSync(original);
    database.exec(`CREATE TRIGGER fail_receipt_provenance BEFORE INSERT ON activity_log
      WHEN NEW.entity_id='${item.id}' AND NEW.action='expense_receipt_version'
      BEGIN SELECT RAISE(ABORT, 'historique justificatif indisponible'); END;`);
    expect(() => expenses.importReceipt(item.id, sourceB)).toThrow(/historique justificatif indisponible/);
    expect(expenses.get(item.id)).toEqual(before);
    expect(readFileSync(original)).toEqual(bytes);
    expect(existsSync(join(dirname(original), 'version-rejetee.pdf'))).toBe(false);
    expect(expenses.listReceiptVersions(item.id)).toHaveLength(1);
    expect(database.all('PRAGMA foreign_key_check')).toEqual([]);
  });


  it('journalise la déclaration de paiement et annule un statut si son historique échoue', () => {
    const expense = expenses.create({
      category: 'office', label: 'Paiement à déclarer', amountCents: 3500,
      expenseDate: '2026-10-14T12:00:00.000Z', status: 'committed',
    });
    const before = expenses.get(expense.id);
    database.exec(`CREATE TRIGGER reject_paid_provenance BEFORE INSERT ON activity_log
      WHEN NEW.entity_id='${expense.id}' AND NEW.action='expense_status_changed'
      BEGIN SELECT RAISE(ABORT, 'historique paiement indisponible'); END;`);
    expect(() => expenses.changeStatus(expense.id, 'paid')).toThrow(/historique paiement indisponible/);
    expect(expenses.get(expense.id)).toEqual(before);
    database.exec('DROP TRIGGER reject_paid_provenance');
    const paid = expenses.changeStatus(expense.id, 'paid');
    expect(paid.status).toBe('paid');
    expect(paid.paidAt).toBeTruthy();
    expect(expenses.changeStatus(expense.id, 'paid')).toEqual(paid);
    const history = database.all<{ metadata_json: string }>(
      "SELECT metadata_json FROM activity_log WHERE entity_id=? AND action='expense_status_changed'",
      [expense.id],
    );
    expect(history).toHaveLength(1);
    expect(JSON.parse(history[0].metadata_json)).toMatchObject({
      previousStatus: 'committed', currentStatus: 'paid', paymentVerifiedByBank: false,
    });
    expect(database.all('PRAGMA foreign_key_check')).toEqual([]);
  });


  it('ne réécrit pas une dépense payée si la trace de correction échoue', () => {
    const input = {
      category: 'software' as const, label: 'Licence à corriger', amountCents: 10000,
      status: 'paid' as const, expenseDate: '2026-10-14T12:00:00.000Z',
      paidAt: '2026-10-14T12:00:00.000Z',
    };
    const created = expenses.create(input);
    const before = expenses.get(created.id);
    database.exec(`CREATE TRIGGER reject_expense_update BEFORE INSERT ON activity_log
      WHEN NEW.entity_id='${created.id}' AND NEW.action='expense_updated'
      BEGIN SELECT RAISE(ABORT, 'journal correction indisponible'); END;`);
    expect(() => expenses.update(created.id, { ...input, amountCents: 12000 }))
      .toThrow(/journal correction indisponible/);
    expect(expenses.get(created.id)).toEqual(before);
    database.exec('DROP TRIGGER reject_expense_update');
    const updated = expenses.update(created.id, { ...input, amountCents: 12000 });
    expect(updated.amountCents).toBe(12000);
    expect(updated.paidAt).toBe(before.paidAt);
    const trace = database.get<{ metadata_json: string }>(
      "SELECT metadata_json FROM activity_log WHERE entity_id=? AND action='expense_updated' ORDER BY id DESC LIMIT 1",
      [created.id],
    );
    expect(JSON.parse(trace!.metadata_json)).toMatchObject({
      previousStatus: 'paid', currentStatus: 'paid',
      previousAmountCents: 10000, currentAmountCents: 12000,
      paymentVerifiedByBank: false,
    });
    expect(database.all('PRAGMA foreign_key_check')).toEqual([]);
  });


  it('autorise une dépense interne mensuelle sans générer de doublon et refuse les montants invalides', () => {
    const source = {
      category: 'software' as const, label: 'Service interne mensuel',
      amountCents: 2400, vatCents: 400, status: 'planned' as const,
      expenseDate: '2026-10-14T12:00:00.000Z', frequency: 'monthly' as const,
      nextDueAt: '2026-11-14T12:00:00.000Z',
    };
    expect(() => expenses.create({ ...source, amountCents: -1 })).toThrow(/Montant de dépense invalide/);
    expect(() => expenses.create({ ...source, vatCents: 3000 })).toThrow(/Montant de TVA invalide/);
    const created = expenses.create(source);
    expect(created).toMatchObject({
      clientAccountId: null, projectId: null, frequency: 'monthly',
      status: 'planned', nextDueAt: source.nextDueAt,
    });
    const committed = expenses.changeStatus(created.id, 'committed');
    expect(committed.status).toBe('committed');
    expect(expenses.list()).toHaveLength(1);
    expect(database.all('PRAGMA foreign_key_check')).toEqual([]);
  });

  it('signale explicitement un justificatif manquant sans créer de nouvelle preuve', () => {
    const expense = expenses.create({
      category: 'office', label: 'Justificatif à détecter', amountCents: 3000,
      expenseDate: '2026-10-14T12:00:00.000Z',
    });
    const source = join(root, 'preuve-disparue.pdf');
    writeFileSync(source, '%PDF-1.4\\nPreuve réelle de test');
    expenses.importReceipt(expense.id, source);
    const original = expenses.absoluteReceiptPath(expense.id);
    rmSync(original, { force: true });
    expect(expenses.get(expense.id).receiptMissing).toBe(true);
    expect(() => expenses.absoluteReceiptPath(expense.id)).toThrow(/introuvable/);
    expect(expenses.listReceiptVersions(expense.id)[0].integrity).toBe('missing');
    expect(database.all('PRAGMA foreign_key_check')).toEqual([]);
  });


  it('valide le projet du bon client et refuse une dépense ou un transfert vers le client opposé', () => {
    const crm = new CrmService(database);
    const secondOrg = crm.createOrganization({ name: 'Autre client test 09C' });
    const otherClientId = crm.createClient({ organizationId: secondOrg.id }).id;
    const now = '2026-10-14T12:00:00.000Z';
    database.run(
      `INSERT INTO projects
       (id,project_number,client_account_id,name,project_type,status,commercial_mode,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      ['project-09c-a','09C-2026-001',clientId,'Projet client A 09C','website','to_prepare','normal',now,now],
    );
    const input = {
      category: 'software' as const, label: 'Frais projet client A',
      amountCents: 12900, status: 'committed' as const, expenseDate: now,
      clientAccountId: clientId, projectId: 'project-09c-a',
    };
    const created = expenses.create(input);
    expect(created).toMatchObject({ clientAccountId: clientId, projectId: 'project-09c-a' });
    expect(expenses.list({ clientAccountId: clientId }).some((item) => item.id === created.id)).toBe(true);
    expect(() => expenses.create({ ...input, clientAccountId: otherClientId, label: 'Incohérent' }))
      .toThrow(/projet ne correspond pas au client/);
    const before = expenses.get(created.id);
    expect(() => expenses.update(created.id, { ...input, clientAccountId: otherClientId }))
      .toThrow(/projet ne correspond pas au client/);
    expect(expenses.get(created.id)).toEqual(before);
    const moved = expenses.update(created.id, { ...input, clientAccountId: otherClientId, projectId: null });
    expect(moved).toMatchObject({ clientAccountId: otherClientId, projectId: null });
    expect(database.all('PRAGMA foreign_key_check')).toEqual([]);
  });


  it('annule la création complète lorsque son historique ne peut pas être enregistré', () => {
    const countBefore = expenses.list().length;
    database.exec(`CREATE TRIGGER reject_expense_create BEFORE INSERT ON activity_log
      WHEN NEW.entity_type='expense' AND NEW.action='expense_created'
      BEGIN SELECT RAISE(ABORT, 'journal création indisponible'); END;`);
    expect(() => expenses.create({
      category: 'software', label: 'Création impossible', amountCents: 2200,
      expenseDate: '2026-10-14T12:00:00.000Z',
    })).toThrow(/journal création indisponible/);
    expect(expenses.list()).toHaveLength(countBefore);
    database.exec('DROP TRIGGER reject_expense_create');
    const saved = expenses.create({
      category: 'software', label: 'Création effective', amountCents: 2200,
      expenseDate: '2026-10-14T12:00:00.000Z',
    });
    expect(expenses.get(saved.id).label).toBe('Création effective');
    expect(database.all('PRAGMA foreign_key_check')).toEqual([]);
  });

});
