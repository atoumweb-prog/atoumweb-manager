import { randomUUID } from 'node:crypto';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type {
  CatalogCategoryAssignment,
  CatalogCategoryRecord,
  CatalogCategoryStatus,
  CatalogLegacyCategory,
} from '../../shared/catalogCategoryAdministration';
import { normalizeCatalogCategory } from '../../shared/catalogCategoryRules';

type CategoryRow = {
  id: string; name: string; normalized_key: string; status: CatalogCategoryStatus;
  revision: number; item_count: number; created_at: string; updated_at: string;
  archived_at: string | null;
};
type ItemRow = { id: string; category: string | null; category_id: string | null };

const now = () => new Date().toISOString();
const same = (a: string | null, b: string | null) => a === b;

/**
 * Isolated administration engine. No auto-import or silent matching of old categories.
 * Only an explicit, checked operation can change catalog_items.category/category_id.
 * Never updates catalog_versions, quote_lines, contracts, blueprints or canonical identity.
 */
export class CatalogCategoryService {
  constructor(private readonly db: DatabaseAdapter) {}

  private transaction<T>(fn: () => T): T {
    this.db.exec('BEGIN IMMEDIATE;');
    try {
      const result = fn();
      this.db.exec('COMMIT;');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK;');
      throw error;
    }
  }

  private category(id: string): CategoryRow {
    const row = this.db.get<CategoryRow>(
      `SELECT c.*, (SELECT COUNT(*) FROM catalog_items i WHERE i.category_id=c.id) AS item_count
         FROM catalog_categories c WHERE c.id=?`, [id],
    );
    if (!row) throw new Error('Catégorie introuvable.');
    return row;
  }

  private assertRevision(category: CategoryRow, expectedRevision: number): void {
    if (!Number.isInteger(expectedRevision) || category.revision !== expectedRevision)
      throw new Error('Conflit de catégorie : elle a changé. Recharge la liste avant de modifier.');
  }

  private map(row: CategoryRow): CatalogCategoryRecord {
    return {
      id: row.id, name: row.name, normalizedKey: row.normalized_key,
      status: row.status, revision: row.revision, itemCount: Number(row.item_count),
      createdAt: row.created_at, updatedAt: row.updated_at, archivedAt: row.archived_at,
    };
  }

  private audit(action: 'create'|'rename'|'archive'|'restore'|'assign'|'clear'|'reconcile',
    input: { categoryId?: string | null; itemId?: string | null; previousName?: string | null;
      newName?: string | null; previousRaw?: string | null; newRaw?: string | null;
      previousCategoryId?: string | null; newCategoryId?: string | null; },
  ): void {
    this.db.run(
      `INSERT INTO catalog_category_audit
       (id,action,category_id,item_id,previous_name,new_name,previous_category,new_category,
        previous_category_id,new_category_id,created_at)
       VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
      [randomUUID(), action, input.categoryId ?? null, input.itemId ?? null,
        input.previousName ?? null, input.newName ?? null, input.previousRaw ?? null,
        input.newRaw ?? null, input.previousCategoryId ?? null,
        input.newCategoryId ?? null, now()],
    );
  }

  list(): CatalogCategoryRecord[] {
    return this.db.all<CategoryRow>(
      `SELECT c.*, (SELECT COUNT(*) FROM catalog_items i WHERE i.category_id=c.id) AS item_count
       FROM catalog_categories c ORDER BY c.name COLLATE NOCASE,c.id`,
    ).map(row => this.map(row))
      .sort((a,b) => a.name.localeCompare(b.name,'fr-FR',{sensitivity:'base'}) || a.id.localeCompare(b.id));
  }

  listLegacy(): CatalogLegacyCategory[] {
    const rows = this.db.all<ItemRow>(
      `SELECT id,category,category_id FROM catalog_items
       WHERE category_id IS NULL AND category IS NOT NULL AND length(trim(category))>0
       ORDER BY category COLLATE BINARY, id`,
    );
    const groups = new Map<string,string[]>();
    for (const row of rows) {
      const group = groups.get(row.category!) ?? [];
      group.push(row.id); groups.set(row.category!,group);
    }
    return [...groups.entries()].map(([rawValue,itemIds]) => ({
      rawValue, itemIds, itemCount:itemIds.length,
    })).sort((a,b)=>a.rawValue.localeCompare(b.rawValue,'fr-FR',{sensitivity:'variant'}));
  }

  create(name: string): CatalogCategoryRecord {
    const input = normalizeCatalogCategory(name);
    return this.transaction(() => {
      if (this.db.get<{id:string}>('SELECT id FROM catalog_categories WHERE normalized_key=?',[input.normalizedKey]))
        throw new Error('Une catégorie portant ce nom existe déjà.');
      const id=randomUUID(),date=now();
      this.db.run(
        `INSERT INTO catalog_categories
         (id,name,normalized_key,status,revision,created_at,updated_at,archived_at)
         VALUES(?,?,?,'active',1,?,?,NULL)`,
        [id,input.label,input.normalizedKey,date,date],
      );
      this.audit('create',{categoryId:id,newName:input.label});
      return this.map(this.category(id));
    });
  }

  rename(id: string, name: string, expectedRevision: number): CatalogCategoryRecord {
    const input=normalizeCatalogCategory(name);
    return this.transaction(()=>{
      const previous=this.category(id);
      this.assertRevision(previous,expectedRevision);
      if (previous.name===input.label) return this.map(previous);
      const duplicate=this.db.get<{id:string}>('SELECT id FROM catalog_categories WHERE normalized_key=? AND id<>?',[input.normalizedKey,id]);
      if(duplicate) throw new Error('Une autre catégorie porte déjà ce nom.');
      const date=now();
      this.db.run(`UPDATE catalog_categories SET name=?,normalized_key=?,revision=revision+1,updated_at=? WHERE id=?`,
        [input.label,input.normalizedKey,date,id]);
      // Keep old CatalogService filters, Prospect and Devis presentation compatible.
      // Snapshot objects/versions/quotes are not touched; old item values enter audit.
      const links=this.db.all<ItemRow>('SELECT id,category,category_id FROM catalog_items WHERE category_id=?',[id]);
      for (const item of links) {
        this.db.run('UPDATE catalog_items SET category=?,updated_at=? WHERE id=?',
          [input.label,date,item.id]);
        this.audit('rename',{
          categoryId:id,itemId:item.id,previousName:previous.name,newName:input.label,
          previousRaw:item.category,newRaw:input.label,previousCategoryId:id,newCategoryId:id,
        });
      }
      this.audit('rename',{categoryId:id,previousName:previous.name,newName:input.label});
      return this.map(this.category(id));
    });
  }

  setStatus(id: string, status: CatalogCategoryStatus, expectedRevision: number): CatalogCategoryRecord {
    if(status!=='active'&&status!=='archived') throw new Error('Statut de catégorie invalide.');
    return this.transaction(()=>{
      const category=this.category(id);
      this.assertRevision(category,expectedRevision);
      if(category.status===status) return this.map(category);
      const date=now();
      this.db.run(`UPDATE catalog_categories SET status=?,revision=revision+1,updated_at=?,archived_at=? WHERE id=?`,
        [status,date,status==='archived'?date:null,id]);
      this.audit(status==='archived'?'archive':'restore',{categoryId:id,previousName:category.name,newName:category.name});
      return this.map(this.category(id));
    });
  }

  private item(id:string):ItemRow {
    const row=this.db.get<ItemRow>('SELECT id,category,category_id FROM catalog_items WHERE id=?',[id]);
    if(!row)throw new Error('Prestation Catalogue introuvable.');
    return row;
  }

  assign(input: CatalogCategoryAssignment): void {
    if (!input || typeof input.itemId!=='string' || !input.itemId.trim() ||
      !('expectedCategoryId' in input) || !('expectedRawValue' in input))
      throw new Error('Identité et valeurs attendues obligatoires pour réaffecter.');
    this.transaction(()=>{
      const item=this.item(input.itemId);
      if (!same(item.category,input.expectedRawValue) || !same(item.category_id,input.expectedCategoryId))
        throw new Error('Conflit : la catégorie de cette prestation a changé. Recharge la fiche.');
      const target=input.categoryId ? this.category(input.categoryId) : null;
      if(target?.status==='archived') throw new Error('Une catégorie archivée ne peut recevoir de nouvelles prestations.');
      const nextRaw=target?.name??null,nextId=target?.id??null;
      if(same(item.category,nextRaw)&&same(item.category_id,nextId))return;
      this.db.run('UPDATE catalog_items SET category=?,category_id=?,updated_at=? WHERE id=?',
        [nextRaw,nextId,now(),item.id]);
      this.audit(target?'assign':'clear',{
        categoryId:target?.id??item.category_id,itemId:item.id,
        previousRaw:item.category,newRaw:nextRaw,
        previousCategoryId:item.category_id,newCategoryId:nextId,
      });
    });
  }

  reconcileLegacy(rawValue: string, categoryId: string, expectedItemIds: string[]): number {
    if(typeof rawValue!=='string'||!rawValue.trim()||!Array.isArray(expectedItemIds)||
      expectedItemIds.some(id=>typeof id!=='string')||new Set(expectedItemIds).size!==expectedItemIds.length)
      throw new Error('Réconciliation invalide : valeur brute et liste exacte des identifiants requises.');
    return this.transaction(()=>{
      const target=this.category(categoryId);
      if(target.status==='archived')throw new Error('Catégorie archivée : réconciliation interdite.');
      const items=this.db.all<ItemRow>(
        'SELECT id,category,category_id FROM catalog_items WHERE category=? COLLATE BINARY AND category_id IS NULL ORDER BY id',
        [rawValue],
      );
      const actual=items.map(i=>i.id),expected=[...expectedItemIds].sort();
      if(actual.length!==expected.length||actual.some((id,index)=>id!==expected[index]))
        throw new Error('Conflit : les prestations liées à cette valeur ont changé. Actualise l’inventaire.');
      for(const item of items){
        this.db.run('UPDATE catalog_items SET category=?,category_id=?,updated_at=? WHERE id=?',
          [target.name,target.id,now(),item.id]);
        this.audit('reconcile',{
          categoryId:target.id,itemId:item.id,previousRaw:item.category,newRaw:target.name,
          previousCategoryId:null,newCategoryId:target.id,
        });
      }
      return items.length;
    });
  }
}
