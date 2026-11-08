import {describe,it,expect} from 'vitest';
import {NodeSqliteAdapter} from '../database/NodeSqliteAdapter';
import {applyPendingMigrations} from '../database/migrations';
import {CrmService} from '../crm/CrmService';
import {QuoteService} from './QuoteService';
import {QuoteContractPreparationService} from './QuoteContractPreparationService';
import {emptyContractParameters} from '../../shared/quoteContractPreparation';
import {formatContractPresentation} from '../../shared/contractPresentation';
import {approvedVersionRules} from './ApprovedPackSource';
import {approvedBusinessReview} from '../../shared/approvedBusinessPolicy';
import type {QuoteLine} from '../../shared/commercial';

describe('Reconduction V1.5 et périmètre explicitement distinct',()=>{
 it('persists contractual automatic renewal explicitly without replacing the historical express default',()=>{
  const db=new NodeSqliteAdapter(':memory:');try{applyPendingMigrations(db);const crm=new CrmService(db),org=crm.createOrganization({name:'TEST reconduction'}),p=crm.createProspect({organizationId:org.id,primaryNeed:'TEST'}),quote=new QuoteService(db,crm).create({prospectId:p.id,subject:'TEST reconduction'}),prep=new QuoteContractPreparationService(db),params=emptyContractParameters('professional',30);
   expect(params.renewal.mode).toBe('express');params.renewal={reviewed:true,applicable:true,mode:'contractual_automatic',period:'12 mois',notice:'Préavis contractuel et information à vérifier',termination:'Selon clause choisie',restitution:'Selon périmètre'};
   prep.save(quote.id,params);expect(prep.parameters(quote.id)?.renewal).toEqual(params.renewal);
   const presentation=formatContractPresentation({state:'draft',number:'TEST',subject:'TEST',totalCents:14900,estimatedDelay:null,prerequisites:null,compiledAt:null,clauseText:'',clauses:[],parameters:params,administration:null,types:[],modules:[]});
   expect(presentation.text).toContain('Automatique uniquement selon les conditions convenues');expect(presentation.text).not.toContain('Mensuel sans engagement');
  }finally{db.close();}
 });
 it('keeps monthly maintenance distinct from express annual maintenance and domain renewals',()=>{
  expect(approvedVersionRules('AW-MAINT-WP-M','VALIDE_RECENT').approvedPack?.renewal).toBe('contractual_automatic');
  expect(approvedVersionRules('AW-MAINT-WP-A','VALIDE_RECENT').approvedPack?.renewal).toBe('express');
  expect(approvedVersionRules('V39-HOST-DOMAINE','VALIDE_RECENT').approvedPack?.renewal).toBe('express');
  expect(approvedVersionRules('V39-HOST-LUNE','VALIDE_RECENT').approvedPack?.renewal).toBe('contractual_automatic');
 });
 it('allows a genuinely separate declared scope while warning against covering the same inclusion',()=>{
  const offer={id:'offer',label:'Business',snapshot:{commercialRules:approvedVersionRules('V39-ECOM-BUSINESS','VALIDE_RECENT')}} as unknown as QuoteLine;
  const extra={id:'extra',label:'Newsletter autre site',parameters:{scope:'Intégration sur un autre Site distinct du périmètre Business'},snapshot:{commercialRules:approvedVersionRules('AW-WEB-NEWSLETTER','VALIDE_RECENT')}} as unknown as QuoteLine;
  const review=approvedBusinessReview({lines:[offer,extra],contractAudience:'professional'});expect(review.blocking).toEqual([]);expect(review.warnings.join(' ')).toContain('périmètre distinct déclaré');
 });
 it('retains the exact cutout minimum and does not create an extra legal invoice engine',()=>{expect(approvedVersionRules('AW-PHOTO-DETOUR','VALIDE_RECENT').minimumLineCents).toBe(4500);});
});
