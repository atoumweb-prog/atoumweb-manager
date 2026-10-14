import type { KeyboardEvent } from 'react';
import type { CatalogVersionInput } from '../../shared/commercial';

/** Descriptive, version-scoped data during Prospect/Devis. Never a contract applicability rule. */
export function CommercialScope({version}:{version:CatalogVersionInput|Record<string,unknown>|null|undefined}) {
  if(!version)return null;
  const v=version as CatalogVersionInput,c=v.commercialParameters;
  const inclusions=Array.isArray(v.inclusions)?v.inclusions:[],exclusions=Array.isArray(v.exclusions)?v.exclusions:[];
  const hasGuidance=Boolean(c?.benefits||c?.salesPitch||c?.qualificationQuestions||c?.relevantSituations||
    c?.commercialCautions||c?.objections);
  if(!c?.clientNeed&&!c?.work&&!v.description&&!inclusions.length&&!exclusions.length&&!c?.options&&!hasGuidance)return null;
  const closeOnEscape=(event:KeyboardEvent<HTMLDetailsElement>)=>{
    if(event.key!=='Escape'||!event.currentTarget.open)return;
    event.preventDefault();event.stopPropagation();
    event.currentTarget.open=false;
    event.currentTarget.querySelector('summary')?.focus();
  };
  return <div className="commercial-scope">
    {c?.clientNeed&&<p><strong>Intérêt pour le client</strong><br/>{c.clientNeed}</p>}
    {(c?.work||v.description)&&<p><strong>Prestation prévue</strong><br/>{c?.work||v.description}</p>}
    {inclusions.length>0&&<div><strong>Ce qui est inclus</strong><ul>{inclusions.map((x,i)=><li key={i}>{x}</li>)}</ul></div>}
    {exclusions.length>0&&<div><strong>Ce qui n’est pas inclus</strong><ul>{exclusions.map((x,i)=><li key={i}>{x}</li>)}</ul></div>}
    {c?.options&&<p><strong>Compléments possibles</strong><br/>{c.options}</p>}
    {c?.quoteRequiredWhen&&<p><strong>À chiffrer séparément si</strong><br/>{c.quoteRequiredWhen}</p>}
    {hasGuidance&&<details className="catalog-sales-guidance-details" onKeyDown={closeOnEscape}>
      <summary tabIndex={0} title="Aide commerciale versionnée, sans ajout au devis">? Aide à la vente</summary>
      {c?.salesPitch&&<p><strong>Argumentaire</strong>{' '}{c.salesPitch}</p>}
      {c?.relevantSituations&&<p><strong>Situations pertinentes</strong>{' '}{c.relevantSituations}</p>}
      {c?.benefits&&<p><strong>Bénéfices possibles</strong>{' '}{c.benefits}</p>}
      {c?.qualificationQuestions&&<p><strong>Questions à poser</strong>{' '}{c.qualificationQuestions}</p>}
      {c?.commercialCautions&&<p><strong>Vigilances et promesses à éviter</strong>{' '}{c.commercialCautions}</p>}
      {c?.objections&&<p><strong>Objections et réponses</strong>{' '}{c.objections}</p>}
      <small>Conseils de préparation internes. Aucun ajout automatique au devis ou aux CGV.</small>
    </details>}
  </div>;
}
