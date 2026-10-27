import {readableTechnicalTerms} from './contractFields';
import {commercialDescription} from './commercialDescription';
import {defaultQuoteDocumentSettings} from './quoteDocumentSettings';
import { BRAND_ICON_SVG, svgDataUrl } from './brandArtwork';
import { contractPresentationFromSnapshot, type ContractPresentation, type ContractSection } from './contractPresentation';
import type { QuoteDetail, QuoteLine } from './commercial';

export const escapeQuoteHtml = (v: unknown): string => String(v ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
const h = escapeQuoteHtml;
const money = (c: number): string => `${(c / 100).toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €`;
const date = (s?: string | null): string => s ? new Date(s).toLocaleDateString('fr-FR') : 'Non précisée';
const lines = (v: unknown): string[] => Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : [];
const same = (a?: string | null, b?: string | null): boolean => (a ?? '').trim().toLocaleLowerCase('fr-FR') === (b ?? '').trim().toLocaleLowerCase('fr-FR');
const monetaryText=(s:string)=>h(s).replace(/-?\d(?:[\d \u00a0\u202f]*\d)?(?:[,.]\d{1,2})?[ \u00a0\u202f]*€/g,m=>`<span class="money">${m.replaceAll(' ','&nbsp;')}</span>`);
const paragraphs = (s: string): string => s.split(/\n\s*\n/).map(p => `<p>${monetaryText(p).replaceAll('\n', '<br />')}</p>`).join('');
const list = (items: string[]): string => items.length ? `<ul>${items.map(i => `<li>${h(i)}</li>`).join('')}</ul>` : '';

export function isQuoteDocumentDraft(q: QuoteDetail, p?: ContractPresentation): boolean {
  return q.status === 'draft' && !q.finalizedAt || p?.state === 'draft';
}

function lineHtml(line: QuoteLine, detailed: boolean, productSummary:string,readable=false): string {
  const description=commercialDescription(line.description,line.snapshot);
  const quantity = (line.quantityMilli ?? 1000) / 1000;
  const components = Array.isArray(line.snapshot?.offerComponents) ? line.snapshot.offerComponents.filter((c): c is Record<string, unknown> => !!c && typeof c === 'object') : [];
  const included = components.filter(c => !c.isOptional);
  const optional = components.filter(c => !!c.isOptional && typeof c.componentId !== 'string');
  const period=String(line.snapshot?.periodicity||line.snapshot?.priceMode||'');
  const cadence=['mensuelle','monthly'].includes(period)?' / mois':['annuelle','yearly'].includes(period)?' / an':'';
  const unit = typeof line.snapshot?.unit === 'string' ? line.snapshot.unit : '';
  const unitPrice = line.proposedUnitPriceCents ?? line.catalogUnitPriceCents;
  const adjustment = unitPrice == null ? 0 : line.contractLineValueCents - Math.round(unitPrice * quantity);
  return `<tr class="commercial-line"><td><h3>${h(line.label)}</h3>
    ${description && !same(description, line.label) ? `<p class="description">${h(readable?readableTechnicalTerms(description):description)}</p>` : ''}
    ${line.parameters?.productCount?`<p>${line.parameters.productCount.count} produit${line.parameters.productCount.count>1?'s':''} ${line.parameters.productCount.kind==='additional'?'supplémentaires vendus':'inclus'}${productSummary&&line.parameters.productCount.kind==='additional'?` · ${h(productSummary)}`:''}</p>`:''}
    ${detailed ? list(lines(line.snapshot?.inclusions)) : ''}
    ${detailed && included.length ? `<div class="included"><strong>Comprend</strong>${list(included.map(c => `${String(c.serviceName ?? '')}${Number(c.quantityMilli ?? 1000) !== 1000 ? ` × ${(Number(c.quantityMilli) / 1000).toLocaleString('fr-FR')}` : ''}`))}</div>` : ''}
    ${detailed && optional.length ? `<div class="included"><strong>Options prévues dans l’offre</strong>${list(optional.map(c => String(c.serviceName ?? '')))}</div>` : ''}
    ${adjustment ? `<p class="adjustment">Ajustement de ligne : ${adjustment > 0 ? '+' : '-'} ${h(money(Math.abs(adjustment)))}</p>` : ''}
    </td><td class="quantity">${quantity.toLocaleString('fr-FR')}${unit ? `&nbsp;<span class="unit">${h(unit)}</span>` : ''}</td><td class="amount">${unitPrice == null ? 'Non renseigné' : h(money(unitPrice))+h(cadence)}</td><td class="amount total-line">${h(money(line.contractLineValueCents))}</td></tr>`;
}

/** Separate only known saved clause titles. No new clause selection or rewriting. */
function contractSectionHtml(s: ContractSection, p: ContractPresentation): string {
  if(s.articles?.length){let group='';return `<section class="contract-section" data-section="${h(s.id)}"><h2>${h(s.title)}</h2>${s.articles.map(a=>{const label=a.group!==group?a.group:'';group=a.group;return `<article class="contract-clause" data-source-version="${h(a.sourceVersionId)}"><header class="clause-heading">${label?`<h3 class="clause-group">${h(label)}</h3>`:''}<h3>${a.number}. ${h(a.title)}</h3></header>${paragraphs(a.body.trim())}</article>`;}).join('')}</section>`;}
  const headings = new Set(p.modules.map(m => m.title));
  const chunks: {title: string; body: string}[] = [];
  let title = '', body: string[] = [];
  const flush = () => { if (title || body.some(l => l.trim())) chunks.push({title, body: body.join('\n')}); };
  for (const line of s.text.split('\n')) {
    const match = line.match(/^\d+\. (.+)$/);
    if (match && headings.has(match[1])) { flush(); title = line; body = []; }
    else body.push(line);
  }
  flush();
  return `<section class="contract-section" data-section="${h(s.id)}"><h2>${h(s.title)}</h2>${chunks.map(c => `<article class="contract-clause">${c.title ? `<h3>${h(c.title)}</h3>` : ''}${paragraphs((s.id==='parameters'?c.body.replaceAll('\n','\n\n'):c.body).trim())}</article>`).join('')}</section>`;
}

/** One print/preview model, based exclusively on the existing saved contract presentation. */
export function buildQuoteHtml(quote: QuoteDetail, presentation?: ContractPresentation): string {
  presentation ??= contractPresentationFromSnapshot(quote) ?? undefined;
  const draft = isQuoteDocumentDraft(quote, presentation);
  const custom=presentation?.documentSettings;const style=custom??{...defaultQuoteDocumentSettings(),brandName:'AtoumWeb',tagline:'À chacun son site. Parlez-nous du vôtre.',logoDataUrl:svgDataUrl(BRAND_ICON_SVG)};
  const administration = presentation?.sections.find(s => s.id === 'administration');
  const vat = administration?.text.split('\n').find(s => s.startsWith('TVA :'));
  const adminLines=administration?.text.split('\n')??[];
  const adminField=(prefix:string)=>{const i=adminLines.findIndex(l=>l.startsWith(prefix+' :'));if(i<0)return '';const value=[adminLines[i].slice(prefix.length+3)];for(let j=i+1;j<adminLines.length&&!/^(Identité AtoumWeb|Mentions administratives|TVA|Réclamations|Médiateur|Rétractation|Prestataires|Données personnelles) :/.test(adminLines[j]);j++)value.push(adminLines[j]);return value.join('\n');};
  const readyIdentity=['Identité AtoumWeb','Mentions administratives'].map(adminField).filter(v=>v&&!v.includes('À renseigner'));
  const soldScope = presentation?.sections.find(s => s.id === 'sold-details');
  const dossierSections=(presentation?.sections.filter(s=>s.id==='commitments')??[]).sort((a,b)=>(a.id==='commitments'?0:1)-(b.id==='commitments'?0:1));
  const separateScope=!!soldScope&&(soldScope.text.length+dossierSections.reduce((n,s)=>n+s.text.length,0)>1100);
  const includedProducts=quote.lines.reduce((n,l)=>n+(l.parameters?.productCount?.kind==='included'?l.parameters.productCount.count:0),0),additionalProducts=quote.lines.reduce((n,l)=>n+(l.parameters?.productCount?.kind==='additional'?l.parameters.productCount.count:0),0);
  const productSummary=includedProducts?`${includedProducts+additionalProducts} produits renseignés au total, dont ${includedProducts} inclus et ${additionalProducts} supplémentaires`:'produits inclus à préciser';
  const annex = presentation?.sections.filter(s => !separateScope||s.id !== 'sold-details').sort((a,b)=>(a.id==='commitments'?2.5:a.id==='parameters'?2:a.id==='quote'?0:a.id==='administration'?1:3)-(b.id==='commitments'?2.5:b.id==='parameters'?2:b.id==='quote'?0:b.id==='administration'?1:3)).map(s => contractSectionHtml(custom&&s.id==='administration'?{...s,title:'Informations de l’entreprise',text:s.text.replace('Identité AtoumWeb :','Identité de l’entreprise :')}:s, presentation!)).join('') ??
    (quote.contractTextSnapshot ? `<section class="contract-section"><h2>Clauses contractuelles conservées</h2>${paragraphs(quote.contractTextSnapshot)}</section>` :
      quote.contractTextSnapshot == null && quote.specialTerms ? `<section class="contract-section"><h2>Conditions particulières historiques</h2>${paragraphs(quote.specialTerms)}</section>` : '<p>Aucun texte contractuel enregistré.</p>');
  const recipient=quote.recipient;
  const sameEmail=(a?:string|null,b?:string|null)=>!!a&&!!b&&a.trim().toLocaleLowerCase('fr-FR')===b.trim().toLocaleLowerCase('fr-FR');
  const samePhone=(a?:string|null,b?:string|null)=>!!a&&!!b&&a.replace(/[^\d+]/g,'')===b.replace(/[^\d+]/g,'');
  const recipientLines=recipient?[recipient.addressLine1,recipient.addressLine2,[recipient.postalCode,recipient.city].filter(Boolean).join(' '),recipient.country,recipient.identification,recipient.email,recipient.phone,recipient.contactName?`Contact commercial : ${recipient.contactName}`:null,sameEmail(recipient.contactEmail,recipient.email)?null:recipient.contactEmail,samePhone(recipient.contactPhone,recipient.phone)?null:recipient.contactPhone].filter(Boolean):[];
  const monthly=quote.lines.filter(l=>['monthly','mensuelle'].includes(String(l.snapshot?.periodicity||l.snapshot?.priceMode||'')));
  const monthlyCents=monthly.reduce((n,l)=>n+l.contractLineValueCents,0);
  const paymentRows=presentation?.paymentSummary?.scoped?presentation.paymentSummary.rows:null;
  const paymentGroups=paymentRows?Object.values(paymentRows.reduce((groups,row)=>{const key=JSON.stringify([row.label,row.percent,row.dueDate,row.event,['monthly','mensuelle'].includes(row.periodicity??'')?'monthly':['yearly','annuelle'].includes(row.periodicity??'')?'yearly':'one_off']);const old=groups[key];groups[key]=old?{...old,lineLabel:'Prestations aux mêmes conditions',amountCents:old.amountCents+row.amountCents}:{...row};return groups;},{} as Record<string,NonNullable<typeof paymentRows>[number]>)):null;
  const compactComposition=!separateScope?quote.lines.map(l=>{const components=Array.isArray(l.snapshot?.offerComponents)?l.snapshot.offerComponents.filter((c):c is Record<string,unknown>=>!!c&&typeof c==='object'&&!c.isOptional):[];return components.length?`<section class="scope-components"><h3>Composition de l’offre : ${h(l.label)}</h3>${list(components.map(c=>`${String(c.serviceName??'')} · ${(Number(c.quantityMilli??1000)/1000).toLocaleString('fr-FR')} · inclus`))}</section>`:'';}).join(''):'';
  const references = presentation?.modules.filter(m => m.version !== null) ?? [];
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${h(quote.number)}</title><style>
  @page{size:A4;margin:18mm 14mm 19mm}
  *{box-sizing:border-box}body{margin:0;background:white;color:#171b20;font:10pt/1.5 Arial,Helvetica,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .document-header{display:flex;justify-content:space-between;align-items:start;gap:20px;border-bottom:4px solid #ffda00;padding-bottom:17px;margin-bottom:20px}
  .brand{display:flex;align-items:center;gap:12px}.brand img{width:53px;height:53px}.brand-name{font-weight:900;font-size:23pt;letter-spacing:-1px}.brand-name span{font-weight:500}.tagline{display:block;color:#555e67;font-size:8pt;margin-top:3px}
  .document-meta{text-align:right}.document-meta h1{font-size:22pt;letter-spacing:2px;margin:0}.document-meta strong{display:block;font-size:12pt}.document-meta span{display:block;font-size:8pt;color:#4a535c}
  .draft-banner{background:#fff8cf;border-left:4px solid #d4ae00;padding:8px 12px;margin:0 0 16px;font-size:9pt}.draft-banner strong{letter-spacing:1px}
  .party-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:0 0 20px}.party{border-top:1px solid #cbd0d5;padding-top:9px}.eyebrow{font-size:8pt;color:#5d656f;text-transform:uppercase;letter-spacing:1px}.party strong{display:block;margin:5px 0;font-size:11pt}.party p{margin:3px 0;font-size:8.5pt}
  .project{margin:0 0 17px}.project h2{font-size:18pt;line-height:1.2;margin:5px 0 9px}.project p{margin:0;font-size:9pt;color:#505963}
  h2,h3{break-after:avoid;page-break-after:avoid;overflow-wrap:anywhere}h2{font-size:13pt;margin:21px 0 10px}h3{font-size:10pt;margin:0 0 6px}p,li{orphans:3;widows:3;overflow-wrap:anywhere}p{margin:0 0 8px}
  .commercial-table{width:100%;border-collapse:collapse;font-size:9pt;table-layout:fixed}.commercial-table thead{display:table-header-group}.commercial-table th{background:#171b20;color:white;text-align:left;padding:10px 9px;font-size:8pt}.commercial-table th:nth-child(n+2){text-align:right}
  .commercial-line{break-inside:avoid;page-break-inside:avoid}.commercial-table td{padding:13px 9px;vertical-align:top;border-bottom:1px solid #d8dde1}.commercial-table tr:nth-child(even) td{background:#f5f6f7}.commercial-table h3{margin:0 0 5px}.commercial-table p{font-size:8.5pt;margin:5px 0}.commercial-table ul{padding-left:16px;margin:6px 0;font-size:8pt;line-height:1.5}.commercial-table li{margin:3px 0}.commercial-table .quantity,.amount{text-align:right;white-space:nowrap}.quantity .unit{display:inline;color:#58616b;font-size:8pt}.total-line{font-weight:bold}.included{font-size:8pt;margin-top:8px}.included>strong{font-size:7.5pt;color:#505963}.adjustment{color:#545d66}
  .commercial-line:last-child{break-after:avoid;page-break-after:avoid}.commercial-summary{break-before:avoid;page-break-before:avoid;break-inside:avoid;page-break-inside:avoid;margin:17px 0 20px}.totals{width:86mm;margin-left:auto;border-top:4px solid #ffda00}.totals>div{display:flex;justify-content:space-between;gap:10px;padding:8px 4px;border-bottom:1px solid #d8dde1;font-size:9pt}.money{display:inline-block;white-space:nowrap;word-break:normal;overflow-wrap:normal}.totals>div>strong{white-space:nowrap;flex:0 0 auto;min-width:max-content;text-align:right;overflow-wrap:normal}.totals>div>span{flex:1 1 0;min-width:0}.totals .grand-total{background:#fff8cf;font-size:11pt}.tax-note{margin:8px 0 0;font-size:8pt;color:#4f5862;text-align:right}
  .practical{border-top:1px solid #cbd0d5;margin-top:18px;padding-top:10px}.practical h2{margin-top:0;font-size:11pt}.practical p{font-size:9pt}.annex-link{margin-top:14px;padding:10px 12px;background:#f3f5f6;border-left:3px solid #ffda00;font-size:8.5pt;break-inside:avoid}
  .annex{break-before:page;page-break-before:always}.annex-heading{border-bottom:4px solid #ffda00;padding-bottom:14px;margin-bottom:20px;break-inside:avoid;break-after:avoid}.annex-heading h1{font-size:22pt;margin:5px 0}.annex-heading p{margin:5px 0;color:#505963;font-size:9pt}
  .contract-section{margin:0 0 18px}.contract-section>h2{border-bottom:1px solid #bdc4ca;padding:8px 0;font-size:12pt}.contract-clause{margin-bottom:13px;break-inside:avoid;page-break-inside:avoid}.clause-heading{break-inside:avoid;break-after:avoid}.clause-group{font-size:9pt;color:#4f5862;text-transform:uppercase;margin:12px 0 7px}.contract-clause>h3,.clause-heading>h3:not(.clause-group){font-size:10pt;color:#111820;border-left:3px solid #ffda00;padding-left:8px;margin-bottom:7px}.contract-clause p{font-size:9pt;line-height:1.6;margin-bottom:9px}
  .scope-detail{margin-top:18px}.scope-detail>h1{font-size:20pt;border-bottom:4px solid #ffda00;padding-bottom:12px;break-after:avoid}.scope-detail [data-section="sold-details"]>h2{display:none}.scope-detail .contract-clause{break-inside:auto;page-break-inside:auto}.scope-detail .contract-clause p{break-inside:avoid}.contract-section[data-section="parameters"] p{margin-bottom:3px;line-height:1.45}.scope-detail [data-section="commitments"] p{line-height:1.45;margin-bottom:7px}.scope-components{font-size:9pt;break-inside:avoid}.scope-components h3{margin-top:15px}.scope-components ul{padding-left:17px}
  .scope-detail [data-section="sold-details"] p{font-size:8.5pt;line-height:1.45}.contract-section[data-section="parameters"] .contract-clause{columns:2;column-gap:24px}.contract-section[data-section="parameters"] p{font-size:8.5pt;break-inside:avoid}
  .closing{break-inside:auto}.version-register{margin-top:18px;columns:1;break-inside:avoid;page-break-inside:avoid}.version-register p{font-size:7pt;line-height:1.5;color:#505963;break-inside:avoid;margin-bottom:5px}.version-register h2{font-size:10pt;column-span:all}
  .acceptance{margin:25px 0 0;padding:17px;border:1px solid #aeb7c0;border-top:5px solid #ffda00;break-inside:avoid;page-break-inside:avoid}.acceptance h2{margin:0 0 10px;font-size:13pt}.acceptance p{font-size:9pt}.acceptance-fields{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:18px}.acceptance-fields div{font-size:9pt;min-height:46px;border-bottom:1px solid #bac2c9}.signature{margin-top:15px;min-height:80px;font-size:9pt}.signature-draft{font-size:8pt;color:#59636c}
  @media screen{body{padding:30px;max-width:900px;margin:auto}.annex{margin-top:45px;padding-top:24px;border-top:1px dashed #bdc4ca}}
  @page{margin:18mm ${style.marginMm}mm 19mm}body{color:${h(style.textColor)};font-family:${h(style.fontFamily)},serif;font-size:${style.fontSize}pt}.brand img{width:${style.logoWidthMm}mm;height:auto;max-height:35mm;object-fit:contain}.document-header,.scope-detail>h1,.annex-heading{border-color:${h(style.accentColor)}}.totals,.acceptance{border-top-color:${h(style.accentColor)}}.contract-clause>h3,.clause-heading>h3:not(.clause-group){border-left-color:${h(style.accentColor)}}.contract-clause p{font-size:${Math.max(9,style.fontSize-1)}pt}.brand-name{max-width:110mm;overflow-wrap:anywhere}
  .contract-section[data-section="commitments"] .contract-clause{break-inside:auto;page-break-inside:auto}.contract-section[data-section="commitments"] p{font-size:9pt;line-height:1.45;margin-bottom:7px;break-inside:avoid;page-break-inside:avoid}
  ${quote.lines.length>=5?'.commercial-table td{padding-top:7px;padding-bottom:7px}.commercial-table h3{font-size:9pt}.project h2{font-size:16pt}.commercial-summary{margin-top:9px}':''}
  ${custom?'.document-header{padding-bottom:12px;margin-bottom:14px}.party-grid{margin-bottom:12px}.party p{font-size:8pt;line-height:1.3}.project{margin-bottom:12px}.commercial-table td{padding:10px 9px}.totals>div{padding:6px 4px}.commercial-summary{margin:12px 0 14px}':''}
  ${quote.lines.length>=5?'.commercial-table td{padding:6px 9px}.commercial-table p{font-size:8pt;margin:3px 0}.commercial-table h3{font-size:9pt;margin-bottom:3px}.commercial-summary{margin-top:8px}.totals>div{padding:5px 4px}':''}
  </style></head><body>
  <header class="document-header"><div class="brand">${style.logoDataUrl?`<img alt="${custom?'Logo de l’entreprise':'Symbole Atoum'}" src="${h(style.logoDataUrl)}">`:''}<div><div class="brand-name">${h(style.brandName)}</div><span class="tagline">${h(style.tagline)}</span></div></div><div class="document-meta"><h1>${h(style.documentTitle)}</h1><strong>${h(quote.number)}</strong><span>Émis le ${h(date(quote.createdAt))}</span><span>Valable jusqu’au ${h(date(quote.validUntil))}</span></div></header>
  ${draft ? '<div class="draft-banner"><strong>BROUILLON</strong> · Document de travail, non destiné à l’envoi ni à la signature.</div>' : ''}
  <div class="party-grid"><section class="party"><span class="eyebrow">Émetteur</span><strong>${h(style.brandName)}</strong>${readyIdentity.map(s => `<p>${h(s).replaceAll('\n','<br>')}</p>`).join('')}${!readyIdentity.length ? '<p>Informations administratives à compléter.</p>' : ''}</section><section class="party"><span class="eyebrow">Destinataire</span><strong>${h(recipient?.name ?? quote.contractRecipientLabel ?? quote.ownerLabel)}</strong>${recipientLines.map(l=>`<p>${h(String(l))}</p>`).join('')}</section></div>
  ${style.introduction?`<p class="document-introduction">${h(style.introduction)}</p>`:''}<section class="project"><span class="eyebrow">Votre projet</span><h2>${h(quote.subject)}</h2>${quote.needSummary && !same(quote.needSummary, quote.subject) ? `<p>${h(quote.needSummary)}</p>` : ''}</section>
  <table class="commercial-table"><colgroup><col style="width:55%"><col style="width:11%"><col style="width:17%"><col style="width:17%"></colgroup><thead><tr><th>Prestations${soldScope ? '' : ' et contenu'}</th><th>Qté</th><th>Prix unitaire</th><th>Montant</th></tr></thead><tbody>${quote.lines.map(l => lineHtml(l, !soldScope,productSummary,draft)).join('')}</tbody></table>
  <section class="commercial-summary"><div class="totals"><div class="grand-total"><span>${monthly.length?'Prestations ponctuelles et première période mensuelle':'Total convenu'}</span><strong>${h(money(quote.contractValueCents))}</strong></div>${paymentGroups?paymentGroups.map(m=>`<div><span>${h(m.lineLabel)} · ${h(m.label)}${['mensuelle','monthly'].includes(m.periodicity??'')?' / mois':''}<br>${h(m.dueDate||m.event)}</span><strong>${h(money(m.amountCents))}</strong></div>`).join(''):`<div><span>${quote.initialPaymentQualification === 'arrhes' ? 'Arrhes' : 'Acompte'} (${quote.depositPercent ?? 0} %)</span><strong>${h(money(quote.depositCents))}</strong></div><div><span>Solde</span><strong>${h(money(quote.balanceCents))}</strong></div>`}</div><p class="tax-note">${monthly.length?`Services récurrents : ${h(money(monthlyCents))} / mois ; durée et début selon les engagements des prestations.<br>`:''}${h(vat ?? 'Régime fiscal et présentation des taxes à confirmer.')}</p></section>
  <section class="practical"><h2>Organisation de la prestation</h2><p><strong>Délai estimé :</strong> ${h(quote.estimatedDelay || (dossierSections.length?'Voir les engagements propres à chaque prestation dans le périmètre détaillé.':'À définir ensemble'))}</p>${quote.prerequisitesText&&(separateScope||quote.lines.length>2||!presentation) ? `<p><strong>Prérequis :</strong><br>${h(quote.prerequisitesText).replaceAll('\n', '<br />')}</p>` : ''}${separateScope||!presentation?`<div class="annex-link">L’annexe contractuelle ci-après est rattachée au devis <strong>${h(quote.number)}</strong>. L’emplacement d’acceptation se trouve à la fin de ce dossier.</div>`:''}</section>
  ${soldScope&&separateScope ? `<section class="scope-detail"><h1>${h(style.scopeTitle)}</h1>${contractSectionHtml(soldScope, presentation!)}${quote.lines.map(l => {
    const components = Array.isArray(l.snapshot?.offerComponents) ? l.snapshot.offerComponents.filter((c): c is Record<string, unknown> => !!c && typeof c === 'object' && (!c.isOptional || typeof c.componentId !== 'string')) : [];
    return components.length ? `<section class="scope-components"><h3>Composition de l’offre : ${h(l.label)}</h3>${list(components.map(c => `${String(c.serviceName ?? '')} · ${(Number(c.quantityMilli ?? 1000) / 1000).toLocaleString('fr-FR')}${c.isOptional ? ' · option prévue dans l’offre' : ' · inclus'}`))}</section>` : '';
  }).join('')}</section>` : ''}
  <main class="annex"><header class="annex-heading"><span class="eyebrow">Devis ${h(quote.number)}</span><h1>${h(style.annexTitle)}</h1><p>Conditions générales, clauses des prestations et conditions particulières enregistrées pour ce devis.</p><p>${presentation?.compiledAt ? `Composition contractuelle du ${h(date(presentation.compiledAt))}` : 'Composition de travail · version non figée'}</p></header>${compactComposition}${annex}
  <div class="closing">${references.length ? `<section class="version-register"><h2>Références des clauses jointes</h2><p>${references.map(m => `<span title="${h(m.title)}">${h(m.code)} · version ${m.version}</span>`).join(' ; ')}</p></section>` : ''}
  ${quote.status === 'accepted' ? `<section class="acceptance"><h2>Acceptation enregistrée</h2><p>Devis ${h(quote.number)} · ${h(date(quote.acceptedAt))}</p><p>Se reporter à la preuve conservée dans le dossier client.</p></section>` : `<section class="acceptance"><h2>Acceptation du devis et de son annexe contractuelle</h2><p>Devis <strong>${h(quote.number)}</strong> — ${h(style.acceptanceText)}</p>${draft ? '<p class="signature-draft">Emplacement prévu pour la version définitive. Ce brouillon ne doit pas être signé.</p>' : ''}<div class="acceptance-fields"><div>Nom et qualité du signataire</div><div>Lieu et date</div></div><div class="signature">Signature</div></section>`}
  </div></main></body></html>`;
}

export function quotePageHeader(quote: QuoteDetail,p?:ContractPresentation): string {
  return `<div style="font:8px Arial;color:#626b73;width:100%;margin:0 14mm;display:flex;justify-content:space-between;border-bottom:1px solid #e1e5e8;padding-bottom:5px"><span>${h(p?.documentSettings?.brandName??'ATOUMWEB')}</span><span>Devis ${h(quote.number)}</span></div>`;
}
export function quotePageFooter(quote: QuoteDetail, p?: ContractPresentation): string {
  return `<div style="font:8px Arial;color:#626b73;width:100%;margin:0 14mm;border-top:2px solid ${h(p?.documentSettings?.accentColor??'#ffda00')};padding-top:7px;display:flex;justify-content:space-between"><span>${h(p?.documentSettings?.footerText??'')} ${h(quote.number)} · ${isQuoteDocumentDraft(quote, p) ? 'BROUILLON' : 'Devis et annexe contractuelle'}</span><span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
}
