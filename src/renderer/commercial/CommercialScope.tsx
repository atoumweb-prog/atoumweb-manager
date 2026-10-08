import type {CatalogVersionInput} from '../../shared/commercial';

/** Same descriptive sold/reference data during RDV and Devis. Never a contractual applicability rule. */
export function CommercialScope({version}:{version:CatalogVersionInput|Record<string,unknown>|null|undefined}) {
  if(!version)return null;
  const v=version as CatalogVersionInput,c=v.commercialParameters;
  const inclusions=Array.isArray(v.inclusions)?v.inclusions:[],exclusions=Array.isArray(v.exclusions)?v.exclusions:[];
  if(!c?.clientNeed&&!c?.work&&!v.description&&!inclusions.length&&!exclusions.length&&!c?.options)return null;
  return <div className="commercial-scope">
    {c?.clientNeed&&<p><strong>Intérêt pour le client</strong><br/>{c.clientNeed}</p>}
    {(c?.work||v.description)&&<p><strong>Prestation prévue</strong><br/>{c?.work||v.description}</p>}
    {inclusions.length>0&&<div><strong>Ce qui est inclus</strong><ul>{inclusions.map((x,i)=><li key={i}>{x}</li>)}</ul></div>}
    {exclusions.length>0&&<div><strong>Ce qui n’est pas inclus</strong><ul>{exclusions.map((x,i)=><li key={i}>{x}</li>)}</ul></div>}
    {c?.options&&<p><strong>Compléments possibles</strong><br/>{c.options}</p>}
    {c?.quoteRequiredWhen&&<p><strong>À chiffrer séparément si</strong><br/>{c.quoteRequiredWhen}</p>}
  </div>;
}
