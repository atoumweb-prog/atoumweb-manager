import {createOperationalRecipeFixture} from '../../testSupport/operationalRecipeFixture';
import {describe,it,expect} from 'vitest';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {NodeSqliteAdapter} from '../../database/NodeSqliteAdapter';
import {OperationalRecipeService,fileSHA} from '../OperationalRecipeService';
import {prepareHistoireRecipeStructure} from './mariageHistoireRecipeStructure';
const snapshot=(db:NodeSqliteAdapter)=>JSON.stringify(db.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").map(t=>[t.name,db.all(`SELECT * FROM ${t.name}`).map(r=>JSON.stringify(r)).sort()]));
describe('Mariage Histoire — isolated structural correction',()=>{
  it('prepares a distinct draft, preserves shared structure/history/actions, replays neutrally and rolls back',()=>{
    const root=mkdtempSync(join(tmpdir(),'atoumweb-operational-recipe-histoire-test-')),copy=join(root,'recipe.sqlite');createOperationalRecipeFixture(copy,true);
    const db=new NodeSqliteAdapter(copy);db.exec('PRAGMA foreign_keys=ON');
    try {
      const before=snapshot(db),oldProfiles=db.all('SELECT * FROM blueprint_operational_profiles'),models=db.all('SELECT * FROM operational_model_versions');
      db.exec('SAVEPOINT correction_test');
      const id=prepareHistoireRecipeStructure(db,copy);
      expect(db.get('SELECT status FROM project_template_versions WHERE id=?',[id])?.status).toBe('draft');
      expect(db.get('SELECT operational_ready FROM blueprint_operational_profiles WHERE template_version_id=?',[id])?.operational_ready).toBe(0);
      const pages=db.all<{name:string;desired_path:string;description:string|null}>(`SELECT n.name,p.desired_path,n.description FROM project_template_nodes n JOIN project_template_site_pages p ON p.template_node_id=n.id WHERE n.template_version_id=? ORDER BY p.sort_order`,[id]);
      expect(pages.map(p=>[p.name,p.desired_path])).toEqual([['Accueil','/'],['Notre histoire','/notre-histoire/'],['Le Jour J','/jour-j/'],['Espace privé','/espace-prive/']]);
      expect(pages[3].description).toContain('Page protégée prévue');
      expect(db.all('SELECT * FROM operational_model_versions')).toEqual(models);
      for(const old of oldProfiles)expect(db.get('SELECT * FROM blueprint_operational_profiles WHERE template_version_id=?',[String(old.template_version_id)])).toEqual(old);
      expect(db.all('SELECT * FROM project_action_instances')).toHaveLength(0);expect(db.all('SELECT * FROM project_contribution_targets')).toHaveLength(0);
      expect(db.get("SELECT count(*) n FROM catalog_operational_links WHERE status='ready'")?.n).toBe(0);
      expect(db.all('PRAGMA foreign_key_check')).toEqual([]);expect(db.get('PRAGMA integrity_check')?.integrity_check).toBe('ok');
      const first=snapshot(db);expect(prepareHistoireRecipeStructure(db,copy)).toBe(id);expect(snapshot(db)).toBe(first);
      db.exec('ROLLBACK TO correction_test; RELEASE correction_test');expect(snapshot(db)).toBe(before);
    } finally {db.close();rmSync(root,{recursive:true,force:true});}

  });
  it('rejects a non-owned source path before any access',()=>{
    const db={all:()=>{throw Error('Must not read another source');}} as unknown as NodeSqliteAdapter;
    expect(()=>prepareHistoireRecipeStructure(db,join(tmpdir(),'not-owned.sqlite'))).toThrow(/copie de recette isolée/);
  });
  it('uses the true staging engine for Histoire while Essentiel/Grand Jour and exact action texts/times remain unchanged',()=>{
    const root=mkdtempSync(join(tmpdir(),'atoumweb-operational-recipe-histoire-read-')),copy=join(root,'recipe.sqlite');createOperationalRecipeFixture(copy);
    const session=new OperationalRecipeService(copy);
    try {
      const db=new NodeSqliteAdapter(copy);
      const models=['AW-MARIAGE-ESS','AW-MARIAGE-GRAND','AW-MARIAGE-HISTOIRE'].map(code=>JSON.parse(String(db.get('SELECT model_json FROM operational_model_versions WHERE canonical_code=?',[code])!.model_json)));
      db.close();
      for(const [index,expected] of [[0,[9,630,1]],[1,[10,1020,1]],[2,[10,1650,4]]] as const){
        const request={sessionId:session.sessionId,scenarioId:'case-'+(index+4),requestId:index+1},p=session.preview(request);
        expect([p.metrics.actions,p.metrics.referenceMinutes,p.metrics.pages]).toEqual(expected);expect(p.metrics.sites).toBe(1);
        expect(p.actions.map(a=>a.action)).toEqual(models[index].actions);
        expect(p.structures[0].contract.modules).toHaveLength(0);expect(p.runtimeRefused).toBe(true);expect(p.canMaterialize).toBe(false);
        expect(session.preview(request)).toEqual(p);
      }

    }finally{expect(session.close()).toMatchObject({sourceUnchanged:true,copyDeleted:true});rmSync(root,{recursive:true,force:true});}
  });
});
