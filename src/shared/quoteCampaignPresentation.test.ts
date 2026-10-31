import {formatContractPresentation} from './contractPresentation';
import type {QuoteContractClause} from './contractTerms';
import {it,expect} from 'vitest';
import {humanizedContractPreview} from './humanizedContractPreview';
import {commercialDescription} from './commercialDescription';
import {resolveContractFields,hasUnresolvedContractFields,renderContractReferences} from './contractFields';
import {emptyAdministration} from './quoteContractPreparation';
import type {ContractPresentation} from './contractPresentation';
it('remplace les articles réellement rendus, le texte de copie et marque les références comme sources sans modifier l’entrée',()=>{
 const p:ContractPresentation={schemaVersion:1,state:'draft',compiledAt:null,sections:[{id:'base',title:'Socle',text:'Ancien texte',articles:[{number:1,title:'Titre',body:'Ancien texte',group:'',sourceVersionId:'source-v1'}]}],text:'Ancien texte',types:[],modules:[]};
 const r=humanizedContractPreview(p,[{origin:{versionId:'source-v1'},proposal:'Nouveau texte lisible'}]);expect(r.changed).toBe(1);expect(r.presentation.sections[1].articles![0].body).toBe('Nouveau texte lisible');expect(r.presentation.text).toContain('Nouveau texte lisible');expect(p.text).toBe('Ancien texte');expect(r.presentation.text).toContain('pas une publication');
});
it('ne confond pas besoin client et description, et conserve la description personnalisée',()=>{
 const snapshot={commercialParameters:{clientNeed:'Je veux un site',work:'Créer et intégrer les pages'}};expect(commercialDescription('Je veux un site',snapshot)).toBe('Créer et intégrer les pages');expect(commercialDescription('Texte personnalisé',snapshot)).toBe('Texte personnalisé');expect(commercialDescription('Je veux un site',{commercialParameters:{clientNeed:'Je veux un site',work:'Même actions que mensuel.'}})).toBe('');
});
it('remplace les références connues par leur titre exact et garde les inconnues visibles',()=>{
 expect(renderContractReferences('Voir BASE-VALIDATION et INCONNU-X',[{code:'BASE-VALIDATION',title:'Validation des livrables'}])).toBe('Voir « Validation des livrables » et INCONNU-X');
});
it('aucun champ nommé non renseigné ne passe silencieusement',()=>{
 const a=emptyAdministration();expect(hasUnresolvedContractFields(resolveContractFields('[NOM DU MÉDIATEUR]',a))).toBe(true);a.mediator={state:'filled',value:'TEST coordonnées complètes',reason:''};expect(hasUnresolvedContractFields(resolveContractFields('[NOM DU MÉDIATEUR] [ADRESSE] [SITE INTERNET]',a))).toBe(false);expect(hasUnresolvedContractFields('[AUTRE COORDONNÉE À RENSEIGNER]')).toBe(true);
});

it('développe les abréviations des nouveaux brouillons, sans réécrire la présentation historique',()=>{
 const clause:QuoteContractClause={id:'c',quoteId:'q',sourceKey:'c',sourceKind:'custom',sourceCatalogItemIds:[],title:'Suivi',body:'Contrôle après MAJ. Urgence HNO exclue.',sortOrder:1,enabled:true,isCustomized:false,isOrphaned:false,createdAt:'',updatedAt:''};
 const base={number:'TEST',subject:'TEST',totalCents:100,estimatedDelay:null,prerequisites:null,compiledAt:null,clauseText:'',clauses:[clause],parameters:null,administration:null,types:[],modules:[]};
 expect(formatContractPresentation({...base,state:'draft'}).text).toContain('mises à jour');expect(formatContractPresentation({...base,state:'draft'}).text).not.toContain('HNO');expect(formatContractPresentation({...base,state:'frozen'}).text).toContain('MAJ');expect(clause.body).toContain('HNO');
});
