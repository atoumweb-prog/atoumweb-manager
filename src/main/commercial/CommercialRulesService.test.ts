import { afterEach, beforeEach, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { CatalogService } from './CatalogService';
import { CrmService } from '../crm/CrmService';
import { QuoteService } from './QuoteService';
import { ContractTermsService } from './ContractTermsService';
import { CommercialRulesService, commercialAbbyBlock } from './CommercialRulesService';
import type { CommercialVersionRules } from '../../shared/commercialRules';

let db:NodeSqliteAdapter, catalog:CatalogService, quotes:QuoteService, rules:CommercialRulesService, terms:ContractTermsService, prospect:string;
beforeEach(()=>{db=new NodeSqliteAdapter(':memory:');db.exec('PRAGMA foreign_keys=ON');applyPendingMigrations(db);const crm=new CrmService(db);catalog=new CatalogService(db);terms=new ContractTermsService(db);quotes=new QuoteService(db,crm,terms);rules=new CommercialRulesService(db);prospect=crm.createProspect({organizationId:crm.createOrganization({name:'TEST règles'}).id,primaryNeed:'Recette'}).id;});
afterEach(()=>db.close());
it('exige un périmètre et des exclusions autonomes pour une référence annuelle elliptique, puis conserve les engagements propres à la ligne',()=>{
 const monthly=catalog.create({type:'service',name:'TEST mensuel'},{priceMode:'fixed',priceCents:1000,inclusions:['Mises à jour et sauvegardes'],exclusions:['Refonte exclue']});catalog.publishVersion(monthly.versions[0].id);
 const annual=catalog.create({type:'service',name:'TEST annuel'},{priceMode:'fixed',priceCents:11000,inclusions:['Même périmètre que mensuel'],exclusions:['Mêmes exclusions']});catalog.publishVersion(annual.versions[0].id);
 let q=quotes.addCatalogLine(quotes.create({prospectId:prospect,subject:'TEST annuel'}).id,annual.versions[0].id),line=q.lines[0];expect(rules.issues(q)).toHaveLength(2);
 q=quotes.setLineParameters(line.id,{scope:'Mises à jour et sauvegardes',scopeExclusions:'Refonte exclue',scopeReference:{versionId:monthly.versions[0].id,label:'TEST mensuel',versionNumber:1},contractNature:'continuous',contractEvent:'Après validation écrite de la mise en ligne',serviceDuration:'12 mois',renewalTerms:'Fin au terme, sans renouvellement automatique'});
 expect(rules.issues(q)).toEqual([]);expect(q.lines[0].snapshot?.inclusions).toEqual(['Même périmètre que mensuel']);
 const p=terms.presentation(q.id);expect(p.text).toContain('Mises à jour et sauvegardes');expect(p.text).not.toContain('Mêmes exclusions');expect(p.text).toContain('12 mois');expect(p.text).toContain('sans renouvellement automatique');
 expect(p.text).not.toContain('Fourniture : Continue');expect(p.text).toContain('service continu');
 const changed=catalog.createVersion(monthly.id,{priceMode:'fixed',priceCents:3000,inclusions:['AUTRE PÉRIMÈTRE']});catalog.publishVersion(changed.id);expect(terms.presentation(q.id).text).not.toContain('AUTRE PÉRIMÈTRE');
 const copy=quotes.duplicate(q.id);expect(copy.lines[0].parameters?.scope).toBe('Mises à jour et sauvegardes');expect(copy.lines[0].parameters?.scopeReference?.versionId).toBe(monthly.versions[0].id);
 expect(()=>quotes.setLineParameters(line.id,{productCount:{kind:'additional',count:-1}})).toThrow(/produits/);expect(quotes.get(q.id).lines[0].parameters?.scope).toBe('Mises à jour et sauvegardes');
});
it('conserve une réalisation ponctuelle avec un événement objectif et ne fabrique pas de calendrier',()=>{
 const v=service('AW-TEST-DELAI',10000);let q=quotes.addCatalogLine(quotes.create({prospectId:prospect,subject:'TEST date'}).id,v),l=q.lines[0];
 q=quotes.setLineParameters(l.id,{contractNature:'one_off'});expect(rules.issues(q)).toEqual([expect.stringContaining('événement')]);
 q=quotes.setLineParameters(l.id,{contractNature:'one_off',contractEvent:'Après accord écrit sur la maquette',productCount:{kind:'additional',count:51}});expect(rules.issues(q)).toEqual([]);expect(q.lines[0].parameters?.acceptedDeadline).toBeUndefined();
});
function service(code:string, price:number, configuration?:CommercialVersionRules) {
  const item=catalog.create({type:'service',name:code,canonicalCode:code},{priceMode:'fixed',priceCents:price,abbyLabel:`Abby ${code}`,unit:'image'});
  const version=item.versions[0];if(configuration)rules.configure(version.id,configuration,{decision:'TEST explicite'});catalog.publishVersion(version.id);return version.id;
}
it.each([[1,4500],[2,4500],[5,4500],[6,5400],[10,9000]])('facture %i images sans inventer des unités', (qty,total)=>{
  const version=service('AW-PHOTO-DETOUR',900,{schemaVersion:1,minimumLineCents:4500});
  const q=quotes.addCatalogLine(quotes.create({prospectId:prospect,subject:'TEST détour'}).id,version,{quantityMilli:qty*1000});
  expect(q.lines[0].quantityMilli).toBe(qty*1000);expect(q.contractValueCents).toBe(total);
  expect(quotes.updateLine(q.lines[0].id,{label:'Images',quantityMilli:2000,proposedUnitPriceCents:900}).contractValueCents).toBe(4500);
  expect(commercialAbbyBlock(q)).toContain('Minimum de facturation : 45,00 €');
});
it('fige les règles publiées et le snapshot commercial',()=>{
  const v=service('AW-PHOTO-DETOUR',900,{schemaVersion:1,minimumLineCents:4500});
  expect(()=>rules.configure(v,{schemaVersion:1,minimumLineCents:1000},{})).toThrow(/brouillon/);
  expect(()=>db.run('DELETE FROM catalog_commercial_rules WHERE catalog_version_id=?',[v])).toThrow(/immutable/);
});
it('minimum horaire commercial : conserve 30 minutes ou 1 h 30 de quantité réelle',()=>{
  const v=service('AW-DEVWP-AJUST',6900,{schemaVersion:1,minimumBilledQuantityMilli:1000});
  const q=quotes.create({prospectId:prospect,subject:'TEST minimum horaire'});
  expect(quotes.addCatalogLine(q.id,v,{quantityMilli:500}).lines[0]).toMatchObject({quantityMilli:500,contractLineValueCents:6900});
  expect(quotes.updateLine(quotes.get(q.id).lines[0].id,{label:'TEST ajustement',quantityMilli:1500,proposedUnitPriceCents:6900}).lines[0]).toMatchObject({quantityMilli:1500,contractLineValueCents:10350});
});
it('conditions particulières indépendantes des clauses partagées, retrait orphelin et duplication personnalisée',()=>{
  const v=service('AW-MARIAGE-HISTOIRE',89900,{schemaVersion:1,particularTerms:{title:'Histoire uniquement',body:'Page protégée, médias directs non protégés. Intervention 2 h / 60 jours.'}});
  const q=quotes.addCatalogLine(quotes.create({prospectId:prospect,subject:'TEST Histoire'}).id,v);
  const t=terms.createTemplate({code:'MARIAGE-PRIVE',title:'Commun',scope:'catalog',audience:'all'},{body:'Commun intact'});
  terms.publishVersion(t.versions[0].id);terms.setCatalogLinks(t.id,[q.lines[0].catalogItemId!]);
  let build=terms.syncQuote(q.id);expect(build.clauses.filter(c=>c.sourceKind==='catalog')).toHaveLength(2);
  const particular=build.clauses.find(c=>c.title==='Histoire uniquement')!;
  terms.updateQuoteClause(particular.id,{body:'Version adaptée au dossier'});
  const copy=quotes.duplicate(q.id);expect(terms.getQuoteBuild(copy.id).clauses.some(c=>c.body==='Version adaptée au dossier')).toBe(true);
  quotes.removeLine(q.lines[0].id);build=terms.getQuoteBuild(q.id);expect(build.clauses.find(c=>c.id===particular.id)?.isOrphaned).toBe(true);
  expect(terms.getTemplate(t.id).currentVersion?.body).toBe('Commun intact');
});
it('une urgence exige un parent compatible, disponibilité et délai accepté, sans confondre demande et engagement',()=>{
  const productive=service('AW-CONT-ART-SEO',14900), urgency=service('AW-CONT-URGENT-48',5000,{schemaVersion:1,attachment:{kind:'priority',compatibleCodes:['AW-CONT-ART-SEO']}});
  let q=quotes.addCatalogLine(quotes.create({prospectId:prospect,subject:'TEST urgence'}).id,productive);
  q=quotes.addCatalogLine(q.id,urgency);expect(rules.issues(q)).toHaveLength(2);
  rules.setParameters(q.lines[1].id,{parentLineId:q.lines[0].id,requestedDeadline:'2026-11-01',availabilityConfirmed:false});expect(rules.issues(quotes.get(q.id))).toHaveLength(1);
  rules.setParameters(q.lines[1].id,{parentLineId:q.lines[0].id,requestedDeadline:'2026-11-01',availabilityConfirmed:true,acceptedDeadline:'2026-11-02'});expect(rules.issues(quotes.get(q.id))).toEqual([]);
  const copy=quotes.duplicate(q.id);expect(copy.lines[1].parameters?.parentLineId).toBe(copy.lines[0].id);
  quotes.removeLine(q.lines[0].id);expect(rules.issues(quotes.get(q.id))[0]).toContain('principale');
  expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
});
