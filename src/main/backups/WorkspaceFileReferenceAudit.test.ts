import {DatabaseSync} from 'node:sqlite';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {auditKnownWorkspaceFileReferences} from './WorkspaceFileReferenceAudit';
import type {WorkspaceFileInventory} from './WorkspaceFileInventory';

let dir:string, file:string, db:DatabaseSync;
const inventory:WorkspaceFileInventory={version:1,totalBytes:5,scannedRoots:['crm-identites'],missingRoots:[],referencesVerified:false,
  files:[{relativePath:'crm-identites/entreprises/org/logo.png',sizeBytes:5,sha256:'x'}]};
beforeEach(()=>{
  dir=mkdtempSync(join(tmpdir(),'ec04-refs-'));file=join(dir,'test.sqlite');db=new DatabaseSync(file);
  db.exec('CREATE TABLE crm_identity_assets(id TEXT PRIMARY KEY,relative_path TEXT);'+
          'CREATE TABLE client_documents(id TEXT PRIMARY KEY,relative_path TEXT);');
});
afterEach(()=>{db.close();rmSync(dir,{recursive:true,force:true});});

describe('EC04 read-only SQLite file-reference audit',()=>{
  it('distingue fichiers présents, absents, externes, suspects et mauvaises racines',()=>{
    const logo=db.prepare('INSERT INTO crm_identity_assets VALUES (?,?)');
    logo.run('a','crm-identites\\entreprises\\org\\logo.png');
    logo.run('b','crm-identites/entreprises/org/missing.png');
    const doc=db.prepare('INSERT INTO client_documents VALUES (?,?)');
    doc.run('c','C:\\external\\client.pdf');
    doc.run('d','../../elsewhere.pdf');
    doc.run('e','bridge/outside.html');
    const result=auditKnownWorkspaceFileReferences(file,inventory);
    expect(result.checked).toBe(5);expect(result.matchingFiles).toBe(1);
    expect(result.issues.map(issue=>issue.problem).sort()).toEqual(['external-path','missing-file','unsafe-path','unexpected-root'].sort());
    expect(result.coverageComplete).toBe(false);
    expect(result.skippedTables).toContain('expenses');
  });
  it('ne complète jamais silencieusement les références manquantes',()=>{
    db.prepare('INSERT INTO crm_identity_assets VALUES (?,?)').run('b','crm-identites/entreprises/org/missing.png');
    const result=auditKnownWorkspaceFileReferences(file,inventory);
    expect(result.issues[0].recordId).toBe('b');
    expect(result.issues[0].problem).toBe('missing-file');
    expect(db.prepare('SELECT relative_path FROM crm_identity_assets WHERE id=?').get('b')?.relative_path).toBe('crm-identites/entreprises/org/missing.png');
  });
});
