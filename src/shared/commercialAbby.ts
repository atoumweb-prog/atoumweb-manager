import type { QuoteDetail, QuoteLine } from './commercial';
import type { CommercialVersionRules } from './commercialRules';

const money = (cents:number) => `${(cents/100).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})} €`;
export function commercialAbbyBlock(quote: QuoteDetail): string {
  return [`${quote.number} — ${quote.subject}`, ...quote.lines.map((line: QuoteLine) => {
    const snapshot=line.snapshot || {};
    const parameters=line.parameters;
    return [String(snapshot.canonicalCode || 'Ligne personnalisée'), String(snapshot.abbyLabel || line.label),
      `Quantité : ${(line.quantityMilli || 1000)/1000} ${String(snapshot.unit || 'unité')}`,
      `Prix catalogue unitaire : ${snapshot.priceMode==='quote_only'||(line.source==='catalog'&&snapshot.priceCents==null)?'Sur devis / coût à renseigner':money(line.catalogUnitPriceCents || 0)}`,
      `Prix proposé unitaire : ${money(line.proposedUnitPriceCents || 0)}`,
      `Total : ${money(line.contractLineValueCents)}`,
      line.adjustmentMode !== 'none' ? `Ajustement : ${line.adjustmentMode} / ${line.adjustmentValue ?? 0} — ${line.discountReasonText || line.discountReasonCode || ''}` : '',
      (snapshot.commercialRules as CommercialVersionRules | undefined)?.minimumLineCents != null ? `Minimum de facturation : ${money((snapshot.commercialRules as CommercialVersionRules).minimumLineCents!)}` : '',
      (snapshot.commercialRules as CommercialVersionRules | undefined)?.minimumBilledQuantityMilli ? `Minimum facturé : ${(snapshot.commercialRules as CommercialVersionRules).minimumBilledQuantityMilli!/1000} ${String(snapshot.unit||'unité')}, quantité réelle conservée` : '',
      line.label, line.description || '',
      snapshot.commercialParameters ? Object.values(snapshot.commercialParameters as Record<string,unknown>).filter(value=>typeof value==='string'&&value.trim()).join('\n') : '',
      parameters?.scope || '',parameters?.acceptedDeadline ? `Délai accepté : ${parameters.acceptedDeadline}` : '',
      line.optionPurchase ? 'Option explicitement achetée' : ''].filter(Boolean).join('\n');
  }), `Total devis : ${money(quote.contractValueCents)}`,quote.estimatedDelay || ''].filter(Boolean).join('\n\n');
}
