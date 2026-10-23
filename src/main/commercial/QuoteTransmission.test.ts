import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations, MIGRATIONS } from '../database/migrations';
import { CrmService } from '../crm/CrmService';
import { QuoteService } from './QuoteService';
import { ContractTermsService } from './ContractTermsService';
import { QuoteContractPreparationService } from './QuoteContractPreparationService';
import { prepareQuoteForTest } from '../testSupport/quotePreparationFixture';
import { activePreparation, contractHash } from './quoteTransmission';
import { quoteContractText } from '../../shared/contractTerms';
import { buildQuoteHtml } from './quotePdf';
import type { QuoteSendAttestation } from '../../shared/quoteTransmission';
import { mkdtempSync, rmSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';

let db:NodeSqliteAdapter, quotes:QuoteService, terms:ContractTermsService, preparation:QuoteContractPreparationService, id:string;
beforeEach(()=>{
  db=new NodeSqliteAdapter(':memory:');db.exec('PRAGMA foreign_keys=ON;');applyPendingMigrations(db);
  const crm=new CrmService(db),org=crm.createOrganization({name:'EC03 — synthétique'}),prospect=crm.createProspect({organizationId:org.id,primaryNeed:'Fixture'});
  terms=new ContractTermsService(db);preparation=new QuoteContractPreparationService(db);quotes=new QuoteService(db,crm,terms,preparation);
  id=quotes.create({prospectId:prospect.id,subject:'Cycle EC03 synthétique'}).id;
  quotes.addCustomLine(id,{label:'Prestation synthétique',proposedUnitPriceCents:12345});prepareQuoteForTest(db,id);
});
afterEach(()=>{vi.restoreAllMocks();db.close();});
function attestation():QuoteSendAttestation {
  const state=quotes.transmissionState(id);
  return {operationId:crypto.randomUUID(),preparationId:state.preparationId,contentHash:state.contentHash!,occurredAt:'2026-09-01T12:00:00.000Z',channel:'abby',provenance:'Courriel synthétique : version explicitement vérifiée',confirmed:true};
}
function dump(){return {
  quote:db.get('SELECT * FROM quotes WHERE id=?',[id]),clauses:db.all('SELECT * FROM quote_contract_clauses WHERE quote_id=? ORDER BY id',[id]),
  history:db.all('SELECT * FROM activity_log ORDER BY rowid'),prospects:db.all('SELECT * FROM prospects'),
  preparations:db.all('SELECT * FROM quote_contract_preparations'),transmissions:db.all('SELECT * FROM quote_contract_transmissions'),
};}
function republish(){
  const base=terms.listTemplates().find(t=>t.scope==='base')!;
  const next=terms.createVersion(base.id,{body:'Nouvelles CGV — adoption volontaire uniquement'});terms.publishVersion(next.id);return next;
}

describe('EC03 — préparation / envoi / acceptation',()=>{
  it('prépare sans envoyer ni geler définitivement, puis reprend explicitement le brouillon',()=>{
    expect(()=>terms.freezeQuote(id)).toThrow(/envoi attesté/);
    const q=quotes.finalize(id),first=activePreparation(db,id)!;
    expect(q.status).toBe('draft');expect(q.sentAt).toBeNull();expect(q.contractSnapshotJson).toBeNull();expect(q.contractCompiledAt).toBeNull();
    expect(terms.getQuoteBuild(id).snapshotState).toBe('prepared');expect(preparation.get(id).state).toBe('prepared');
    expect(()=>quotes.updateConditions(id,{subject:'Interdit avant reprise'})).toThrow();
    const resumed=quotes.resumeDraft(id,first.id);expect(resumed.finalizedAt).toBeNull();
    quotes.updateConditions(id,{subject:'Repris explicitement'});quotes.finalize(id);
    expect(activePreparation(db,id)?.id).not.toBe(first.id);expect(db.get('SELECT * FROM quote_contract_preparations WHERE id=?',[first.id])).toEqual(first);
    expect(db.all("SELECT * FROM activity_log WHERE action='quote_contract_frozen'")).toHaveLength(0);
    expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
  });
  it('conserve exactement la préparation malgré une publication ultérieure et accepte la même version',()=>{
    quotes.finalize(id);const prepared=activePreparation(db,id)!;republish();const input=attestation();
    const sent=quotes.markSent(id,input);
    expect(sent.contractTextSnapshot).toBe(prepared.text_snapshot);expect(sent.contractSnapshotJson).toBe(prepared.snapshot_json);
    expect(sent.contractTextSnapshot).not.toContain('Nouvelles CGV');expect(sent.sentAt).toBe(input.occurredAt);
    preparation.recordAcceptance(id,'Version envoyée effectivement acceptée','2026-09-02T12:00:00Z','Preuve synthétique explicite');
    const accepted=quotes.accept(id);expect(accepted.status).toBe('accepted');expect(accepted.contractSnapshotJson).toBe(prepared.snapshot_json);
    expect(quotes.accept(id)).toEqual(accepted);expect(db.all('SELECT * FROM quote_contract_transmissions')).toHaveLength(1);
    expect(db.get('PRAGMA integrity_check')).toEqual({integrity_check:'ok'});
  });
  it('consulte, présente et génère le HTML sans mutation, même après publication',()=>{
    republish();const before=dump();
    for(let n=0;n<3;n++){const q=quotes.get(id),build=terms.getQuoteBuild(id);buildQuoteHtml({...q,contractTextSnapshot:quoteContractText(build)},terms.presentation(id));preparation.get(id);terms.proposeQuoteUpdate(id);}
    expect(dump()).toEqual(before);
    quotes.finalize(id);const prepared=dump();terms.presentation(id);preparation.get(id);quotes.get(id);expect(dump()).toEqual(prepared);
  });
  it('compare sans écrire, refuse une comparaison périmée et conserve les personnalisations',()=>{
    const custom=terms.addCustomQuoteClause(id,{title:'Clause négociée',body:'Texte négocié conservé.'}).clauses.find(c=>c.sourceKind==='custom')!;
    republish();const before=dump(),proposal=terms.proposeQuoteUpdate(id);expect(proposal.changes.length).toBeGreaterThan(0);expect(dump()).toEqual(before);
    terms.updateQuoteClause(custom.id,{body:'Brouillon enregistré dans une autre fenêtre'});
    const concurrent=dump();expect(()=>terms.applyQuoteUpdate(id,proposal.token)).toThrow(/périmée/);expect(dump()).toEqual(concurrent);
    const fresh=terms.proposeQuoteUpdate(id);terms.applyQuoteUpdate(id,fresh.token);
    expect(terms.getQuoteBuild(id).compiledText).toContain('Nouvelles CGV');expect(terms.getQuoteBuild(id).clauses.find(c=>c.id===custom.id)?.body).toBe('Brouillon enregistré dans une autre fenêtre');
    const stable=dump(),noop=terms.proposeQuoteUpdate(id);expect(noop.changes).toHaveLength(0);terms.applyQuoteUpdate(id,noop.token);expect(dump()).toEqual(stable);
  });
  it('conserve les versions non personnalisées et personnalisées lors de la création d’une copie',()=>{
    terms.addCustomQuoteClause(id,{title:'Accord particulier',body:'Texte particulier'});quotes.finalize(id);quotes.markSent(id,attestation());
    const original=quotes.get(id),before=terms.getQuoteBuild(id).clauses;republish();const copy=quotes.duplicate(id);
    const shape=(c:ReturnType<typeof terms.getQuoteBuild>['clauses'][number])=>({key:c.sourceKey,version:c.sourceClauseVersionId,body:c.body,title:c.title,enabled:c.enabled,order:c.sortOrder,custom:c.isCustomized});
    expect(terms.getQuoteBuild(copy.id).clauses.map(shape)).toEqual(before.map(shape));expect(quotes.get(id)).toEqual(original);
    expect(copy.status).toBe('draft');expect(copy.contractSnapshotJson).toBeNull();expect(preparation.links(copy.id)).toEqual([]);
  });
  it('rejoue la même attestation sans double événement et refuse sa réutilisation ambiguë',()=>{
    quotes.finalize(id);const input=attestation();quotes.markSent(id,input);const before=dump();
    quotes.markSent(id,input);expect(dump()).toEqual(before);
    expect(()=>quotes.markSent(id,{...input,provenance:'Autre preuve'})).toThrow(/déjà utilisé/);expect(dump()).toEqual(before);
    expect(()=>quotes.markSent(id,{...input,operationId:crypto.randomUUID()})).toThrow(/non encore envoyé/);expect(dump()).toEqual(before);
    expect(db.all("SELECT * FROM activity_log WHERE action='quote_sent'")).toHaveLength(1);
  });
  it('horodate maintenant dans le processus principal et conserve cette date au rejeu',()=>{
    quotes.finalize(id);const input={...attestation(),occurredAt:'now'},before=Date.now(),sent=quotes.markSent(id,input);
    expect(Date.parse(sent.sentAt!)).toBeGreaterThanOrEqual(before);expect(Date.parse(sent.sentAt!)).toBeLessThanOrEqual(Date.now());
    const state=dump();expect(quotes.markSent(id,input).sentAt).toBe(sent.sentAt);expect(dump()).toEqual(state);
  });
  it('refuse un destinataire changé avant envoi et conserve ensuite son nom sur le document transmis',()=>{
    const original=quotes.get(id).ownerLabel;quotes.finalize(id);const input=attestation();
    const rename=(name:string)=>db.run('UPDATE organizations SET name=? WHERE id=(SELECT organization_id FROM prospects WHERE id=(SELECT prospect_id FROM quotes WHERE id=?))',[name,id]);
    rename('Nouveau destinataire avant envoi');const before=dump();
    expect(()=>quotes.markSent(id,input)).toThrow(/destinataire a changé/);expect(dump()).toEqual(before);
    rename(original);const sent=quotes.markSent(id,input);rename('Nouvelle dénomination après envoi');
    const current=quotes.get(id);expect(current.ownerLabel).toBe('Nouvelle dénomination après envoi');
    expect(current.contractRecipientLabel).toBe(original);expect(current.contractSnapshotJson).toBe(sent.contractSnapshotJson);
    const html=buildQuoteHtml(current,terms.presentation(id));expect(html).toContain(original);expect(html).not.toContain('Nouvelle dénomination après envoi');
  });
  it('lie la preuve à la transmission exacte et annule son insertion si le journal échoue',()=>{
    quotes.finalize(id);quotes.markSent(id,attestation());const before=preparation.links(id),run=db.run.bind(db);let injected=0;
    const spy=vi.spyOn(db,'run').mockImplementation((sql,args)=>{if(sql.includes('INSERT INTO activity_log')){injected++;throw Error('Journal preuve indisponible');}return run(sql,args);});
    expect(()=>preparation.recordAcceptance(id,'Accord reçu','2026-09-02','Message fixture')).toThrow('Journal preuve indisponible');
    expect(injected).toBe(1);expect(preparation.links(id)).toEqual(before);spy.mockRestore();
    preparation.recordAcceptance(id,'Accord reçu','2026-09-02','Message fixture');
    expect(preparation.links(id).at(-1)?.transmissionId).toBe(quotes.transmissionState(id).transmissionId);
  });
  it('copie les clauses du snapshot envoyé et refuse un historique ambigu',()=>{
    quotes.finalize(id);quotes.markSent(id,attestation());const sent=quotes.get(id);
    db.run('UPDATE quote_contract_clauses SET body=? WHERE quote_id=?',['Altération externe des instances',id]);
    const copy=quotes.duplicate(id);expect(terms.getQuoteBuild(copy.id).compiledText).toBe(sent.contractTextSnapshot);
    db.run('UPDATE quotes SET contract_snapshot_json=NULL WHERE id=?',[id]);const before=dump();
    expect(()=>quotes.duplicate(id)).toThrow(/ambiguë/);expect(dump()).toEqual(before);
  });
  it.each(['missing','future','hash','preparation'] as const)('refuse une attestation %s sans mutation',kind=>{
    quotes.finalize(id);const input=attestation(),before=dump();
    if(kind==='future')input.occurredAt='2999-01-01';if(kind==='hash')input.contentHash='wrong';if(kind==='preparation')input.preparationId='wrong';
    expect(()=>quotes.markSent(id,kind==='missing'?undefined:input)).toThrow();expect(dump()).toEqual(before);
  });
  it('refuse un devis modifié après préparation sans toucher au contrat',()=>{
    quotes.finalize(id);const input=attestation();db.run('UPDATE quotes SET subject=? WHERE id=?',['Modification externe',id]);const before=dump();
    expect(()=>quotes.markSent(id,input)).toThrow(/changé depuis/);expect(dump()).toEqual(before);
    db.run('UPDATE quotes SET contract_text_snapshot=? WHERE id=?',['Snapshot apparu entre-temps',id]);const frozen=dump();
    expect(()=>quotes.markSent(id,input)).toThrow(/déjà figé|ambigu/);expect(dump()).toEqual(frozen);
  });
  it('conserve une préparation et une seule transmission entre deux connexions SQLite',async()=>{
    quotes.finalize(id);const input=attestation(),root=mkdtempSync(join(tmpdir(),'atoum-ec03-concurrent-')),file=join(root,'fixture.sqlite');
    let one:NodeSqliteAdapter|undefined,two:NodeSqliteAdapter|undefined;
    try{
      await db.backupTo(file);one=new NodeSqliteAdapter(file);two=new NodeSqliteAdapter(file);
      for(const connection of [one,two])connection.exec('PRAGMA foreign_keys=ON;');
      const first=new QuoteService(one,new CrmService(one)),second=new QuoteService(two,new CrmService(two));
      const stale=second.transmissionState(id);first.markSent(id,input);
      expect(second.markSent(id,input).status).toBe('sent');
      expect(()=>second.markSent(id,{...input,operationId:crypto.randomUUID(),contentHash:stale.contentHash!})).toThrow();
      expect(one.all('SELECT * FROM quote_contract_transmissions')).toHaveLength(1);
      expect(two.all("SELECT * FROM activity_log WHERE action='quote_sent'")).toHaveLength(1);
      expect(two.all('PRAGMA foreign_key_check')).toEqual([]);
    }finally{
      one?.close();two?.close();const target=resolve(root);
      if(!target.startsWith(resolve(tmpdir())+sep)||!target.includes('atoum-ec03-concurrent-'))throw Error('Chemin temporaire invalide');
      rmSync(target,{recursive:true,force:true});
    }
  });
  it('refuse une reprise périmée et annule une reprise dont le journal échoue',()=>{
    quotes.finalize(id);const prepared=activePreparation(db,id)!,before=dump();
    expect(()=>quotes.resumeDraft(id,'autre-préparation')).toThrow();expect(dump()).toEqual(before);
    const run=db.run.bind(db);let injected=0;
    vi.spyOn(db,'run').mockImplementation((sql,args)=>{if(sql.includes('INSERT INTO activity_log')){injected++;throw Error('Journal indisponible');}return run(sql,args);});
    expect(()=>quotes.resumeDraft(id,prepared.id)).toThrow('Journal indisponible');expect(injected).toBe(1);expect(dump()).toEqual(before);
  });
  it('annule intégralement une actualisation si son journal échoue',()=>{
    republish();const proposal=terms.proposeQuoteUpdate(id),before=dump(),run=db.run.bind(db);let injected=0;
    vi.spyOn(db,'run').mockImplementation((sql,args)=>{if(sql.includes('INSERT INTO activity_log')){injected++;throw Error('Journal indisponible');}return run(sql,args);});
    expect(()=>terms.applyQuoteUpdate(id,proposal.token)).toThrow('Journal indisponible');expect(injected).toBe(1);expect(dump()).toEqual(before);
  });
  it('préserve un ancien brouillon finalisé complet sans l’ouvrir au nouveau mécanisme de reprise',()=>{
    const json=JSON.stringify({audience:'professional',clauses:[],historical:'exact'});
    db.run('UPDATE quotes SET finalized_at=?,contract_compiled_at=?,contract_text_snapshot=?,contract_snapshot_json=? WHERE id=?',['2026-09-01','2026-09-01','Ancien texte exact',json,id]);
    const before=dump();expect(()=>quotes.resumeDraft(id,'anything')).toThrow();expect(terms.getQuoteBuild(id).snapshotText).toBe('Ancien texte exact');expect(dump()).toEqual(before);
    const sent=quotes.markSent(id,attestation());expect(sent.contractSnapshotJson).toBe(json);expect(sent.contractTextSnapshot).toBe('Ancien texte exact');
    expect(db.get<{legacy:number}>('SELECT legacy FROM quote_contract_transmissions WHERE quote_id=?',[id])?.legacy).toBe(1);
  });
  it.each(['transmission','status','prospect','history'] as const)('annule toutes les écritures si erreur pendant %s',phase=>{
    quotes.finalize(id);const input=attestation(),before=dump(),run=db.run.bind(db);
    const fail=phase==='transmission'?'INSERT INTO quote_contract_transmissions':phase==='status'?"UPDATE quotes SET status='sent'":phase==='prospect'?"UPDATE prospects SET stage='quote_sent'":'INSERT INTO activity_log';
    let injected=0;
    vi.spyOn(db,'run').mockImplementation((sql,args)=>{if(sql.includes(fail)){injected++;throw Error('Injection EC03');}return run(sql,args);});
    expect(()=>quotes.markSent(id,input)).toThrow('Injection EC03');expect(injected).toBe(1);expect(dump()).toEqual(before);
  });
  it('rend les registres immuables et ne permet plus la reprise après envoi',()=>{
    quotes.finalize(id);const prepared=activePreparation(db,id)!;quotes.markSent(id,attestation());const before=dump();
    expect(()=>db.run('UPDATE quote_contract_preparations SET text_snapshot=? WHERE id=?',['Autre',prepared.id])).toThrow(/immuable/);
    expect(()=>db.run('DELETE FROM quote_contract_preparations WHERE id=?',[prepared.id])).toThrow(/immuable/);
    expect(()=>db.run('UPDATE quote_contract_transmissions SET provenance=?',['Autre'])).toThrow(/immuable/);
    db.run('UPDATE demo_context SET contract_purge=1 WHERE id=1');
    expect(()=>db.run('DELETE FROM quote_contract_transmissions WHERE quote_id=?',[id])).toThrow(/immuable/);
    db.run('UPDATE demo_context SET contract_purge=0 WHERE id=1');
    expect(()=>quotes.resumeDraft(id,prepared.id)).toThrow(/Reprise refusée/);expect(dump()).toEqual(before);
  });
  it('annule les DDL de 71 et conserve le registre historique si la migration échoue',()=>{
    const legacy=new NodeSqliteAdapter(':memory:'),migration=MIGRATIONS.find(m=>m.id===71)!,sql=migration.sql;
    try{
      legacy.exec('PRAGMA foreign_keys=ON;CREATE TABLE schema_migrations(id INTEGER PRIMARY KEY,name TEXT NOT NULL,applied_at TEXT NOT NULL) STRICT;');
      for(const previous of MIGRATIONS.filter(m=>m.id<71)){legacy.exec(previous.sql);legacy.run('INSERT INTO schema_migrations VALUES(?,?,?)',[previous.id,previous.name,'2026-09-01']);}
      const ledger=legacy.all('SELECT * FROM schema_migrations ORDER BY id');
      migration.sql=sql+'\nSELECT * FROM ec03_injected_missing_table;';
      expect(()=>applyPendingMigrations(legacy)).toThrow(/ec03_injected/);
      expect(legacy.all('SELECT * FROM schema_migrations ORDER BY id')).toEqual(ledger);
      expect(legacy.get("SELECT name FROM sqlite_master WHERE name='quote_contract_preparations'")).toBeUndefined();
      expect(legacy.all<{name:string}>("PRAGMA table_info(quotes)").some(c=>c.name==='contract_preparation_id')).toBe(false);
      expect(legacy.all('PRAGMA foreign_key_check')).toEqual([]);
      migration.sql=sql;expect(applyPendingMigrations(legacy).map(m=>m.id)).toEqual([71,72,73,74]);
    }finally{migration.sql=sql;legacy.close();}
  });
  it('refuse une acceptation dont le snapshot ne correspond plus à la transmission',()=>{
    quotes.finalize(id);quotes.markSent(id,attestation());preparation.recordAcceptance(id,'Accepté','2026-09-02','Fixture');
    db.run('UPDATE quotes SET contract_text_snapshot=? WHERE id=?',['Altération externe',id]);const before=dump();
    expect(()=>quotes.accept(id)).toThrow(/contrat transmis/);expect(dump()).toEqual(before);
  });
  it('conserve les historiques partiels sans les reconstruire ni les dégeler',()=>{
    db.run("UPDATE quotes SET status='sent',finalized_at='2026-09-01',contract_compiled_at='2026-09-01' WHERE id=?",[id]);
    const before=dump();republish();const published=dump();
    expect(terms.getQuoteBuild(id).warnings.join(' ')).toMatch(/incomplet/);expect(quotes.get(id).contractSnapshotJson).toBeNull();
    expect(()=>quotes.resumeDraft(id,'missing')).toThrow();expect(dump()).toEqual(published);expect(before.quote).toEqual(published.quote);
  });
  it('ajoute la migration sans synthèse ni modification des historiques 1–70',()=>{
    const legacy=new NodeSqliteAdapter(':memory:');
    try{
      legacy.exec('CREATE TABLE schema_migrations(id INTEGER PRIMARY KEY,name TEXT NOT NULL,applied_at TEXT NOT NULL) STRICT;');
      for(const migration of MIGRATIONS.filter(m=>m.id<=70)){legacy.exec(migration.sql);legacy.run('INSERT INTO schema_migrations VALUES(?,?,?)',[migration.id,migration.name,'2026-09-01']);}
      const history=legacy.all('SELECT * FROM schema_migrations'),oldQuotes=legacy.all('SELECT * FROM quotes');
      expect(applyPendingMigrations(legacy).map(m=>m.id)).toEqual([71,72,73,74]);expect(legacy.all('SELECT * FROM schema_migrations WHERE id<=70')).toEqual(history);
      expect(legacy.all('SELECT * FROM quote_contract_transmissions')).toEqual([]);expect(legacy.all('SELECT * FROM quote_contract_preparations')).toEqual([]);
      expect(legacy.all('SELECT * FROM quotes')).toEqual(oldQuotes);expect(legacy.all('PRAGMA foreign_key_check')).toEqual([]);expect(legacy.get('PRAGMA integrity_check')).toEqual({integrity_check:'ok'});
      expect(applyPendingMigrations(legacy)).toEqual([]);
    }finally{legacy.close();}
    const prepared=quotes.finalize(id);expect(prepared.contractPreparationId).toBeTruthy();expect(activePreparation(db,id)?.content_hash).toBe(contractHash([activePreparation(db,id)!.text_snapshot,activePreparation(db,id)!.snapshot_json]));
  });
});
