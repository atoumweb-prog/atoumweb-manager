import {createHash} from 'node:crypto';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {planProjectResourceRelocations} from './WorkspaceRelocationPlan';

let root:string,sqlite:string,db:DatabaseSync;
beforeEach(()=>{
  root=mkdtempSync(join(tmpdir(),'ec04-plan-fixtures-'));
  sqlite=join(root,'source.sqlite');
  db=new DatabaseSync(sqlite);
  db.exec('CREATE TABLE projects (id TEXT PRIMARY KEY, resource_root_path TEXT);');
});
afterEach(()=>{db.close();rmSync(root,{recursive:true,force:true});});
const insert=(id:string,path:string)=>db.prepare('INSERT INTO projects VALUES (?,?)').run(id,path);

describe('EC04: dry-run of project resource root relocation',()=>{
  it('suggests only owned POSIX roots, without changing SQLite bytes',()=>{
    insert('internal',join(root,'projets-internes','i1','Ressources'));
    insert('outside',join(tmpdir(),'other','Ressources'));
    insert('relative','clients/c1/P/Ressources');
    const sha=()=>createHash('sha256').update(readFileSync(sqlite)).digest('hex');
    const before=sha();
    const plan=planProjectResourceRelocations(sqlite,root,join(root,'restored'));
    expect(plan.inspectedProjects).toBe(3);
    expect(plan.proposals).toContainEqual({
      projectId:'internal',status:'proposed',
      relativePath:'projets-internes/i1/Ressources',
      destinationPath:join(root,'restored','projets-internes','i1','Ressources'),
    });
    expect(plan.proposals).toContainEqual({projectId:'outside',status:'manual-review',problem:'external-resource-root'});
    expect(plan.proposals).toContainEqual({projectId:'relative',status:'manual-review',problem:'invalid-resource-path'});
    expect(plan.readyForAutomaticMigration).toBe(false);
    expect(plan.emptyDirectoriesPreserved).toBe(false);
    expect(sha()).toBe(before);
  });

  it('handles Windows drive migration and case-insensitive source roots',()=>{
    insert('valid','c:\\manager\\clients\\c1\\Site\\Ressources');
    insert('external','D:\\outside\\Ressources');
    insert('escaping','C:\\Manager\\clients\\..\\wrong\\Ressources');
    const plan=planProjectResourceRelocations(sqlite,'C:\\Manager','E:\\Restored Manager');
    expect(plan.proposals.find(x=>x.projectId==='valid')).toEqual({
      projectId:'valid',status:'proposed',relativePath:'clients/c1/Site/Ressources',
      destinationPath:'E:\\Restored Manager\\clients\\c1\\Site\\Ressources',
    });
    expect(plan.proposals.find(x=>x.projectId==='external')?.problem).toBe('external-resource-root');
    expect(plan.proposals.find(x=>x.projectId==='escaping')?.problem).toBe('invalid-resource-path');
  });

  it('does not propose unsafe/reserved device directories and conflicting targets',()=>{
    insert('alpha',join(root,'clients','X','Site','Ressources'));
    insert('beta',join(root,'clients','X','Site','Ressources'));
    insert('unsafe',join(root,'clients','CON','Site','Ressources'));
    insert('nonResource',join(root,'clients','X','Site','Exports'));
    const plan=planProjectResourceRelocations(sqlite,root,join(root,'next'));
    expect(plan.proposals.find(x=>x.projectId==='alpha')?.problem).toBe('conflicting-resource-roots');
    expect(plan.proposals.find(x=>x.projectId==='beta')?.problem).toBe('conflicting-resource-roots');
    expect(plan.proposals.find(x=>x.projectId==='unsafe')?.problem).toBe('invalid-resource-path');
    expect(plan.proposals.find(x=>x.projectId==='nonResource')?.problem).toBe('unexpected-resource-root');
    expect(plan.proposals.every(x=>!('destinationPath' in x))).toBe(true);
  });

  it('returns explicit missing schema and rejects unsafe destination',()=>{
    db.exec('DROP TABLE projects');
    const plan=planProjectResourceRelocations(sqlite,root,join(root,'next'));
    expect(plan.unavailableSchema).toEqual(['projects.resource_root_path']);
    expect(plan.readyForAutomaticMigration).toBe(false);
    expect(()=>planProjectResourceRelocations(sqlite,root,'relative/path')).toThrow(/workspace source ou destination/);
    expect(()=>planProjectResourceRelocations(sqlite,root,'\\\\?\\C:\\Untrusted')).toThrow(/workspace source ou destination/);
  });
});
