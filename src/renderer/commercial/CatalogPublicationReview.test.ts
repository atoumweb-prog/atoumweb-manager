import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { CatalogItemDetail, CatalogVersion } from '../../shared/commercial';
import { CatalogPublicationReview } from './CatalogPublicationReview';

const version=(id:string,status:'draft'|'published',price:number|null=69900):CatalogVersion=>({
  id,itemId:'offer1',versionNumber:id==='original'?1:2,status,
  priceMode:'starting_from',priceCents:price,nature:'Site vitrine',
  description:'Création site',inclusions:['5 pages'],createdAt:'2026-10-14',
});
const item=(draft:CatalogVersion,old?:CatalogVersion):CatalogItemDetail=>({
  id:'offer1',name:'Site vitrine',type:'offer',status:'active',visiblePublic:false,
  createdAt:'2026-10-14',updatedAt:'2026-10-14',
  currentVersion:old??draft,versions:[draft,...old?[old]:[]],
});

describe('04C prépublication React sans recette graphique',()=>{
  it('affiche comparaison et avertissement CGV sans certifier la conformité',()=>{
    const old=version('original','published',69900);
    const draft={...version('next','draft',79900),description:'Nouveau périmètre'};
    const html=renderToStaticMarkup(createElement(CatalogPublicationReview,{
      item:item(draft,old),draft,components:[],busy:false,onCancel:()=>{},onConfirm:()=>{},
    }));
    expect(html).toContain('Différences avec v1');
    expect(html).toContain('Prix catalogue');
    expect(html).toContain('69900');
    expect(html).toContain('79900');
    expect(html).toContain('Vérifier séparément les clauses CGV');
    expect(html).toContain('Confirmer la publication de ce brouillon');
    expect(html).not.toContain('Contrat conforme');
  });

  it('bloque le bouton pour un prix invalide, laisse visible le motif, et conserve Annuler',()=>{
    const draft=version('next','draft',null);
    const html=renderToStaticMarkup(createElement(CatalogPublicationReview,{
      item:item(draft),draft,components:null,busy:false,onCancel:()=>{},onConfirm:()=>{},
    }));
    expect(html).toContain('Blocage technique');
    expect(html).toContain('centimes valide');
    expect(html).toMatch(/disabled=""[^>]*>Confirmer la publication/);
    expect(html).toContain('Annuler');
  });
});
