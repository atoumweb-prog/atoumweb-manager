import {afterEach,beforeEach,describe,it,expect} from 'vitest';
import {NodeSqliteAdapter} from '../database/NodeSqliteAdapter';
import {applyPendingMigrations, MIGRATIONS, ensureMigrationTable} from '../database/migrations';
import {ContractTypeService} from './ContractTypeService';
import {ContractTermsService} from './ContractTermsService';
import {CatalogService} from './CatalogService';
import {CrmService} from '../crm/CrmService';
import {QuoteService} from './QuoteService';
import {finalizeForTest,acceptForTest} from '../testSupport/quotePreparationFixture';
import {contractCopy,contractPresentationHtml} from '../../shared/contractPresentation';
import {buildQuoteHtml} from './quotePdf';

let db:NodeSqliteAdapter,types:ContractTypeService,terms:ContractTermsService,catalog:CatalogService,crm:CrmService,quotes:QuoteService;
beforeEach(()=>{db=new NodeSqliteAdapter(':memory:');db.exec('PRAGMA foreign_keys=ON');applyPendingMigrations(db);types=new ContractTypeService(db);terms=new ContractTermsService(db);catalog=new CatalogService(db);crm=new CrmService(db);quotes=new QuoteService(db,crm,terms);});
afterEach(()=>db.close());
function clause(code:string,scope:'base'|'catalog'='catalog') {const t=terms.createTemplate({code,title:code,scope},{body:`Texte ${code}.\nParagraphe complet.`});return terms.publishVersion(t.versions[0].id);}
function item(name:string,type:'offer'|'service'='service') {return catalog.create({name,category:'Web',type},{description:name,priceMode:'fixed',priceCents:10000,familyCode:'WEB'});}
function prospect(){const org=crm.createOrganization({name:'Fixture isolée'});return crm.createProspect({organizationId:org.id,primaryNeed:'Site'});}
function publishedType(ids:string[],name='Site vitrine') {const t=types.create('TYPE-'+name.replace(/ /g,'-'),{name,description:'Description',moduleIds:ids});return types.publish(t.versions[0].id);}

describe('ContractTypeService and one contract presentation',()=>{
  it('creates and edits a draft, alphabetic types, publication separate',()=>{
    const m=clause('MODULE');const t=types.create('Z',{name:'Zulu',description:'Ancienne',moduleIds:[m.id]});
    expect(t.currentVersionId).toBeNull();expect(t.versions[0].status).toBe('draft');
    types.create('A',{name:'Alpha',description:'',moduleIds:[]});expect(types.list().map(x=>x.versions[0].name)).toEqual(['Alpha','Zulu']);
    const edited=types.updateDraft(t.versions[0].id,{name:'Beta',description:'Nouvelle',moduleIds:[m.id]});expect(edited.versions[0].description).toBe('Nouvelle');
    expect(types.publish(t.versions[0].id).currentVersion?.name).toBe('Beta');
  });
  it('rejects socle, duplicate modules and publication with an unpublished module',()=>{
    const base=clause('BASE','base'),draft=terms.createTemplate({code:'DRAFT',title:'Draft',scope:'catalog'},{body:'Draft'});
    expect(()=>types.create('BAD',{name:'Bad',description:'',moduleIds:[base.id]})).toThrow(/socle/);
    expect(()=>types.create('BAD',{name:'Bad',description:'',moduleIds:[draft.id,draft.id]})).toThrow(/deux fois/);
    const t=types.create('D',{name:'D',description:'',moduleIds:[draft.id]});expect(()=>types.publish(t.versions[0].id)).toThrow(/publiée/);
  });
  it('versions the composition and order without deleting global clauses',()=>{
    const a=clause('A'),b=clause('B');const t=publishedType([a.id,b.id]);
    expect(()=>types.updateDraft(t.versions[0].id,{name:'X',description:'',moduleIds:[]})).toThrow(/nouvelle version/);
    expect(()=>db.run('DELETE FROM contract_type_version_modules WHERE contract_type_version_id=?',[t.versions[0].id])).toThrow();
    const next=types.createVersion(t.id,{name:'Vitrine',description:'V2',moduleIds:[b.id,a.id]});
    types.updateDraft(next.versions[0].id,{name:'Vitrine',description:'V2',moduleIds:[b.id]});types.publish(next.versions[0].id);
    expect(types.get(t.id).versions.find(v=>v.id===t.versions[0].id)?.moduleIds).toEqual([a.id,b.id]);expect(terms.getTemplate(a.id).currentVersion).toBeTruthy();
    expect(()=>db.run("UPDATE contract_type_versions SET status='draft' WHERE id=?",[t.versions[0].id])).toThrow();
  });
  it('archives reversibly without deleting history',()=>{
    const t=types.create('ARCH',{name:'Archive',description:'',moduleIds:[]});types.setStatus(t.id,'archived');expect(types.list()).toEqual([]);expect(types.list(true)).toHaveLength(1);
    expect(()=>db.run('DELETE FROM contract_types WHERE id=?',[t.id])).toThrow();expect(types.setStatus(t.id,'active').versions).toHaveLength(1);
  });
  it('binds a draft catalogue VERSION and copies its references to the next commercial version',()=>{
    const t=publishedType([]),i=item('Offre');types.setCatalog(i.versions[0].id,[t.id]);catalog.publishVersion(i.versions[0].id);
    const v2=catalog.createVersion(i.id,{description:'V2',priceMode:'fixed',priceCents:20000});
    expect(types.catalog(v2.id).map(x=>x.id)).toEqual([t.id]);types.setCatalog(v2.id,[]);
    expect(types.catalog(i.versions[0].id).map(x=>x.id)).toEqual([t.id]);expect(()=>types.setCatalog(i.versions[0].id,[])).toThrow(/brouillon/);
    expect(()=>db.run('DELETE FROM catalog_contract_type_links WHERE catalog_version_id=?',[i.versions[0].id])).toThrow();
  });
  it('initializes only present catalogue families, draft, idempotent, never legacy test',()=>{
    const i=item('Vitrine');catalog.assignCanonicalCode(i.id,'AW-WEB-VITRINE');
    db.run("UPDATE catalog_versions SET contract_type='test' WHERE id=?",[i.versions[0].id]);
    expect(types.initialize()).toEqual({created:1,linked:1,unchanged:0});expect(types.initialize()).toEqual({created:0,linked:0,unchanged:1});
    expect(types.list()[0].versions[0].status).toBe('draft');expect(types.list().some(t=>t.code==='TEST')).toBe(false);
    expect(db.get('SELECT contract_type FROM catalog_versions WHERE id=?',[i.versions[0].id])?.contract_type).toBe('test');
  });
  it('labels the shared maintenance type WordPress & WooCommerce without changing its bindings or composition',()=>{
    const wp=catalog.create({name:'Maintenance WordPress mensuelle',category:'Maintenance',type:'service',canonicalCode:'AW-MAINT-WP-M',identityProvenance:{reference:'Fixture'}},{priceMode:'monthly',priceCents:4900,familyCode:'MAINT',commercialKind:'subscription'});
    const wc=catalog.create({name:'Maintenance WooCommerce mensuelle',category:'Maintenance',type:'service',canonicalCode:'AW-MAINT-WC-M',identityProvenance:{reference:'Fixture'}},{priceMode:'monthly',priceCents:7900,familyCode:'MAINT',commercialKind:'subscription'});
    const a=clause('MAINT-WP'),b=clause('MAINT-WOO');terms.setCatalogLinks(a.id,[wp.id]);terms.setCatalogLinks(b.id,[wc.id]);
    const linksBefore=db.all('SELECT * FROM catalog_contract_clause_links ORDER BY catalog_item_id,clause_id');
    expect(types.initialize()).toEqual({created:1,linked:2,unchanged:0});const type=types.list()[0];
    expect(type.code).toBe('MAINTENANCE');expect(type.versions[0].name).toBe('Maintenance WordPress & WooCommerce');expect(type.versions[0].status).toBe('draft');
    expect(new Set(type.versions[0].moduleIds)).toEqual(new Set([a.id,b.id]));expect(new Set(type.catalogLinks.map(l=>l.catalogVersionId))).toEqual(new Set([wp.versions[0].id,wc.versions[0].id]));
    expect(db.all('SELECT * FROM catalog_contract_clause_links ORDER BY catalog_item_id,clause_id')).toEqual(linksBefore);expect(types.initialize()).toEqual({created:0,linked:0,unchanged:2});
  });
  it('refuses initial binding of a sold version atomically',()=>{
    const i=item('Site');catalog.assignCanonicalCode(i.id,'AW-WEB-VITRINE');catalog.publishVersion(i.versions[0].id);
    const q=quotes.create({prospectId:prospect().id,subject:'Site'});quotes.addCatalogLine(q.id,i.versions[0].id);
    expect(()=>types.initialize()).toThrow(/déjà vendue/);expect(types.list()).toHaveLength(0);
  });
  it('type membership never activates an unsold optional module; purchased option does',()=>{
    clause('BASE','base');const required=clause('REQUIRED'),optional=clause('OPTIONAL');
    const base=item('Vitrine','offer'),option=item('Blog');catalog.publishVersion(option.versions[0].id);
    catalog.setOfferComponents(base.versions[0].id,[{serviceVersionId:option.versions[0].id,isOptional:true,quantityMilli:1000,sortOrder:0}]);
    const t=publishedType([optional.id,required.id]);types.setCatalog(base.versions[0].id,[t.id]);terms.setCatalogLinks(required.id,[base.id]);terms.setCatalogLinks(optional.id,[option.id]);catalog.publishVersion(base.versions[0].id);
    const q=quotes.create({prospectId:prospect().id,subject:'Options'});const withBase=quotes.addCatalogLine(q.id,base.versions[0].id);
    expect(terms.syncQuote(q.id).clauses.map(c=>c.sourceClauseId)).not.toContain(optional.id);
    const offer=withBase.lines[0];const components=offer.snapshot?.offerComponents as {componentId:string}[];
    quotes.selectOfferOption(offer.id,components[0].componentId);
    expect(terms.syncQuote(q.id).clauses.filter(c=>c.sourceKind==='catalog').map(c=>c.sourceClauseId)).toEqual([optional.id,required.id]);
  });
  it('uses current published composition for drafts and preserves explicitly reordered drafts',()=>{
    const a=clause('A'),b=clause('B'),i=item('Site');terms.setCatalogLinks(a.id,[i.id]);terms.setCatalogLinks(b.id,[i.id]);
    const t=publishedType([b.id,a.id]);types.setCatalog(i.versions[0].id,[t.id]);catalog.publishVersion(i.versions[0].id);
    const q=quotes.create({prospectId:prospect().id,subject:'Ordre'});quotes.addCatalogLine(q.id,i.versions[0].id);
    expect(terms.syncQuote(q.id).clauses.map(c=>c.sourceClauseId)).toEqual([b.id,a.id]);
    const order=terms.getQuoteBuild(q.id).clauses.map(c=>c.id).reverse();terms.reorderQuoteClauses(q.id,order);
    const next=types.createVersion(t.id,{name:'Site v2',description:'',moduleIds:[b.id,a.id]});types.publish(next.versions[0].id);
    expect(terms.syncQuote(q.id).clauses.map(c=>c.id)).toEqual(order);
  });
  it('freezes presentation, module versions, parameters and type version across library changes and acceptance',()=>{
    clause('BASE','base');const m=clause('WEB'),i=item('Site');terms.setCatalogLinks(m.id,[i.id]);const t=publishedType([m.id]);types.setCatalog(i.versions[0].id,[t.id]);catalog.publishVersion(i.versions[0].id);
    const q=quotes.create({prospectId:prospect().id,subject:'Contrat lisible'});quotes.addCatalogLine(q.id,i.versions[0].id);
    const frozen=finalizeForTest(db,quotes,q.id),p=terms.presentation(q.id),json=frozen.contractSnapshotJson;
    const v=terms.createVersion(m.id,{body:'NOUVEAU TEXTE'});terms.publishVersion(v.id);const tv=types.createVersion(t.id,{name:'Nouveau type',description:'',moduleIds:[]});types.publish(tv.versions[0].id);
    quotes.markSent(q.id);acceptForTest(db,quotes,q.id);
    expect(terms.presentation(q.id)).toEqual(p);expect(quotes.get(q.id).contractSnapshotJson).toBe(json);expect(p.types[0].versionId).toBe(t.currentVersionId);
    expect(p.text).toContain('Texte WEB.');expect(p.text).not.toContain('NOUVEAU TEXTE');expect(buildQuoteHtml(quotes.get(q.id),p)).not.toContain('NOUVEAU TEXTE');
    const html=contractPresentationHtml(p);for(const section of p.sections)expect(html).toContain(section.title);
    expect(contractCopy('abby',p,'COMMERCIAL')).toBe(p.text);expect(contractCopy('contract',p,'COMMERCIAL')).toBe(p.text);expect(contractCopy('all',p,'COMMERCIAL')).toBe('COMMERCIAL\n\n---\n\n'+p.text);
    expect(p.text).not.toContain('<section');expect(p.text).toContain('Paramètres contractuels du devis'.toUpperCase());
  });
  it('module archive and composition removal do not disable another service implicitly',()=>{
    const m=clause('MODULE'),i=item('Service');terms.setCatalogLinks(m.id,[i.id]);const t=types.create('T',{name:'T',description:'',moduleIds:[m.id]});
    types.updateDraft(t.versions[0].id,{name:'T',description:'',moduleIds:[]});expect(terms.getTemplate(m.id).catalogItemIds).toEqual([i.id]);
  });
  it('also protects a catalogue version sold through a mandatory offer component',()=>{
    const service=item('Service inclus'),offer=item('Offre','offer');catalog.publishVersion(service.versions[0].id);
    catalog.setOfferComponents(offer.versions[0].id,[{serviceVersionId:service.versions[0].id,isOptional:false,quantityMilli:1000}]);catalog.publishVersion(offer.versions[0].id);
    const q=quotes.create({prospectId:prospect().id,subject:'Composition vendue'});quotes.addCatalogLine(q.id,offer.versions[0].id);
    const t=types.create('INCLUS',{name:'Inclus',description:'',moduleIds:[]});
    expect(()=>db.run('INSERT INTO catalog_contract_type_links VALUES (?,?,?)',[service.versions[0].id,t.id,'fixture'])).toThrow(/Sold catalogue/);
  });
  it('makes incompatible type orders visible and requires explicit resolution before freezing',()=>{
    clause('BASE','base');const a=clause('ORDER-A'),b=clause('ORDER-B'),one=item('Un'),two=item('Deux');
    const t1=publishedType([a.id,b.id],'Un'),t2=publishedType([b.id,a.id],'Deux');types.setCatalog(one.versions[0].id,[t1.id]);types.setCatalog(two.versions[0].id,[t2.id]);
    terms.setCatalogLinks(a.id,[one.id,two.id]);terms.setCatalogLinks(b.id,[one.id,two.id]);catalog.publishVersion(one.versions[0].id);catalog.publishVersion(two.versions[0].id);
    const q=quotes.create({prospectId:prospect().id,subject:'Ordres incompatibles'});quotes.addCatalogLine(q.id,one.versions[0].id);quotes.addCatalogLine(q.id,two.versions[0].id);
    const build=terms.syncQuote(q.id);expect(build.warnings.some(w=>w.includes('Ordres contractuels incompatibles'))).toBe(true);expect(()=>finalizeForTest(db,quotes,q.id)).toThrow(/Ordres contractuels/);
    terms.reorderQuoteClauses(q.id,terms.getQuoteBuild(q.id).clauses.map(c=>c.id));expect(finalizeForTest(db,quotes,q.id).contractCompiledAt).toBeTruthy();
  });
  it('reads a complete contract base without creating a dossier or including available options',()=>{
    clause('BASE-ALL','base');const professional=terms.createTemplate({code:'BASE-PRO',title:'Professionnels',scope:'base',audience:'professional'},{body:'Socle professionnel'});terms.publishVersion(professional.versions[0].id);
    const consumer=terms.createTemplate({code:'BASE-CONS',title:'Particuliers',scope:'base',audience:'consumer'},{body:'Socle particulier'});terms.publishVersion(consumer.versions[0].id);
    const main=clause('VITRINE-PERIMETRE'),blog=clause('BLOG-PERIMETRE'),offer=item('Vitrine','offer'),option=item('Blog');
    terms.setCatalogLinks(main.id,[offer.id]);terms.setCatalogLinks(blog.id,[option.id]);catalog.publishVersion(option.versions[0].id);
    catalog.setOfferComponents(offer.versions[0].id,[{serviceVersionId:option.versions[0].id,isOptional:true}]);
    const type=types.create('VITRINE',{name:'Site vitrine',description:'',moduleIds:[blog.id,main.id]});types.setCatalog(offer.versions[0].id,[type.id]);catalog.publishVersion(offer.versions[0].id);
    const tables=db.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").map(r=>r.name);
    const snapshot=()=>JSON.stringify(tables.map(t=>[t,db.all('SELECT * FROM "'+t+'"')]));const before=snapshot();
    const pro=terms.previewReference(type.id,type.versions[0].id,offer.versions[0].id,'professional');
    expect(pro.modules.map(m=>m.code)).toEqual(['BASE-ALL','BASE-PRO','VITRINE-PERIMETRE']);expect(pro.text).not.toContain('BLOG-PERIMETRE');expect(pro.text).not.toContain('Montant convenu');expect(pro.template?.referenceName).toBe('Vitrine');
    const cons=terms.previewReference(type.id,type.versions[0].id,offer.versions[0].id,'consumer');expect(cons.modules.map(m=>m.code)).toContain('BASE-CONS');expect(cons.text).not.toContain('Socle professionnel');expect(snapshot()).toBe(before);
  });
  it('previews each type only with an explicitly associated reference and its own type version',()=>{
    clause('BASE','base');const m=clause('MODULE');
    for(const code of ['VITRINE','LANDING','ECOMMERCE','MARIAGE','MAINTENANCE','APPLICATION','WORDPRESS','ANALYTICS','TECHNIQUE','SEO','CONTENU','IDENTITE','PHOTO']){
      const i=item(code),t=types.create(code,{name:code,description:'',moduleIds:[m.id]});types.setCatalog(i.versions[0].id,[t.id]);terms.setCatalogLinks(m.id,[...terms.getTemplate(m.id).catalogItemIds,i.id]);
      const p=terms.previewReference(t.id,t.versions[0].id,i.versions[0].id,'professional');expect(p.types[0].code).toBe(code);expect(p.modules.map(m=>m.code)).toContain('MODULE');
      expect(()=>terms.previewReference(t.id,'other-version',i.versions[0].id,'professional')).toThrow(/non rattachée/);
    }
    expect(db.get('SELECT COUNT(*) AS n FROM quotes')?.n).toBe(0);expect(db.get('SELECT COUNT(*) AS n FROM projects')?.n).toBe(0);
  });
});

describe('Migration 66 additive conservation',()=>{
  it('preserves all prior rows, 118 clause definitions, 409 links, accepted snapshot, catalogue, blueprints and models; replay neutral',()=>{
    db.close();db=new NodeSqliteAdapter(':memory:');db.exec('PRAGMA foreign_keys=ON');ensureMigrationTable(db);
    for(const m of MIGRATIONS.filter(m=>m.id<=65)){
      if(m.disableForeignKeys)db.exec('PRAGMA foreign_keys=OFF');db.exec('BEGIN');db.exec(m.sql);db.run('INSERT INTO schema_migrations VALUES (?,?,?)',[m.id,m.name,'fixture']);db.exec('COMMIT');if(m.disableForeignKeys)db.exec('PRAGMA foreign_keys=ON');
    }
    catalog=new CatalogService(db);terms=new ContractTermsService(db);crm=new CrmService(db);quotes=new QuoteService(db,crm,terms);
    const items=Array.from({length:4},(_,n)=>item('Reference '+n));
    const modules=Array.from({length:118},(_,n)=>clause('CANONICAL-'+n));
    let n=0;for(const i of items)for(const m of modules)if(n++<409)db.run('INSERT INTO catalog_contract_clause_links VALUES (?,?,?,?)',[i.id,m.id,n,'fixture']);
    const q=quotes.create({prospectId:prospect().id,subject:'Historique'});quotes.addCustomLine(q.id,{label:'Historique',proposedUnitPriceCents:10000});db.run("UPDATE quotes SET status='accepted',contract_text_snapshot='Texte historique exact',contract_snapshot_json=?,contract_compiled_at='fixture' WHERE id=?",['{"clauses":[],"preuve":"historique"}',q.id]);
    const tables=db.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name<>'schema_migrations'").map(r=>r.name);
    // Compare every column that existed before migrations 66–67. New additive
    // fields (e.g. catalog_items.category_id) must not invalidate historical bytes.
    const previousColumns=Object.fromEntries(tables.map(t=>[
      t,db.all<{name:string}>('PRAGMA table_info("'+t+'")').map(c=>c.name),
    ]));
    const snapshot=()=>Object.fromEntries(tables.map(t=>[
      t,db.all('SELECT '+previousColumns[t].map(c=>'"'+c+'"').join(',')+' FROM "'+t+'"'),
    ]));const before=snapshot();
    expect(applyPendingMigrations(db).map(m=>m.id)).toEqual(MIGRATIONS.filter(m=>m.id>=66).map(m=>m.id));expect(snapshot()).toEqual(before);
    expect(db.get('SELECT count(*) AS n FROM contract_clause_section_reviews')?.n).toBe(0);
    expect(db.get('SELECT name FROM schema_migrations WHERE id=69')).toEqual({name:'contract_clause_section_review_v1'});
    expect(db.get('SELECT COUNT(*) AS n FROM contract_clause_templates')?.n).toBe(118);expect(db.get('SELECT COUNT(*) AS n FROM catalog_contract_clause_links')?.n).toBe(409);
    expect(applyPendingMigrations(db)).toEqual([]);expect(snapshot()).toEqual(before);
    expect(db.get('PRAGMA integrity_check')?.integrity_check).toBe('ok');expect(db.all('PRAGMA foreign_key_check')).toEqual([]);expect(new ContractTypeService(db).list()).toEqual([]);
  });
});
