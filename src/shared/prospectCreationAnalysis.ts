import type {ProspectResearchSnapshotInput,ProspectResearchPriority} from './crm';
export interface CreationAnalysisFields {
 activityArea:string; digitalNotes:string; googlePresence:''|'present'|'absent'|'review'; googleUrl:string; googleNotes:string;
 opportunityFinding:string; opportunityService:string; opportunityPriority:ProspectResearchPriority; opportunityNote:string;
 researchSource:string; researchSourceUrl:string; researchCheckedAt:string; contactObjective:string;
}
export const EMPTY_CREATION_ANALYSIS:CreationAnalysisFields={activityArea:'',digitalNotes:'',googlePresence:'',googleUrl:'',googleNotes:'',opportunityFinding:'',opportunityService:'',opportunityPriority:'medium',opportunityNote:'',researchSource:'',researchSourceUrl:'',researchCheckedAt:'',contactObjective:''};
const list=(s:string)=>s.split(',').map(v=>v.trim()).filter(Boolean);
/** Use the existing snapshot, not prospect needs or planned/completed actions. */
export function creationResearch(d:CreationAnalysisFields&{services:string;customerSegments:string;differentiators:string;talkingPoints:string;approach:string;websitePresence?:'present'|'absent'|'review'},website:string|null):ProspectResearchSnapshotInput|undefined {
 const hasOpportunity=!!(d.opportunityFinding.trim()||d.opportunityService.trim());
 if(d.opportunityNote.trim()&&!hasOpportunity)throw Error('Ajoute un constat ou une piste à l’opportunité avant sa note.');
 const filled=[d.services,d.customerSegments,d.differentiators,d.talkingPoints,d.approach,d.activityArea,d.digitalNotes,d.googleUrl,d.googleNotes,d.opportunityFinding,d.opportunityService,d.researchSource,d.researchSourceUrl,d.researchCheckedAt,d.contactObjective].some(v=>v.trim())||d.googlePresence||website||d.websitePresence==='absent';
 if(!filled)return undefined;
 return {checkedAt:d.researchCheckedAt||null,source:d.researchSource.trim()||'Saisie annuaire',sourceUrl:d.researchSourceUrl.trim()||null,
 activityArea:d.activityArea.trim()||null,services:list(d.services),customerSegments:list(d.customerSegments),differentiators:list(d.differentiators),
 website:{presence:d.websitePresence==='absent'?'absent':website?'present':'review',url:website,notes:d.digitalNotes.trim()||null},
 googleBusiness:d.googlePresence||d.googleUrl.trim()||d.googleNotes.trim()?{presence:d.googlePresence||'review',url:d.googleUrl.trim()||null,notes:d.googleNotes.trim()||null}:undefined,
 opportunities:hasOpportunity?[{finding:d.opportunityFinding.trim(),service:d.opportunityService.trim(),priority:d.opportunityPriority,note:d.opportunityNote.trim()||null,keep:true}]:[],
 conversation:{objective:d.contactObjective.trim()||null,talkingPoints:d.talkingPoints,approach:d.approach}};
}
