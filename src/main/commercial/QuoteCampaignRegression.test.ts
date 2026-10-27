import {beforeEach,afterEach,it,expect} from 'vitest';
import {NodeSqliteAdapter} from '../database/NodeSqliteAdapter';
import {applyPendingMigrations} from '../database/migrations';
import {CrmService} from '../crm/CrmService';
import {QuoteService} from './QuoteService';
import {ContractTermsService} from './ContractTermsService';
import {QuoteContractPreparationService} from './QuoteContractPreparationService';
import {prepareQuoteForTest} from '../testSupport/quotePreparationFixture';
import {buildQuoteHtml} from '../../shared/quoteDocumentHtml';
import {paymentMilestones} from '../../shared/quoteContractPreparation';
let db:NodeSqliteAdapter,crm:CrmService,quotes:QuoteService,terms:ContractTermsService,prep:QuoteContractPreparationService,id:string;
beforeEach(()=>{db=new NodeSqliteAdapter(':memory:');db.exec('PRAGMA foreign_keys=ON');applyPendingMigrations(db);crm=new CrmService(db);terms=new ContractTermsService(db);prep=new QuoteContractPreparationService(db);quotes=new QuoteService(db,crm,terms,prep);const org=crm.createOrganization({name:'TEST enseigne',legalName:'TEST société contractante',addressLine1:'1 rue TEST',postalCode:'21000',city:'Dijon',country:'France',siret:'TEST uniquement',email:'contact@example.invalid'});const p=crm.createProspect({organizationId:org.id,primaryNeed:'TEST'});id=quotes.create({prospectId:p.id,subject:'TEST'}).id;quotes.addCustomLine(id,{label:'Création',quantityMilli:1000,proposedUnitPriceCents:69900});});
afterEach(()=>db.close());
it('MOD08 synchronise les produits et refuse une description personnalisée obsolète sans mutation partielle',()=>{
 let q=quotes.addCustomLine(id,{label:'Produits supplémentaires — 11 à 20',quantityMilli:5000,proposedUnitPriceCents:1900});const line=q.lines[1];quotes.setLineParameters(line.id,{productCount:{kind:'additional',count:5}});
 q=quotes.updateLine(line.id,{...line,quantityMilli:11000});expect(q.lines[1].parameters?.productCount?.count).toBe(11);expect(q.lines[1].contractLineValueCents).toBe(20900);expect(quotes.preparationIssues(id).join(' ')).toContain('tranche');
 q=quotes.updateLine(line.id,{...q.lines[1],description:'Onze produits selon notre échange'});const before=quotes.get(id);expect(()=>quotes.updateLine(line.id,{...q.lines[1],quantityMilli:12000})).toThrow(/description personnalisée/);expect(quotes.get(id)).toEqual(before);
});
it('B2B n’exige aucun médiateur, B2C exige les informations correspondantes et le professionnel protégé ne devient pas B2C',()=>{
 prepareQuoteForTest(db,id);expect(prep.get(id).issues.some(i=>i.code==='MEDIATOR')).toBe(false);const p=prep.parameters(id)!;p.conclusion.channel='off_premises';p.conclusion.professionalConsumerRegime='applicable';prep.save(id,p);expect(prep.get(id).issues.some(i=>i.code==='MEDIATOR')).toBe(false);p.audience='consumer';p.payment.professionalTerms=null;prep.save(id,p);expect(prep.get(id).issues.some(i=>i.code==='MEDIATOR')).toBe(true);
});
it('détecte les champs nommés des clauses et les résout depuis la configuration sans modifier la source',()=>{
 prepareQuoteForTest(db,id);terms.addCustomQuoteClause(id,{title:'TEST médiation',body:'[NOM DU MÉDIATEUR] — [ADRESSE] — [SITE INTERNET]'});expect(prep.get(id).issues.some(i=>i.code==='CLAUSE_FIELDS')).toBe(true);expect(()=>quotes.finalize(id)).toThrow(/informations contractuelles/);
 const admin=prep.administration();admin.mediator={state:'filled',value:'TEST médiateur, adresse TEST, https://example.invalid',reason:''};prep.saveAdministration(admin);expect(terms.presentation(id).text).toContain('TEST médiateur');expect(terms.getQuoteBuild(id).compiledText).toContain('TEST médiateur');expect(terms.getQuoteBuild(id).compiledText).not.toContain('[NOM DU MÉDIATEUR]');quotes.finalize(id);expect(db.get<{body:string}>("SELECT body FROM quote_contract_clauses WHERE quote_id=? AND title='TEST médiation'",[id])!.body).toContain('[NOM DU MÉDIATEUR]');expect(JSON.parse(db.get<{snapshot_json:string}>('SELECT snapshot_json FROM quote_contract_preparations WHERE quote_id=?',[id])!.snapshot_json).presentation.text).not.toContain('[NOM DU MÉDIATEUR]');
});
it('fige les coordonnées de la société contractante puis ignore une modification ultérieure du CRM',()=>{
 const q=quotes.get(id);expect(q.recipient?.name).toBe('TEST société contractante');expect(buildQuoteHtml(q,terms.presentation(id))).toContain('1 rue TEST');prepareQuoteForTest(db,id);quotes.finalize(id);db.run("UPDATE organizations SET address_line1='Nouvelle adresse' WHERE id=?",[q.recipient!.organizationId]);expect(quotes.get(id).recipient?.addressLine1).toBe('1 rue TEST');
});
it('reprend l’adresse d’un particulier sans entreprise ni SIRET',()=>{
 const c=crm.createContact({firstName:'TEST',lastName:'Personne',addressLine1:'2 rue TEST',postalCode:'75000',city:'Paris',country:'France'});const p=crm.createProspect({contactId:c.id,primaryNeed:'Mariage'});const q=quotes.create({prospectId:p.id,subject:'Mariage',contractAudience:'consumer'});expect(q.recipient).toMatchObject({kind:'person',name:'TEST Personne',addressLine1:'2 rue TEST',identification:null});
});
it('conserve des échéances propres aux lignes mixtes, recalcule et copie les liens sans imposer 100 % au site',()=>{
 quotes.addCustomLine(id,{label:'Maintenance annuelle',quantityMilli:1000,proposedUnitPriceCents:53900});prepareQuoteForTest(db,id);const q=quotes.get(id),p=prep.parameters(id)!;p.payment.lineSchedules=q.lines.map((l,i)=>({lineId:l.id,milestones:paymentMilestones(i?'order_100':'30_70')}));prep.save(id,p);expect(quotes.get(id).depositCents).toBe(74870);expect(terms.presentation(id).paymentSummary?.rows.map(m=>m.amountCents)).toEqual([20970,48930,53900]);
 const copy=quotes.duplicate(id);expect(prep.parameters(copy.id)!.payment.lineSchedules!.every(s=>copy.lines.some(l=>l.id===s.lineId))).toBe(true);quotes.updateLine(copy.lines[0].id,{...copy.lines[0],quantityMilli:2000});expect(quotes.get(copy.id).depositCents).toBe(95840);quotes.removeLine(copy.lines[1].id);expect(prep.get(copy.id).issues.some(i=>i.code==='PAYMENT_COVERAGE')).toBe(false);expect(quotes.get(copy.id).depositCents).toBe(41940);
});
