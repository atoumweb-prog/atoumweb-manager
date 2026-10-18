import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {describe,expect,it} from 'vitest';

const source=readFileSync(join(process.cwd(),'src/main/ipc.ts'),'utf8');
const handlers=[...source.matchAll(/ipcMain\.handle\('([^']+)'/g)]
  .map(m=>({name:m[1],index:m.index!}));
function handler(name:string):string {
  const selected=handlers.filter(x=>x.name===name);
  if(selected.length!==1)throw Error('Route IPC absente ou dupliquée : '+name);
  return source.slice(selected[0].index,handlers.find(x=>x.index>selected[0].index)?.index??source.length);
}

describe('EC04 write barrier: previously untracked exports and receipt preview',()=>{
  it('protects each selected physical file mutation without waiting on UI dialogs',()=>{
    for(const name of [
      'bridge:export-diagnostic','contract-terms:word:export',
      'contract-terms:word:pdf','contract-terms:export-working-docx',
    ]) {
      const code=handler(name);
      expect(code,name).toContain('guardedMutation(');
      expect(code.indexOf('dialog.showSaveDialog'),name).toBeLessThan(code.indexOf('guardedMutation('));
    }
    const receipt=handler('expenses:open-receipt-version');
    expect(receipt.indexOf('guardedMutation(')).toBeLessThan(receipt.indexOf('shell.openPath(preview)'));
    expect(receipt).toContain('database.expenses.prepareReceiptVersionPreview(id, relativePath)');
  });
  it('revalidates Word/PDF source after waiting for EC04',()=>{
    for(const name of ['contract-terms:word:export','contract-terms:word:pdf']){
      const code=handler(name);
      expect(code.indexOf('const latest=clauseDraft')).toBeGreaterThan(code.indexOf('guardedMutation('));
    }
    const doc=handler('contract-terms:export-working-docx');
    expect(doc.indexOf('const current=database.contractTerms.presentation(quoteId)'))
      .toBeGreaterThan(doc.indexOf('guardedMutation('));
  });
  it('does not convert a working copy into an attested commercial send',()=>{
    for(const name of ['contract-terms:word:export','contract-terms:word:pdf',
      'contract-terms:export-working-docx']) {
      const code=handler(name);
      expect(code).not.toContain('database.quotes.markSent(');
      expect(code).not.toContain('database.quotes.accept(');
    }
  });
});
