export const CRM_RECORD_KEYS = ['atoumweb:crm-record:client:v1','atoumweb:crm-record:prospect:v1'] as const;
export interface CrmRecordPresentation { version:1; leftWidth:number; rightWidth:number; leftClosed:boolean; rightClosed:boolean }
export function normalizeCrmRecordPresentation(value:unknown):CrmRecordPresentation {
 const d=value && typeof value==='object'?value as Record<string,unknown>:{};
 if(d.version!==1)throw Error('Disposition CRM incompatible.');
 const width=(v:unknown,f:number)=>typeof v==='number'&&Number.isFinite(v)?Math.min(380,Math.max(220,v)):f;
 return {version:1,leftWidth:width(d.leftWidth,260),rightWidth:width(d.rightWidth,280),leftClosed:d.leftClosed===true,rightClosed:d.rightClosed===true};
}
export const defaultCrmRecordPresentation=():CrmRecordPresentation=>({version:1,leftWidth:260,rightWidth:280,leftClosed:false,rightClosed:false});
