import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { CatalogItemDetail, CatalogVersion } from '../../shared/commercial';
import { CatalogPublicationReview } from './CatalogPublicationReview';

const version=(id:string,status:'draft'|'published',pitch:string):CatalogVersion=>({
  id,itemId:'item-1',versionNumber:status==='published'?1:2,status,
  createdAt:'2026-10-14',priceMode:'fixed',priceCents:9900,
  nature:'Conseil commercial',description:'Prestation de test',inclusions:['Audit'],
  commercialParameters:{salesPitch:pitch,qualificationQuestions:'Quels contenus ?'},
});
describe('04E — prépublication présente des aides détaillées sans certification juridique',()=>{
  it('compare le conseil publié et le nouveau brouillon dans le panneau réel',()=>{
    const previous=version('old','published','V1');
    const draft=version('new','draft','V2');
    const item:CatalogItemDetail={id:'item-1',name:'Test',type:'service',
      status:'active',visiblePublic:false,createdAt:'2026-10-14',updatedAt:'2026-10-14',
      currentVersion:previous,versions:[previous,draft]};
    const html=renderToStaticMarkup(<CatalogPublicationReview
      item={item} draft={draft} components={null} busy={false}
      onConfirm={()=>{throw Error('Publication involontaire');}} onCancel={()=>{}}/>);
    expect(html).toContain('Aides commerciales versionnées');
    expect(html).toContain('Argumentaire commercial');
    expect(html).toContain('V1');
    expect(html).toContain('V2');
    expect(html).toContain('ne constituent ni un contrat');
    expect(html).toContain('Confirmer la publication');
    expect(html).not.toContain('Contrat conforme');
  });
});