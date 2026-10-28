import type {PaymentMilestone,QuoteContractParameters} from './quoteContractPreparation';
export interface PaymentLine {id:string;label:string;contractLineValueCents:number;snapshot?:Record<string,unknown>|null}
export interface PaymentAmount extends PaymentMilestone {amountCents:number;lineId?:string;lineLabel?:string;periodicity?:string;first:boolean}
export function quotePaymentSchedule(p:QuoteContractParameters,lines:PaymentLine[],total:number):PaymentAmount[]{
  const amounts=(milestones:PaymentMilestone[],base:number,extra:Partial<PaymentAmount>)=>{
    let used=0;
    return milestones.map((m,i)=>{const amountCents=i===milestones.length-1?base-used:Math.round(base*m.percent/100);used+=amountCents;return {...m,...extra,amountCents,first:i===0};});
  };
  if(!p.payment.lineSchedules)return amounts(p.payment.milestones,total,{});
  return p.payment.lineSchedules.flatMap(s=>{
    const line=lines.find(l=>l.id===s.lineId);if(!line)return [];
    return amounts(s.milestones,line.contractLineValueCents,{lineId:line.id,lineLabel:line.label,periodicity:String(line.snapshot?.periodicity||line.snapshot?.priceMode||'')});
  });
}
