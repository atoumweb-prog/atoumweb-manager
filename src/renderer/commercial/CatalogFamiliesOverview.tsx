import type {CatalogItemSummary} from '../../shared/commercial';
import {OperationIcon, type OperationIconName} from '../operations/OperationIcon';
import {catalogFamilies,familyPriceHints} from './catalogWorkspaceModel';

export function CatalogFamiliesOverview({items,onFamily,onOpen,formatPrice}:{items:readonly CatalogItemSummary[];onFamily:(id:string)=>void;onOpen:(id:string)=>void;formatPrice:(item:CatalogItemSummary)=>string}) {
  const families=catalogFamilies(items),offers=items.filter(x=>x.type==='offer');
  const familyIcon=(name:string):OperationIconName=>/maintenance/i.test(name)?'shield-check':/commerce/i.test(name)?'wallet':/mariage/i.test(name)?'gift':/site|landing/i.test(name)?'server':/photo|visuelle/i.test(name)?'image':/contenu/i.test(name)?'file-text':/audience|visibilit/i.test(name)?'chart':/application|WordPress/i.test(name)?'code':'wrench';
  const renderFamily=(family:ReturnType<typeof catalogFamilies>[number])=>{const hints=familyPriceHints(family.items);return <article key={family.id} className="ot-family-card" data-catalog-family={family.id}>
        <div className="ot-family-heading"><span className="ot-family-icon"><OperationIcon name={familyIcon(family.name)}/></span><h3>{family.name}</h3></div>
        <p>{family.offers} offre{family.offers>1?'s':''} · {family.services} service{family.services>1?'s':''}</p>
        <button type="button" onClick={()=>onFamily(family.id)}>Voir les prestations <span aria-hidden="true">→</span></button>
        <details className="ot-family-price-details"><summary>Repères tarifaires{hints.length?` (${hints.length})`:''}</summary><div className="ot-family-prices">{hints.map(hint=><span key={hint}>{hint}</span>)}{!hints.length&&<span>Aucun tarif actif publié</span>}</div><small>Articles actifs, versions publiées uniquement. Périodes et unités séparées.</small></details>
      </article>;};
  return <div className="catalog-families-overview">
    <section className="ot-section" aria-label="Familles commerciales"><header><OperationIcon name="layers"/><div><h2>Familles commerciales</h2><p>Explorer les offres et services du Catalogue par famille.</p></div><span>{families.length} familles</span></header>
      {families.length?<><div className="ot-family-grid">{families.slice(0,4).map(renderFamily)}</div>{families.length>4&&<details className="ot-more-families"><summary>Explorer les {families.length-4} autres familles <span>Toutes les prestations restent accessibles</span></summary><div className="ot-family-grid">{families.slice(4).map(renderFamily)}</div></details>}</>:<p className="empty-table">Aucune offre ou service pour ces filtres.</p>}
    </section>
    {!!offers.length&&<section id="ot-existing-offers" className="ot-section" aria-label="Offres du catalogue"><header><OperationIcon name="package"/><div><h2>Offres du catalogue</h2><p>Chaque formule conserve son identité et ses versions.</p></div><span>{offers.length} offre{offers.length>1?'s':''}</span></header><div className="ot-offers-grid">{offers.map(item=><button key={item.id} type="button" data-catalog-item-id={item.id} className="ot-offer-card" onClick={()=>onOpen(item.id)}><span className="ot-offer-heading"><span className="ot-family-icon"><OperationIcon name={familyIcon(item.name)}/></span><strong>{item.name}</strong></span><span>{formatPrice(item)}</span><small>{item.status==='active'?'Actif':item.status==='inactive'?'Inactif':'Archivé'} · {item.currentVersion?`v${item.currentVersion.versionNumber} · ${item.currentVersion.status==='published'?'Publiée':item.currentVersion.status==='draft'?'Brouillon':'Retirée'}`:'Sans version'}</small><span className="ot-offer-action">Consulter l’offre <span aria-hidden="true">→</span></span></button>)}</div></section>}
    <p className="ot-source-note"><OperationIcon name="file-check"/> Publication du Catalogue, statut d’article et visibilité du site restent distincts. Aucun contenu n’est publié automatiquement sur WordPress.</p>
  </div>;
}
