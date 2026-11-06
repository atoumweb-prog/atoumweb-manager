export const CRM_RECORD_KEYS = ['atoumweb:crm-record:client:v1','atoumweb:crm-record:prospect:v1'] as const;
export interface CrmRecordPresentation { version:1; leftWidth:number; rightWidth:number; leftClosed:boolean; rightClosed:boolean }
export function normalizeCrmRecordPresentation(value:unknown,kind:'client'|'prospect'='prospect'):CrmRecordPresentation {
 const d=value && typeof value==='object'?value as Record<string,unknown>:{};
 if(d.version!==1)throw Error('Disposition CRM incompatible.');
 const defaults=defaultCrmRecordPresentation(kind);
 const width=(v:unknown,f:number,min=220)=>typeof v==='number'&&Number.isFinite(v)?Math.min(380,Math.max(min,v)):f;
 return {version:1,leftWidth:width(d.leftWidth,defaults.leftWidth),rightWidth:width(d.rightWidth,defaults.rightWidth,kind==='client'?190:220),leftClosed:d.leftClosed===true,rightClosed:d.rightClosed===true};
}
export const defaultCrmRecordPresentation=(kind:'client'|'prospect'='prospect'):CrmRecordPresentation=>({version:1,leftWidth:kind==='client'?220:260,rightWidth:kind==='client'?190:280,leftClosed:false,rightClosed:false});

/** Display-only adaptation. Never rewrites stored widths or folded preferences. */
export function clientPaneDisplay(available:number,value:CrmRecordPresentation){
 const leftMin=value.leftClosed?52:300,rightMin=value.rightClosed?52:240;
 const compact=available<leftMin+rightMin+656; // 640px work area + two 8px separators.
 let left=value.leftClosed?52:Math.max(300,value.leftWidth),right=value.rightClosed?52:Math.max(240,value.rightWidth);
 const excess=Math.max(0,left+right+656-available),flex=left-leftMin+right-rightMin;
 if(!compact&&excess>0&&flex>0){left-=excess*(left-leftMin)/flex;right-=excess*(right-rightMin)/flex;}
 return {leftWidth:Math.floor(left),rightWidth:Math.floor(right),compact};
}
