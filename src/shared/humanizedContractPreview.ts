import {resolveContractFields} from './contractFields';
import type {ContractAdministration} from './quoteContractPreparation';
import type {ContractPresentation} from './contractPresentation';
/** Documentary preview only. No library or quote mutation, publication or adoption. */
export function humanizedContractPreview(p:ContractPresentation,proposals:{origin:{versionId:string};proposal:string}[],administration?:ContractAdministration):{presentation:ContractPresentation;changed:number;missing:string[]} {
  const copy=structuredClone(p),byVersion=new Map(proposals.map(r=>[r.origin.versionId,r.proposal]));
  let changed=0;const missing:string[]=[];
  for(const section of copy.sections){
    if(!section.articles)continue;
    for(const article of section.articles){
      if(!article.sourceVersionId)continue;
      const proposal=byVersion.get(article.sourceVersionId);
      if(proposal===undefined){missing.push(article.sourceVersionId);continue;}
      if(article.body!==proposal)changed++;
      article.body=resolveContractFields(proposal,administration??null);
    }
    section.text=section.articles.map(a=>`${a.number}. ${a.title}\n\n${a.body}`).join('\n\n');
  }
  copy.sections.unshift({id:'editorial-preview',title:'Propositions rédactionnelles non adoptées',text:'Comparaison sur copie isolée. Les identifiants du registre désignent les versions sources, pas une publication des textes proposés. Document de travail non signable.'});
  copy.text=copy.sections.map(s=>`${s.title.toUpperCase()}\n\n${s.text}`).join('\n\n');
  return {presentation:copy,changed,missing:[...new Set(missing)]};
}
