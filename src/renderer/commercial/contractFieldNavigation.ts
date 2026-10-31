const sections:Record<string,string>={CONCLUSION:'client',OTHER_CHANNEL:'client',DIGITAL_QUALIFICATION:'qualification',PAYMENT_DATES:'payment',INITIAL_DUE:'payment',DELIVERY_MILESTONE:'execution',WARRANTY_COVERAGE:'execution',WARRANTY_START:'execution',WARRANTY_LINE:'execution',RIGHTS_REVIEW:'rights',RIGHTS:'rights',RENEWAL_REVIEW:'renewal',RENEWAL:'renewal',RSVP_ROLES:'rsvp',ANNEX_MISSING:'annexes',DOCUMENT_INTEGRITY:'proofs',OFF_PREMISES:'client',PRO_CONSUMER_REGIME:'client',CONSUMER_INFORMATION:'consumer',WITHDRAWAL_STATUS:'consumer',WITHDRAWAL_CONTACT:'administration',WITHDRAWAL_FORM:'proofs',WITHDRAWAL_EXCEPTION:'consumer',EARLY_REQUEST:'proofs',EARLY_ACKNOWLEDGEMENT:'proofs','CONS-RETRACTATION-EN-LIGNE':'consumer',MEDIATOR:'administration',PROVIDERS:'administration',GDPR:'administration'};
const fields:Record<string,string[]>={
  CONCLUSION:['channel','context','purpose'],OTHER_CHANNEL:['other-channel'],
  DIGITAL_QUALIFICATION:['qualification-kinds','supply','delivery','qualification-reason'],
  PAYMENT_DATES:['payment-event'],INITIAL_DUE:['payment-event'],DELIVERY_MILESTONE:['execution-event','add-milestone'],
  WARRANTY_COVERAGE:['warranty-kind'],WARRANTY_START:['warranty-start'],WARRANTY_LINE:['warranty-kind'],
  RIGHTS_REVIEW:['rights-reviewed'],RIGHTS:['rights-uses','rights-duration','rights-territory','rights-sources'],
  RENEWAL_REVIEW:['renewal-reviewed'],RENEWAL:['renewal-period','renewal-notice','renewal-termination','renewal-restitution'],
  OFF_PREMISES:['off-premises'],PRO_CONSUMER_REGIME:['professional-consumer'],CONSUMER_INFORMATION:['consumer-information'],
  WITHDRAWAL_STATUS:['withdrawal'],WITHDRAWAL_EXCEPTION:['withdrawal-reason'],'CONS-RETRACTATION-EN-LIGNE':['online-withdrawal','online-withdrawal-reason'],
  RSVP_ROLES:['rsvp-roles'],ANNEX_MISSING:['annex-document'],DOCUMENT_INTEGRITY:['document-open'],
  WITHDRAWAL_FORM:['document-role'],EARLY_REQUEST:['document-role'],EARLY_ACKNOWLEDGEMENT:['document-role'],
  MEDIATOR:['admin-mediator'],PROVIDERS:['admin-providers'],GDPR:['admin-gdpr'],WITHDRAWAL_CONTACT:['admin-withdrawalRecipient'],
};
function incomplete(field:HTMLElement):boolean {
  if(field.dataset.contractIncomplete!==undefined)return field.dataset.contractIncomplete==='true';
  if(field.dataset.contractField==='qualification-kinds')return !field.closest('[data-contract-section]')?.querySelector('[data-contract-field="qualification-kinds"]:checked');
  if(field instanceof HTMLInputElement&&field.type==='checkbox')return !field.checked;
  if(field instanceof HTMLInputElement||field instanceof HTMLTextAreaElement||field instanceof HTMLSelectElement)return !field.value.trim()||['unknown','unconfigured','missing','verify'].includes(field.value);
  return false;
}
export function contractIssueSection(code:string):string{return code.startsWith('ADMIN_')?'administration':sections[code]??'client';}
/** Open every ancestor accordion before scrolling, including a surrounding Devis accordion. No data is changed. */
export function focusContractField(quoteId:string,code:string):boolean {
  window.dispatchEvent(new CustomEvent('atoumweb:contract-focus',{detail:{quoteId,code}}));
  const root=[...document.querySelectorAll<HTMLElement>('.quote-contract-preparation')].find(e=>e.dataset.quoteId===quoteId);
  if(!root)return false;
  const section=code.startsWith('ADMIN_')?'administration':sections[code];
  const target=root.querySelector<HTMLElement>(`[data-contract-section="${section??'client'}"]`)??root;
  const adminName=code.replace(/^ADMIN_|_TEST$/g,'').toLowerCase();
  const names=code.startsWith('ADMIN_')?[`admin-${adminName==='withdrawalrecipient'?'withdrawalRecipient':adminName}`]:fields[code]??[];
  const candidates=names.flatMap(name=>[...root.querySelectorAll<HTMLElement>(`[data-contract-field="${name}"]`)]).filter(e=>!e.matches(':disabled'));
  if(code.endsWith('_TEST'))candidates.sort((a,b)=>Number(b.tagName==='INPUT')-Number(a.tagName==='INPUT'));
  const field=candidates.find(incomplete)??candidates[0]??target.querySelector<HTMLElement>('input:not(:disabled),select:not(:disabled),textarea:not(:disabled),button:not(:disabled),summary');
  const destination=field??target;
  for(let node:HTMLElement|null=destination;node;node=node.parentElement)if(node.tagName==='DETAILS')(node as HTMLDetailsElement).open=true;
  requestAnimationFrame(()=>{destination.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
  destination.focus({preventScroll:true});});
  return true;
}
