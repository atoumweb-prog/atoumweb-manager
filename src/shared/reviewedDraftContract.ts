import type {QuoteContractClause} from './contractTerms';
import type {ContractSectionReview} from './contractSectionPolicy';
import {CONTRACT_SECTION_LABELS,CONTRACT_SECTION_ORDER} from './contractSectionPolicy';
import {planDraftContractAssembly} from './draftContractAssemblyPlan';
import type {ContractApplicabilityContext,ContractApplicabilityRule,ContractClauseConflict} from './contractSectionPolicy';

export interface ReviewedQuoteClause {
  clause:QuoteContractClause;
  review:ContractSectionReview;
  applicability?:ContractApplicabilityRule;
}
export interface NumberedContractSection {
  key:string;
  title:string;
  articles:{number:string;id:string;title:string;body:string}[];
}
export function assembleReviewedDraftContract(
 entries:readonly ReviewedQuoteClause[],
 context:ContractApplicabilityContext,
 conflicts:readonly ContractClauseConflict[]=[],
){
 const selectable=entries.filter(e=>e.clause.enabled&&!e.clause.isOrphaned);
 const ids=new Set<string>();const versions=new Set<string>();
 const quoteIds=new Set(selectable.map(e=>e.clause.quoteId));
 const invalidText=selectable.filter(e=>!e.clause.title.trim()||!e.clause.body.trim()).map(e=>e.clause.id);
 const duplicateIds:string[]=[];
 for(const e of selectable){
   if(ids.has(e.clause.id))duplicateIds.push(e.clause.id);else ids.add(e.clause.id);
   const vid=e.clause.sourceClauseVersionId;
   if(vid){if(versions.has(vid))duplicateIds.push(vid);else versions.add(vid);}
 }
 const missing=selectable.filter(e=>!e.clause.sourceClauseVersionId);
 const versioned=selectable.filter(e=>!!e.clause.sourceClauseVersionId);
 const plan=planDraftContractAssembly(versioned.map(e=>({
   id:e.clause.id,versionId:e.clause.sourceClauseVersionId!,
   section:e.review,applicability:e.applicability,
   clause:e.clause,
 })),context,conflicts);
 const sections:NumberedContractSection[]=[];
 for(const [index,key] of CONTRACT_SECTION_ORDER.entries()){
   const matches=plan.included.filter(e=>e.section.status==='approved'&&e.section.sectionKey===key);
   if(!matches.length)continue;
   sections.push({key,title:CONTRACT_SECTION_LABELS[key],articles:matches.map((e,n)=>({
     number:`${index+1}.${n+1}`,id:e.id,title:e.clause.title,body:e.clause.body,
   }))});
 }
 return {
   ...plan,
   sections,
   missing:missing.map(e=>e.clause.id),
   duplicateIds,
   invalidText,
   crossQuote:quoteIds.size>1,
   ready:selectable.length>0&&plan.included.length>0&&plan.ready&&missing.length===0&&duplicateIds.length===0&&invalidText.length===0&&quoteIds.size===1,
 };
}

/** Assemble the canonical draft text only after every mandatory review succeeds.
 * This never writes to the quote and cannot recompile a frozen snapshot.
 */
export function renderApprovedDraftContract(result:ReturnType<typeof assembleReviewedDraftContract>):string {
 if(!result.ready)throw new Error('Contrat incomplet : compilation canonique interdite.');
 return result.sections.map(section=>[
   section.title,
   ...section.articles.map(article=>article.number+' — '+article.title+'\n'+article.body),
 ].join('\n\n')).join('\n\n');
}
