import {app} from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import {DatabaseService} from '../../src/main/database/DatabaseService';
import {ensureWorkspace} from '../../src/main/workspace';
import {renderQuotePdfBuffer} from '../../src/main/commercial/quotePdf';
import {createWorkingContractDocx} from '../../src/main/commercial/workingContractDocx';
import {formatContractPresentation} from '../../src/shared/contractPresentation';
import {emptyContractParameters} from '../../src/shared/quoteContractPreparation';
import {approvedBusinessReview} from '../../src/shared/approvedBusinessPolicy';
import {APPROVED_PACK} from '../../src/main/commercial/ApprovedPackSource';
import type {CommercialVersionRules} from '../../src/shared/commercialRules';
import {formatSoldScope} from '../../src/shared/contractSoldScope';
import {DatabaseSync,backup} from 'node:sqlite';

const root=process.env.ATOUMWEB_APPROVED_RECIPE_TEMP!,out=process.env.ATOUMWEB_APPROVED_RECIPE_OUTPUT!,input=process.env.ATOUMWEB_APPROVED_RECIPE_INPUT!;
app.setPath('userData',path.join(root,'profile'));app.on('window-all-closed',()=>{});
app.whenReady().then(async()=>{
 const workspace=ensureWorkspace(path.join(root,'workspace')),original=new DatabaseSync(input,{readOnly:true});try{await backup(original,workspace.databaseFile);}finally{original.close();}
 const db=new DatabaseService(workspace);await db.initialize();
 const cases=[['01-vitrine','AW-WEB-VITRINE','professional','WEB-OFFRE-5P-PERIMETRE'],['02-woo-essentiel','AW-ECOM-BASE','consumer','ECOM-CATALOGUE'],['03-woo-business','V39-ECOM-BUSINESS','professional','WEB-NEWSLETTER-PERIMETRE'],['04-woo-visibilite','V39-ECOM-VISIBILITE','consumer','ECOM-CATALOGUE'],['05-maint-wp-m','AW-MAINT-WP-M','professional','MAINT-RENOUVELLEMENT'],['06-maint-wp-a','AW-MAINT-WP-A','consumer','MAINT-RENOUVELLEMENT'],['07-maint-wc-m','AW-MAINT-WC-M','professional','MAINT-WOOCOMMERCE'],['08-maint-wc-a','AW-MAINT-WC-A','consumer','MAINT-WOOCOMMERCE'],['09-lune','V39-HOST-LUNE','professional','TECH-HEBERGEMENT'],['10-mariage','AW-MARIAGE-HISTOIRE','consumer','MARIAGE-DUREE'],['11-gbp','V39-GBP-ESS-A','professional','SEO-GBP-SUIVI'],['12-statistiques','V39-STAT-ESS-M','consumer','DATA-SUIVI'],['13-newsletter-ponctuelle','V39-NL-PONCT-SIMPLE','professional','WEB-NEWSLETTER-PERIMETRE'],['14-newsletter-recurrente','V39-NL-1-A','consumer','WEB-NEWSLETTER-PERIMETRE']];
 const results=[];
 try{
  for(const [key,code,audience,module] of cases){
   const v=db.database.get<{id:string;item_id:string}>("SELECT id,item_id FROM catalog_versions WHERE json_extract(provenance_json,'$.recordKey')=? AND json_extract(provenance_json,'$.sha256')=? ORDER BY version_number DESC LIMIT 1",[code,APPROVED_PACK.catalogue.sha256_word]);if(!v)throw Error('Missing source version '+code);
   // Explicit fixture publication ONLY in this extra disposable copy to exercise normal Quote guards.
   db.catalog.publishVersion(v.id);
   const org=audience==='professional'?db.crm.createOrganization({name:'TEST — '+key}):null;
   const contact=db.crm.createContact({organizationId:org?.id,firstName:'TEST',lastName:key,email:'recette@example.invalid'});
   const prospect=db.crm.createProspect({organizationId:org?.id,contactId:contact.id,primaryNeed:'SIMULATION TEMP — '+code});
   let quote=db.quotes.create({prospectId:prospect.id,subject:'SIMULATION TEMP — '+code,contractAudience:audience as 'professional'|'consumer',estimatedDelay:'À convenir — simulation non contractuelle'});
   quote=db.quotes.addCatalogLine(quote.id,v.id);
   const policy=(quote.lines[0].snapshot?.commercialRules as CommercialVersionRules|undefined)?.approvedPack;
   if(policy?.includedProducts)quote=db.quotes.setLineParameters(quote.lines[0].id,{productCount:{kind:'included',count:policy.includedProducts}});
   const parameters=emptyContractParameters(audience as any,30);
   if(policy?.renewal&&policy.renewal!=='none')parameters.renewal={reviewed:true,applicable:true,mode:policy.renewal==='express'?'express':'contractual_automatic',period:policy.priceChange==='monthly_30_days'?'Mensuelle — simulation':'Annuelle — simulation',notice:'À compléter selon la version et le public — simulation',termination:'À compléter — simulation non finalisée',restitution:'Selon le périmètre contractuel choisi'};
   db.quotePreparation.save(quote.id,parameters);
   const selected=['BASE-OBJET','BASE-PAIEMENT','BASE-RESPONSABILITE',module,...(audience==='consumer'?['CONS-MEDIATION','CONS-RETRACTATION']:['PRO-LITIGE'])];
   const clauses=selected.map((code,index)=>{
    const row=db.database.get<{id:string;clause_id:string;body:string;title:string;version_number:number;code:string}>(`SELECT v.*,t.id AS clause_id FROM contract_clause_versions v JOIN contract_clause_templates t ON t.id=v.clause_id WHERE t.code=? ORDER BY v.version_number DESC LIMIT 1`,[code]);if(!row)throw Error('Missing clause '+code);
    return {id:key+'-'+index,quoteId:quote.id,sourceKey:'template:'+row.clause_id,sourceKind:code.startsWith('BASE-')||code.startsWith('CONS-')||code.startsWith('PRO-')?'base':'catalog',sourceClauseId:row.clause_id,sourceClauseVersionId:row.id,sourceCatalogItemIds:[v.item_id],title:row.title,body:row.body,sortOrder:index*10,enabled:true,isCustomized:false,isOrphaned:false,createdAt:'',updatedAt:''} as const;
   });
   const presentation=formatContractPresentation({state:'draft',number:quote.number,subject:quote.subject,totalCents:quote.totalCents,estimatedDelay:quote.estimatedDelay??null,prerequisites:null,compiledAt:null,clauseText:'',clauses:[...clauses] as any,parameters,administration:null,types:[],modules:[],lineDetails:quote.lines.map(l=>formatSoldScope({label:l.label,quantityMilli:l.quantityMilli,inclusions:l.snapshot?.inclusions,exclusions:l.snapshot?.exclusions,scope:l.parameters?.scope,scopeExclusions:l.parameters?.scopeExclusions}))});
   if(presentation.text.includes('PAY-005'))throw Error('Internal code leaked into client text');
   const docText='SIMULATION TEMP NON PUBLIEE — NON DESTINEE A SIGNATURE\n\n'+presentation.text;
   fs.writeFileSync(path.join(out,key+'.docx'),createWorkingContractDocx(docText));
   fs.writeFileSync(path.join(out,key+'.pdf'),await renderQuotePdfBuffer(quote,presentation));
   results.push({key,sourceCode:code,sourceVersionId:v.id,quoteId:quote.id,audience,totalCents:quote.totalCents,selectedClauseVersions:clauses.map(c=>({id:c.sourceClauseVersionId,title:c.title})),controls:approvedBusinessReview(quote),finalized:false,publication:'explicit fixture only, not integration copy',pdf:key+'.pdf',docx:key+'.docx'});
  }
  fs.writeFileSync(path.join(out,'SIMULATIONS.json'),JSON.stringify({tempOnly:true,automaticPublication:false,results,integrity:db.database.all('PRAGMA integrity_check'),foreignKeys:db.database.all('PRAGMA foreign_key_check')},null,2));console.log('V394_DOCUMENTS '+JSON.stringify({cases:results.length,pdf:results.length,docx:results.length}));
 }finally{db.close();}
}).catch(e=>{console.error(e.stack||e);process.exitCode=1}).finally(()=>app.quit());
