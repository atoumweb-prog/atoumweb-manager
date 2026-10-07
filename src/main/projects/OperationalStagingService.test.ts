import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {beforeEach,afterEach,describe,it,expect} from 'vitest';
import {NodeSqliteAdapter} from '../database/NodeSqliteAdapter';
import {applyPendingMigrations} from '../database/migrations';
import {createWorkspacePaths} from '../workspace';
import {contributionFixture} from '../testSupport/contributionFixture';
import {OperationalConfigurationService} from './OperationalConfigurationService';
import {OperationalStagingService} from './OperationalStagingService';
import {ProjectOperationalService} from './ProjectOperationalService';
import {ProjectBlueprintCompositionService} from './ProjectBlueprintCompositionService';
import {ProjectSiteService} from './ProjectSiteService';

let db:NodeSqliteAdapter,root:string,f:ReturnType<typeof contributionFixture>;
beforeEach(()=>{root=mkdtempSync(join(tmpdir(),'awb-staging-'));db=new NodeSqliteAdapter(':memory:');db.exec('PRAGMA foreign_keys=ON');applyPendingMigrations(db);f=contributionFixture(db,createWorkspacePaths(root));});
afterEach(()=>{db.close();rmSync(root,{recursive:true,force:true});});
const snapshot=()=>JSON.stringify(db.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").map(t=>db.all('SELECT * FROM '+t.name)));
function draftModel(code:string) {
  const ref=structuredClone(f.reference),model=ref.models.find(m=>m.code===f.items.get(code)!.canonicalCode)!;model.notes+=' Staging version';
  f.references.importDraft(ref,f.references.simulate(ref).planHash);
  return String(db.get('SELECT id FROM operational_model_versions WHERE canonical_code=? AND version_number=2',[model.code])!.id);
}
function newQuoteVersion(code:string) {
  const q=f.createQuote(code),cv=f.catalog.createVersion(f.items.get(code)!.id,{priceMode:'fixed',priceCents:10000});
  // Synthetic published catalogue only, never a real AW/reference version.
  f.catalog.publishVersion(cv.id);f.quotes.removeLine(q.lines[0].id);f.quotes.addCatalogLine(q.id,cv.id);
  return {q,cv};
}
describe('8A.2B - staging associations without operational activation',()=>{
  it.each(['AW-CONT-PACK4-SEO','AW-DEVWP-FONCTION'])('%s: draft model/link preview, ready model does not activate link',code=>{
    const id=draftModel(code),{q,cv}=newQuoteVersion(code),p=f.policies.get(code)!;
    const link=f.references.link(cv.id,id,null,{configuration:p});
    expect(db.get('SELECT status FROM catalog_operational_links WHERE id=?',[link])!.status).toBe('draft');
    const before=snapshot(),preview=new OperationalStagingService(db).previewQuote(q.id);
    expect(preview.operations.mode).toBe('staging');expect(preview.blueprint.mode).toBe('staging');
    expect(preview.operations.actions.filter(a=>a.action)).not.toHaveLength(0);expect(preview.blueprint.contributions).toEqual([]);
    expect(snapshot()).toBe(before);
    const runtime=new ProjectOperationalService(db);
    expect(()=>runtime.resolve(q.id,new Map())).toThrow(/compatibilité/);
    expect(()=>f.references.activateLink(link)).toThrow(/Modèle/);
    expect(()=>db.run("UPDATE catalog_operational_links SET status='ready' WHERE id=?",[link])).toThrow(/dependencies/);
    f.references.markReady(id);
    expect(()=>runtime.resolve(q.id,new Map())).toThrow(/compatibilité/);
    expect(()=>runtime.apply('no-project',preview.operations,()=>{})).toThrow(/staging/);
    expect(()=>new ProjectBlueprintCompositionService(db,new ProjectSiteService(db)).applyPrepared('no-project',preview.blueprint,'today')).toThrow(/staging/);
    f.references.activateLink(link);expect(runtime.resolve(q.id,new Map()).actions.filter(a=>a.action)).not.toHaveLength(0);
    expect(()=>db.run("UPDATE catalog_operational_links SET status='draft' WHERE id=?",[link])).toThrow(/demoted/);
    expect(db.all('SELECT * FROM projects')).toEqual([]);
  });
  it('staging manifest explicit mode, stale token rejected, neutral replay',()=>{
    const code='AW-CONT-PACK4-SEO',id=draftModel(code),{cv}=newQuoteVersion(code),service=new OperationalConfigurationService(db);
    const manifest={schemaVersion:1 as const,sourceSHA256:f.reference.source.sha256,decisionReference:'Synthetic stage',entries:[{code:f.items.get(code)!.canonicalCode!,catalogVersionId:cv.id,modelVersionId:id,blueprintVersionId:null,configuration:f.policies.get(code)!}]};
    expect(()=>service.simulate(manifest)).toThrow(/non disponible/);
    const plan=service.simulate(manifest,'staging');service.apply(manifest,plan.planSHA256,'staging');
    const before=snapshot(),replay=service.simulate(manifest,'staging');expect(replay.rows[0].action).toBe('unchanged');
    service.apply(manifest,replay.planSHA256,'staging');expect(snapshot()).toBe(before);
    expect(()=>service.apply(manifest,plan.planSHA256,'staging')).toThrow(/modifié/);
  });
  it('ready model with structural profile not ready cannot activate the association',()=>{
    const code='AW-CONT-PACK4-SEO',id=draftModel(code),bp=f.projects.createTemplate({name:'Unready fixture',projectType:'test'}).versions[0].id;
    db.run("INSERT INTO blueprint_operational_profiles VALUES(?,'structural',1,'{}',0)",[bp]);
    const {cv}=newQuoteVersion(code),link=f.references.link(cv.id,id,bp,{fixture:true});f.references.markReady(id);
    expect(()=>f.references.activateLink(link)).toThrow(/Profil/);
    expect(()=>db.run("UPDATE catalog_operational_links SET status='ready' WHERE id=?",[link])).toThrow(/dependencies/);
    f.references.useStructure(bp);f.references.activateLink(link);
    expect(db.get('SELECT status FROM catalog_operational_links WHERE id=?',[link])!.status).toBe('ready');
  });
  it('capability requires a ready base association, neither names nor manual sites qualify it',()=>{
    const code='AW-LP-SECTION',policy=structuredClone(f.policies.get(code)!);policy.requires=['synthetic-unavailable'];
    const link=f.references.link(f.items.get(code)!.versions[0].id,f.models.get(code)!,f.versions.get(code)!,{configuration:policy});
    expect(()=>f.references.activateLink(link)).toThrow(/Capacité/);
    expect(()=>db.run("UPDATE catalog_operational_links SET status='ready' WHERE id=?",[link])).toThrow(/capability/);
    expect(db.get('SELECT status FROM catalog_operational_links WHERE id=?',[link])!.status).toBe('draft');
  });
  it('a new draft revision does not shadow an old ready or pinned project revision',()=>{
    const q=f.createQuote(),p=f.prepare(q.id),before=f.projects.getProject(p.id),code='AW-WEB-VITRINE',policy=structuredClone(f.policies.get(code)!);policy.policySource='Draft revision';
    const link=f.references.link(f.items.get(code)!.versions[0].id,f.models.get(code)!,f.versions.get(code)!,{configuration:policy});
    expect(db.get('SELECT status FROM catalog_operational_links WHERE id=?',[link])!.status).toBe('draft');
    f.prepare(q.id);expect(f.projects.getProject(p.id)).toEqual(before);
    const ready=new ProjectOperationalService(db).resolve(f.createQuote().id,new Map());expect(ready.links[0].linkId).not.toBe(link);
  });
  it('persisted quote staging with explicit Site/Page choice, no Project writes',()=>{
    const q=f.createQuote('AW-LP-BASE'),addon=f.add(q.id,'AW-LP-SECTION').lines.at(-1)!,service=new OperationalStagingService(db);
    const before=snapshot(),initial=service.previewQuote(q.id),base=initial.blueprint.bases![0],page=base.structureContract!.pages[0];
    const p=service.previewQuote(q.id,[{lineOrigin:addon.id,slot:'destination',unitIndex:1,siteOwnerOrigin:base.lineOrigin!,siteOwnerSlot:'main',parentPage:{lineOrigin:base.lineOrigin!,templateNodeId:page.templateNodeId}}]);
    expect(p.targets.find(t=>t.lineOrigin===addon.id)!.state).toBe('active');expect(p.logicalChoices).toHaveLength(1);
    expect(()=>service.previewQuote(q.id,[{...p.logicalChoices[0],parentPage:{lineOrigin:base.lineOrigin!,templateNodeId:'wrong-page'}}])).toThrow(/Page parente/);
    expect(snapshot()).toBe(before);expect(db.all('SELECT * FROM projects')).toEqual([]);
  });
});
