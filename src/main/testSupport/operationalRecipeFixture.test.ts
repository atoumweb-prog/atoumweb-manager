import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {existsSync, mkdtempSync, readFileSync, readdirSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve, sep} from 'node:path';
import {NodeSqliteAdapter} from '../database/NodeSqliteAdapter';
import {MIGRATIONS} from '../database/migrations';
import {createOperationalRecipeFixture} from './operationalRecipeFixture';
import data from './operationalRecipeFixture.json';

let root: string;
beforeEach(() => {root=mkdtempSync(join(tmpdir(),'atoumweb-fixture-export-test-'));});
afterEach(() => {
  vi.restoreAllMocks();
  expect(resolve(root).startsWith(resolve(tmpdir())+sep)).toBe(true);
  rmSync(root,{recursive:true,force:true});
  expect(existsSync(root)).toBe(false);
});

describe('operational fixture SQLite export',()=>{
  it('exports a complete independent migrated database, with integrity and references intact',()=>{
    const first=join(root,'first.sqlite'),second=join(root,'second.sqlite');
    createOperationalRecipeFixture(first);createOperationalRecipeFixture(second);
    const one=new NodeSqliteAdapter(first),two=new NodeSqliteAdapter(second);
    try{
      for(const db of [one,two]){
        expect(db.all('SELECT id,name FROM schema_migrations ORDER BY id')).toEqual(MIGRATIONS.map(({id,name})=>({id,name})));
        expect(db.get('PRAGMA integrity_check')).toEqual({integrity_check:'ok'});
        expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
        expect(db.get('PRAGMA journal_mode')).toEqual({journal_mode:'delete'});
        expect(db.get('PRAGMA synchronous')).toEqual({synchronous:2});
        for(const entry of data.models){
          expect(JSON.parse(String(db.get('SELECT model_json FROM operational_model_versions WHERE canonical_code=?',[entry.model.code])?.model_json))).toEqual(entry.model);
        }
      }
      one.run("INSERT INTO settings(key,value_json,updated_at) VALUES('fixture-independence','true','2026-10-09T00:00:00Z')");
      expect(two.get("SELECT value_json FROM settings WHERE key='fixture-independence'")).toBeUndefined();
      expect(readdirSync(root).sort()).toEqual(['first.sqlite','second.sqlite']);
    }finally{one.close();two.close();}
  });
  it('does not leave a partially seeded file when fixture loading fails',()=>{
    const file=join(root,'failed.sqlite'),original=NodeSqliteAdapter.prototype.run;
    vi.spyOn(NodeSqliteAdapter.prototype,'run').mockImplementation(function(this:NodeSqliteAdapter,sql,parameters){
      if(sql.startsWith('INSERT INTO operational_import_runs'))throw Error('fixture insertion failure');
      return original.call(this,sql,parameters);
    });
    expect(()=>createOperationalRecipeFixture(file)).toThrow('fixture insertion failure');
    expect(readdirSync(root)).toEqual([]);
  });
  it('refuses to overwrite an existing SQLite file, preserving its original bytes',()=>{
    const file=join(root,'existing.sqlite'),db=new NodeSqliteAdapter(file);
    db.exec("CREATE TABLE marker(value TEXT);INSERT INTO marker VALUES('preserve');");db.close();
    const before=readFileSync(file);
    expect(()=>createOperationalRecipeFixture(file)).toThrow(/already exists/i);
    expect(readFileSync(file)).toEqual(before);
    expect(readdirSync(root)).toEqual(['existing.sqlite']);
  });
});
