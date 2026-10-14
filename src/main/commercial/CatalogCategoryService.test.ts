import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations, getPendingMigrations } from '../database/migrations';
import { CatalogService } from './CatalogService';
import { CatalogCategoryService } from './CatalogCategoryService';
import { QuoteService } from './QuoteService';
import { CrmService } from '../crm/CrmService';
import { ContractTermsService } from './ContractTermsService';

let db: NodeSqliteAdapter;
let catalog: CatalogService;
let categories: CatalogCategoryService;
beforeEach(() => {
  db = new NodeSqliteAdapter(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(db);
  catalog = new CatalogService(db);
  categories = new CatalogCategoryService(db);
});
afterEach(() => db.close());

const create = (name: string, category: string | null = null) =>
  catalog.create({ type: 'service', name, category }, { priceMode: 'fixed', priceCents: 9900 });

describe('04B E95 — administration transactionnelle et catégories historiques', () => {
  it('crée une identité stable vide, sans fusionner ni affecter les catégories historiques', () => {
    const legacy = create('Audit', 'SEO');
    const created = categories.create('Création de contenu');
    expect(created).toMatchObject({ name: 'Création de contenu', normalizedKey: 'creation de contenu', revision: 1, itemCount: 0, status: 'active' });
    expect(categories.listLegacy().some(c => c.rawValue === 'SEO' && c.itemIds.includes(legacy.id))).toBe(true);
    expect(catalog.getItem(legacy.id).category).toBe('SEO');
    expect(db.get<{ category_id: string|null }>('SELECT category_id FROM catalog_items WHERE id=?', [legacy.id])?.category_id).toBeNull();
  });

  it('crée atomiquement un service et un brouillon dans une catégorie administrée active', () => {
    const group = categories.create('Référencement et visibilité');
    const created = catalog.create(
      { type:'service', name:'Audit de visibilité', category:group.name, categoryId:group.id },
      { priceMode:'fixed', priceCents:14900 },
    );
    expect(created).toMatchObject({
      type:'service', category:group.name, categoryId:group.id, status:'active',
      currentVersion:{status:'draft',priceCents:14900},
    });
    expect(categories.list().find(x=>x.id===group.id)?.itemCount).toBe(1);
    expect(db.get<{action:string;category_id:string}>(
      'SELECT action,category_id FROM catalog_category_audit WHERE item_id=?',[created.id],
    )).toEqual({action:'assign',category_id:group.id});
    expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
  });

  it('refuse catégorie disparue/archivée ou libellé concurrent sans créer d’item ni version orpheline', () => {
    const group = categories.create('Maintenance WordPress');
    const count=()=>({
      items:db.get<{n:number}>('SELECT COUNT(*) AS n FROM catalog_items')!.n,
      versions:db.get<{n:number}>('SELECT COUNT(*) AS n FROM catalog_versions')!.n,
    });
    const before=count();
    const first={type:'service' as const,name:'Service de maintenance',categoryId:group.id,category:group.name};
    const draft={priceMode:'fixed' as const,priceCents:9900};
    expect(()=>catalog.create({...first,category:'Ancienne catégorie'},draft)).toThrow(/changé/);
    expect(()=>catalog.create({...first,categoryId:'identifiant-inconnu'},draft)).toThrow(/introuvable/);
    categories.setStatus(group.id,'archived',group.revision);
    expect(()=>catalog.create(first,draft)).toThrow(/archivée/);
    expect(count()).toEqual(before);
    expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
  });

  it('interdit les doublons Unicode/casse/espace, rollback et aucun second registre', () => {
    categories.create('Visibilité Google');
    expect(() => categories.create(' VISIBILITÉ   GOOGLE ')).toThrow(/existe déjà/);
    expect(categories.list()).toHaveLength(1);
    expect(db.all<{id:string}>('PRAGMA foreign_key_check')).toHaveLength(0);
  });

  it('renomme une catégorie adoptée sans changer les IDs et versions/conditions historiques', () => {
    const service = create('Service SEO', 'SEO');
    const original = catalog.getItem(service.id).versions.map(v => ({ id: v.id, price: v.priceCents, description: v.description }));
    const group = categories.create('SEO & visibilité');
    expect(categories.reconcileLegacy('SEO', group.id, [service.id])).toBe(1);
    const renamed = categories.rename(group.id, 'Référencement naturel', group.revision, [service.id]);
    expect(renamed).toMatchObject({ id: group.id, name: 'Référencement naturel', revision: 2, itemCount: 1 });
    expect(catalog.getItem(service.id).category).toBe('Référencement naturel');
    expect(catalog.getItem(service.id).versions.map(v => ({ id: v.id, price: v.priceCents, description: v.description }))).toEqual(original);
    expect(db.all<{previous_category:string;new_category:string}>(
      'SELECT previous_category,new_category FROM catalog_category_audit WHERE item_id=? ORDER BY rowid', [service.id],
    )).toEqual([
      {previous_category:'SEO',new_category:'SEO & visibilité'},
      {previous_category:'SEO & visibilité',new_category:'Référencement naturel'},
    ]);
  });

  it('refuse le renommage si la liste des prestations change après son aperçu, puis accepte après relecture', () => {
    const category=categories.create('Conseil SEO');
    const a=create('Analyse','SEO');
    categories.assign({
      itemId:a.id,categoryId:category.id,expectedCategoryId:null,expectedRawValue:'SEO',
    });
    const snapshot=categories.list().find(c=>c.id===category.id)!;
    const item2=create('Audit complémentaire','SEO');
    categories.assign({
      itemId:item2.id,categoryId:category.id,expectedCategoryId:null,expectedRawValue:'SEO',
    });
    expect(()=>categories.rename(category.id,'Visibilité',snapshot.revision,[a.id]))
      .toThrow(/liste des prestations concernées a changé/);
    expect(categories.list().find(c=>c.id===category.id)?.name).toBe('Conseil SEO');
    const auditBefore=db.get<{n:number}>(
      "SELECT COUNT(*) AS n FROM catalog_category_audit WHERE action='rename'")!.n;
    const renamed=categories.rename(category.id,'Visibilité',snapshot.revision,[a.id,item2.id]);
    expect(renamed.name).toBe('Visibilité');
    expect(renamed.itemCount).toBe(2);
    expect(db.get<{n:number}>("SELECT COUNT(*) AS n FROM catalog_category_audit WHERE action='rename'")!.n-auditBefore).toBe(3);
  });

  it('refuse une révision ancienne sans écriture partielle ni perdre les liens', () => {
    const row = categories.create('WordPress');
    categories.rename(row.id, 'WordPress & thèmes', row.revision, []);
    expect(() => categories.setStatus(row.id, 'archived', row.revision)).toThrow(/Conflit/);
    expect(categories.list()[0].status).toBe('active');
  });

  it('archive/restaure avec la même identité, sans supprimer les prestations liées', () => {
    const item = create('Maintenance', 'MAINT');
    const category = categories.create('Maintenance');
    categories.reconcileLegacy('MAINT', category.id, [item.id]);
    const archived = categories.setStatus(category.id, 'archived', category.revision);
    expect(archived.status).toBe('archived');
    expect(archived.itemCount).toBe(1);
    expect(() => categories.assign({ itemId: create('Support').id, categoryId: category.id, expectedRawValue:null, expectedCategoryId:null })).toThrow(/archivée/);
    const restored = categories.setStatus(category.id, 'active', archived.revision);
    expect(restored).toMatchObject({ id:category.id, status:'active', itemCount:1 });
    expect(catalog.getItem(item.id).category).toBe('Maintenance');
  });

  it('réaffecte volontairement un item et conserve la trace de l’ancienne catégorie', () => {
    const item = create('Réécriture', 'CONTENU');
    const target = categories.create('Création de contenu');
    categories.assign({ itemId:item.id, categoryId:target.id, expectedRawValue:'CONTENU',expectedCategoryId:null });
    const next = db.get<{category_id:string;category:string}>('SELECT category_id,category FROM catalog_items WHERE id=?',[item.id]);
    expect(next).toEqual({ category_id:target.id,category:'Création de contenu' });
    expect(categories.listLegacy().some(x => x.itemIds.includes(item.id))).toBe(false);
    expect(() => categories.assign({ itemId:item.id,categoryId:null,expectedRawValue:'CONTENU',expectedCategoryId:null })).toThrow(/Conflit/);
    categories.assign({ itemId:item.id,categoryId:null,expectedRawValue:'Création de contenu',expectedCategoryId:target.id });
    expect(catalog.getItem(item.id).category).toBeNull();
    expect(db.all<{action:string}>('SELECT action FROM catalog_category_audit WHERE item_id=? ORDER BY rowid',[item.id]).map(x=>x.action)).toEqual(['assign','clear']);
  });

  it('réconcilie uniquement après comparaison exacte des IDs, sans associer une nouvelle prestation apparue entre-temps', () => {
    const a = create('Première', 'SEO');
    const cat = categories.create('Référencement');
    const snapshot = categories.listLegacy().find(x=>x.rawValue==='SEO')!;
    create('Deuxième', 'SEO');
    expect(() => categories.reconcileLegacy('SEO',cat.id,snapshot.itemIds)).toThrow(/Conflit/);
    expect(categories.list()[0].itemCount).toBe(0);
    const ids=categories.listLegacy().find(x=>x.rawValue==='SEO')!.itemIds;
    expect(ids).toHaveLength(2);
    expect(categories.reconcileLegacy('SEO',cat.id,ids)).toBe(2);
    expect(categories.list()[0].itemCount).toBe(2);
    expect(catalog.getItem(a.id).category).toBe('Référencement');
  });

  it('n’assimile pas deux valeurs brutes proches lors de la réconciliation', () => {
    const a=create('A','SEO');
    const b=create('B','SEO');
    db.run('UPDATE catalog_items SET category=? WHERE id=?',['SEO ',b.id]);
    const cat=categories.create('Référencement');
    categories.reconcileLegacy('SEO',cat.id,[a.id]);
    expect(catalog.getItem(a.id).category).toBe('Référencement');
    expect(catalog.getItem(b.id).category).toBe('SEO ');
    expect(categories.listLegacy().find(x=>x.rawValue==='SEO ')?.itemIds).toEqual([b.id]);
  });

  it('conserve les octets des lignes et snapshots Devis historiques lors du renommage', () => {
    const item = catalog.create(
      {type:'service',name:'Audit SEO',category:'SEO'},
      {description:'Diagnostic de référencement',priceMode:'fixed',priceCents:14900,inclusions:['Rapport initial']},
    );
    catalog.publishVersion(item.versions[0].id);
    const crm=new CrmService(db);
    const terms=new ContractTermsService(db);
    const quotes=new QuoteService(db,crm,terms);
    const organization=crm.createOrganization({name:'Client fixture'});
    const prospect=crm.createProspect({organizationId:organization.id,primaryNeed:'Visibilité'});
    const quote=quotes.create({prospectId:prospect.id,subject:'Référencement de test'});
    quotes.addCatalogLine(quote.id,item.versions[0].id);
    // Historical accepted snapshot sentinel, without invoking external Abby or Project stages.
    db.run("UPDATE quotes SET status='accepted',snapshot_locked_at='2026-10-14T08:00:00Z' WHERE id=?",[quote.id]);
    const quoteBefore=db.get<Record<string,unknown>>('SELECT * FROM quotes WHERE id=?',[quote.id]);
    const linesBefore=db.all<Record<string,unknown>>('SELECT * FROM quote_lines WHERE quote_id=? ORDER BY id',[quote.id]);
    const versionsBefore=db.all<Record<string,unknown>>('SELECT * FROM catalog_versions WHERE item_id=?',[item.id]);
    const category=categories.create('SEO et visibilité');
    categories.reconcileLegacy('SEO',category.id,[item.id]);
    categories.rename(category.id,'Référencement naturel',category.revision,[item.id]);
    expect(db.get('SELECT * FROM quotes WHERE id=?',[quote.id])).toEqual(quoteBefore);
    expect(db.all('SELECT * FROM quote_lines WHERE quote_id=? ORDER BY id',[quote.id])).toEqual(linesBefore);
    expect(db.all('SELECT * FROM catalog_versions WHERE item_id=?',[item.id])).toEqual(versionsBefore);
    expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
  });

  it('R04B-13 conserve un Devis accepté après archivage de la prestation, sans nouvelle vente', () => {
    const item=catalog.create({type:'service',name:'Prestation SEO',category:'SEO'},
      {priceMode:'fixed',priceCents:14900,description:'Version publiée témoin'});
    catalog.publishVersion(item.versions[0].id);
    const crm=new CrmService(db), terms=new ContractTermsService(db);
    const quotes=new QuoteService(db,crm,terms);
    const organization=crm.createOrganization({name:'Client historique fixture'});
    const prospect=crm.createProspect({organizationId:organization.id,primaryNeed:'SEO'});
    const quote=quotes.create({prospectId:prospect.id,subject:'Contrat archivé témoin'});
    quotes.addCatalogLine(quote.id,item.versions[0].id);
    db.run("UPDATE quotes SET status='accepted',snapshot_locked_at='2026-10-14T08:00:00Z' WHERE id=?",[quote.id]);
    const before=quotes.get(quote.id);
    const category=categories.create('Référencement');
    categories.reconcileLegacy('SEO',category.id,[item.id]);
    catalog.setStatus(item.id,'archived');
    expect(quotes.get(quote.id).lines).toEqual(before.lines);
    expect(quotes.get(quote.id).status).toBe('accepted');
    expect(categories.list().find(c=>c.id===category.id)?.itemCount).toBe(1);
    const newQuote=quotes.create({prospectId:prospect.id,subject:'Nouvelle demande'});
    expect(()=>quotes.addCatalogLine(newQuote.id,item.versions[0].id))
      .toThrow(/Seule une version publiée d’une prestation active/);
    expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
  });

  it('toutes les opérations conservent intégrité FK, versions et tombstones', () => {
    const item=create('A','OLD');
    const version=JSON.stringify(catalog.getItem(item.id).versions);
    const cat=categories.create('Nouvelle');
    categories.assign({itemId:item.id,categoryId:cat.id,expectedRawValue:'OLD',expectedCategoryId:null});
    const archived=categories.setStatus(cat.id,'archived',cat.revision);
    expect(archived.itemCount).toBe(1);
    expect(JSON.stringify(catalog.getItem(item.id).versions)).toBe(version);
    expect(db.all<{table:string}>('PRAGMA foreign_key_check')).toHaveLength(0);
    expect(db.all<{id:string}>('SELECT id FROM catalog_category_audit').length).toBeGreaterThanOrEqual(3);
    expect(getPendingMigrations(db)).toHaveLength(0);
  });
});
