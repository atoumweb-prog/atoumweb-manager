import { describe, expect, it } from 'vitest';
import type { CatalogItemDetail, CatalogVersion, OfferComponent } from './commercial';
import { compareCatalogVersions, reviewCatalogPrepublication } from './catalogVersionReview';

const v=(id:string, props:Partial<CatalogVersion>={}):CatalogVersion=>({
  id,itemId:'service-one',versionNumber:id==='first'?1:2,status:'draft',
  createdAt:'2026-10-14T08:00:00Z',priceMode:'fixed',priceCents:9900,
  nature:'Création de site',description:'Site vitrine',inclusions:['Design'],
  exclusions:[],prerequisites:[],...props,
});
const item=(version:CatalogVersion,type:'offer'|'service'='service'):CatalogItemDetail=>({
  id:'service-one',type,name:'Prestation témoin',category:'Web',status:'active',
  visiblePublic:false,createdAt:'2026-10-14',updatedAt:'2026-10-14',
  currentVersion:version,versions:[version],
});

describe('04C / E101 — comparaison publique/brouillon',()=>{
  it('expose les variations de prix, mode, contenu et bénéfices versionnés sans modifier les entrées',()=>{
    const published=v('first',{status:'published',priceCents:9900,
      commercialParameters:{clientNeed:'Présence web'}});
    const draft=v('next',{priceCents:14900,description:'Site optimisé',
      inclusions:['Design','SEO'],commercialParameters:{clientNeed:'Présence web',keywords:'SEO local'}});
    const before=JSON.stringify([published,draft]);
    const diff=compareCatalogVersions(published,draft);
    expect(diff.map(r=>r.field)).toEqual(['description','inclusions','priceCents','commercialParameters']);
    expect(diff.find(r=>r.field==='priceCents')).toMatchObject({previous:'9900',proposed:'14900'});
    expect(JSON.stringify([published,draft])).toBe(before);
  });

  it('ne produit aucune différence si la version est identique ; sans historique, signale le contenu proposé',()=>{
    const draft=v('next');
    expect(compareCatalogVersions(draft,draft)).toEqual([]);
    expect(compareCatalogVersions(null,draft).some(r=>r.field==='priceCents')).toBe(true);
  });

  it('bloque uniquement les incohérences techniques, sans déclarer une validation CGV',()=>{
    const draft=v('next',{priceCents:14900});
    const review=reviewCatalogPrepublication(item(draft),draft);
    expect(review.blocking).toEqual([]);
    expect(review.warnings.some(w=>w.includes('CGV'))).toBe(true);
    expect(review.warnings.every(w=>!w.includes('conforme'))).toBe(true);
    expect(reviewCatalogPrepublication(item(draft),v('next',{priceCents:null})).blocking)
      .toContain('Le montant de la prestation doit être un nombre entier de centimes valide.');
    const realCost=v('next',{priceBasis:'actual_cost',priceMode:'fixed',priceCents:1000});
    expect(reviewCatalogPrepublication(item(realCost),realCost).blocking.some(w=>w.includes('coût tiers réel'))).toBe(true);
    const historic=v('next',{status:'published'});
    expect(reviewCatalogPrepublication(item(historic),historic).blocking).toContain('Seul un brouillon peut être publié.');
  });

  it('un service n’exige pas de blueprint ; une offre vide déclenche uniquement un avertissement',()=>{
    const draft=v('next');
    expect(reviewCatalogPrepublication(item(draft),draft,[]).warnings.some(w=>w.includes('service associé'))).toBe(false);
    const offer=item(draft,'offer');
    const review=reviewCatalogPrepublication(offer,draft,[]);
    expect(review.blocking).toEqual([]);
    expect(review.warnings.some(w=>w.includes('service associé'))).toBe(true);
    const component={id:'1',offerVersionId:draft.id,serviceVersionId:'v1',serviceItemId:'item2',
      serviceName:'SEO',serviceVersionNumber:1,priceMode:'fixed',priceCents:9900,isOptional:false,
      quantityMilli:1000,sortOrder:0} satisfies OfferComponent;
    expect(reviewCatalogPrepublication(offer,draft,[component]).warnings.some(w=>w.includes('service associé'))).toBe(false);
  });

  it('refuse de préparer la publication d’une version appartenant à une autre prestation',()=>{
    const draft=v('next',{itemId:'another-service'});
    expect(reviewCatalogPrepublication(item(draft),draft).blocking.some(x=>x.includes('ne correspond pas'))).toBe(true);
  });
});
