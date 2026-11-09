import {createHash, randomUUID} from 'node:crypto';
import type {DatabaseAdapter} from '../database/DatabaseAdapter';
import {assertIsolatedTempDatabase} from '../database/catalogDraftPersistenceMigration';
import {normalizeCatalogCategory} from '../../shared/catalogCategoryRules';
import {approvedFamilyLabel} from '../../shared/approvedFamilies';
import {APPROVED_PACK, approvedCatalogSource} from './ApprovedPackSource';

/**
 * Décisions utilisateur du 09/11/2026, appliquées AU MOMENT DE L'ACTIVATION seulement :
 * - le nom de chaque fiche reprend le nom de la grille V3.9.4 ;
 * - chaque fiche est rattachée à une catégorie unique par famille (registre catalog_categories).
 * Seules catalog_items.name/category/category_id changent. Versions, devis, snapshots, contrats,
 * codes canoniques et provenance restent intacts. Aucun branchement au démarrage ni à l'IPC.
 */
export type ApprovedIdentityChange = {
  sourceCode: string; itemId: string;
  currentName: string; targetName: string;
  currentCategory: string | null; currentCategoryId: string | null;
  targetCategory: string; targetCategoryId: string | null;
};
export type ApprovedIdentityPlan = {
  changes: ApprovedIdentityChange[]; renames: number; recategorized: number;
  categoriesToCreate: string[]; blockers: string[]; planSha256: string;
};

type ItemRow = {id: string; name: string; category: string | null; category_id: string | null; status: string};
const hasRegistry = (db: DatabaseAdapter) => !!db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='catalog_categories'");

/** Lecture seule : aucune écriture, utilisable sur n'importe quelle copie pour prévisualiser. */
export function planApprovedPackIdentity(db: DatabaseAdapter): ApprovedIdentityPlan {
  const blockers: string[] = [];
  const sha = APPROVED_PACK.catalogue.sha256_word;
  if (!hasRegistry(db)) blockers.push('Registre des catégories absent : migration 67 requise.');
  const owners = new Map<string, Set<string>>();
  for (const row of db.all<{item_id: string; code: string | null}>(
    "SELECT item_id, json_extract(provenance_json,'$.recordKey') AS code FROM catalog_versions WHERE json_extract(provenance_json,'$.sha256')=?", [sha])) {
    if (!row.code) continue;
    const set = owners.get(row.code) ?? new Set<string>(); set.add(row.item_id); owners.set(row.code, set);
  }
  const categories = hasRegistry(db)
    ? db.all<{id: string; name: string; normalized_key: string; status: string}>('SELECT id,name,normalized_key,status FROM catalog_categories')
    : [];
  const byKey = new Map(categories.map(c => [c.normalized_key, c]));
  const toCreate = new Set<string>();
  const changes: ApprovedIdentityChange[] = [];
  for (const record of approvedCatalogSource().records) {
    const code = record.canonicalCode, ids = [...(owners.get(code) ?? [])];
    if (ids.length !== 1) { blockers.push(`${code} : ${ids.length ? 'plusieurs fiches portent cette version' : 'version V3.9.4 non importée'}.`); continue; }
    const item = db.get<ItemRow>('SELECT id,name,category,category_id,status FROM catalog_items WHERE id=?', [ids[0]])!;
    if (item.status !== 'active') blockers.push(`${code} : fiche inactive ou archivée, aucune réactivation implicite.`);
    const targetCategory = approvedFamilyLabel(record.version.familyCode!);
    const existing = byKey.get(normalizeCatalogCategory(targetCategory).normalizedKey);
    if (existing?.status === 'archived') blockers.push(`Catégorie « ${existing.name} » archivée : restauration explicite requise.`);
    if (existing && existing.name !== targetCategory) blockers.push(`Catégorie « ${existing.name} » proche de « ${targetCategory} » : arbitrage explicite requis.`);
    if (!existing) toCreate.add(targetCategory);
    const change: ApprovedIdentityChange = {
      sourceCode: code, itemId: item.id, currentName: item.name, targetName: record.name,
      currentCategory: item.category, currentCategoryId: item.category_id,
      targetCategory, targetCategoryId: existing?.id ?? null,
    };
    if (change.currentName !== change.targetName || change.currentCategory !== targetCategory
      || !existing || change.currentCategoryId !== existing.id) changes.push(change);
  }
  const categoriesToCreate = [...toCreate].sort((a, b) => a.localeCompare(b, 'fr-FR'));
  const planSha256 = createHash('sha256').update(JSON.stringify({changes, categoriesToCreate, blockers})).digest('hex');
  return {
    changes, categoriesToCreate, blockers, planSha256,
    renames: changes.filter(c => c.currentName !== c.targetName).length,
    recategorized: changes.filter(c => c.currentCategory !== c.targetCategory || c.currentCategoryId !== c.targetCategoryId || !c.targetCategoryId).length,
  };
}

/**
 * Application sur base TEMP isolée uniquement (garde identique à la migration 81), dans une seule
 * transaction, avec conditions sur les valeurs attendues et traces dans les journaux existants.
 */
export function applyApprovedPackIdentityTemp(db: DatabaseAdapter, expectedPlanSha256: string) {
  assertIsolatedTempDatabase(db, 'Activation du pack autorisée uniquement sur une base TEMP isolée.');
  const plan = planApprovedPackIdentity(db);
  if (plan.blockers.length) throw Error('Activation bloquée : ' + plan.blockers.join(' ; '));
  if (plan.planSha256 !== expectedPlanSha256) throw Error('Plan d’activation périmé : prévisualiser de nouveau.');
  const now = new Date().toISOString();
  const audit = (action: string, v: {categoryId: string; itemId?: string; newName?: string; previousRaw?: string | null; newRaw?: string; previousCategoryId?: string | null}) =>
    db.run(`INSERT INTO catalog_category_audit (id,action,category_id,item_id,previous_name,new_name,previous_category,new_category,previous_category_id,new_category_id,created_at)
      VALUES(?,?,?,?,NULL,?,?,?,?,?,?)`,
    [randomUUID(), action, v.categoryId, v.itemId ?? null, v.newName ?? null, v.previousRaw ?? null, v.newRaw ?? null, v.previousCategoryId ?? null, v.itemId ? v.categoryId : null, now]);
  db.exec('BEGIN IMMEDIATE;');
  try {
    const ids = new Map<string, string>();
    for (const name of plan.categoriesToCreate) {
      const {label, normalizedKey} = normalizeCatalogCategory(name), id = randomUUID();
      db.run("INSERT INTO catalog_categories (id,name,normalized_key,status,revision,created_at,updated_at,archived_at) VALUES(?,?,?,'active',1,?,?,NULL)", [id, label, normalizedKey, now, now]);
      audit('create', {categoryId: id, newName: label});
      ids.set(name, id);
    }
    for (const c of plan.changes) {
      const categoryId = c.targetCategoryId ?? ids.get(c.targetCategory)!;
      const result = db.run(
        'UPDATE catalog_items SET name=?,category=?,category_id=?,updated_at=? WHERE id=? AND name=? AND category IS ? AND category_id IS ?',
        [c.targetName, c.targetCategory, categoryId, now, c.itemId, c.currentName, c.currentCategory, c.currentCategoryId]);
      if (Number(result.changes) !== 1) throw Error(`Conflit : la fiche ${c.sourceCode} a changé depuis la prévisualisation.`);
      if (c.currentCategory !== c.targetCategory || c.currentCategoryId !== categoryId)
        audit('assign', {categoryId, itemId: c.itemId, previousRaw: c.currentCategory, newRaw: c.targetCategory, previousCategoryId: c.currentCategoryId});
      if (c.currentName !== c.targetName)
        db.run('INSERT INTO activity_log (entity_type, entity_id, action, summary, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          ['catalog', c.itemId, 'catalog_item_renamed_approved_pack', `Nom « ${c.currentName} » remplacé par « ${c.targetName} » (activation V3.9.4)`,
            JSON.stringify({sourceCode: c.sourceCode, previousName: c.currentName, reference: APPROVED_PACK.reference}), now]);
    }
    db.exec('COMMIT;');
  } catch (error) { db.exec('ROLLBACK;'); throw error; }
  return {applied: true, renames: plan.renames, recategorized: plan.recategorized, categoriesCreated: plan.categoriesToCreate.length, planSha256: plan.planSha256};
}
