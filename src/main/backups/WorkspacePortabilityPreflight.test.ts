import {createHash} from 'node:crypto';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {inspectWorkspacePortabilityRisks} from './WorkspacePortabilityPreflight';

let root:string,sqlite:string,db:DatabaseSync;
beforeEach(()=>{
  root=mkdtempSync(join(tmpdir(),'ec04-portability-'));
  sqlite=join(root,'fixture.sqlite');
  db=new DatabaseSync(sqlite);
  db.exec('CREATE TABLE projects(id TEXT PRIMARY KEY,resource_root_path TEXT); CREATE TABLE project_node_secrets(id TEXT PRIMARY KEY,secret_ciphertext TEXT);');
});
afterEach(()=>{db.close();rmSync(root,{recursive:true,force:true});});

describe('EC04 read-only portability risk preflight',()=>{
  it('finds internal absolute, external and relative resource roots',()=>{
    db.prepare('INSERT INTO projects VALUES (?,?)').run('internal',join(root,'clients','c1'));
    db.prepare('INSERT INTO projects VALUES (?,?)').run('external',join(tmpdir(),'external'));
    db.prepare('INSERT INTO projects VALUES (?,?)').run('relative','clients/c3');
    const report=inspectWorkspacePortabilityRisks(sqlite,root);
    expect(report.inspectedProjects).toBe(3);
    expect(report.findings.map(x=>x.kind)).toEqual([
      'absolute-root-needs-relocation','root-outside-workspace','relative-root-needs-normalization',
    ]);
    expect(report.crossPcCertified).toBe(false);
  });
  it('reports OS-bound secrets without reading or exposing the ciphertext',()=>{
    db.prepare('INSERT INTO project_node_secrets VALUES (?,?)').run('secret-1','confidential-encrypted-by-windows');
    const before=createHash('sha256').update(readFileSync(sqlite)).digest('hex');
    const report=inspectWorkspacePortabilityRisks(sqlite,root);
    expect(report.encryptedSecretCount).toBe(1);
    expect(report.findings).toEqual([{table:'project_node_secrets',recordId:'secret-1',kind:'windows-encrypted-secret'}]);
    expect(JSON.stringify(report)).not.toContain('confidential-encrypted-by-windows');
    expect(createHash('sha256').update(readFileSync(sqlite)).digest('hex')).toBe(before);
  });
  it('recognizes Windows paths even while fixtures run on another operating system',()=>{
    db.prepare('INSERT INTO projects VALUES (?,?)').run('win-inside','C:\\Manager\\clients\\C1');
    db.prepare('INSERT INTO projects VALUES (?,?)').run('win-external','D:\\Archive\\other');
    const report=inspectWorkspacePortabilityRisks(sqlite,'C:\\Manager');
    expect(report.findings.map(x=>x.kind)).toEqual([
      'absolute-root-needs-relocation','root-outside-workspace',
    ]);
  });
  it('leaves schema omissions explicit and never claims complete portability',()=>{
    db.close();
    db=new DatabaseSync(sqlite);
    db.exec('DROP TABLE project_node_secrets');
    const report=inspectWorkspacePortabilityRisks(sqlite,root);
    expect(report.unavailableSchema).toContain('project_node_secrets.secret_ciphertext');
    expect(report.crossPcCertified).toBe(false);
    expect(report.completeReferenceCoverage).toBe(false);
  });
});
