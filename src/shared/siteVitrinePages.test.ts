import {describe,expect,it} from 'vitest';
import {defaultVitrineLineScope,STANDARD_VITRINE_PAGES,STANDARD_VITRINE_SCOPE} from './siteVitrinePages';

describe('forfait Site vitrine AtoumWeb — cinq pages standard',()=>{
  it('prépare une structure commerciale de cinq pages sans page juridique inventée',()=>{
    expect(STANDARD_VITRINE_PAGES).toEqual([
      'Accueil',
      'Services / Prestations',
      'À propos',
      'Réalisations / Avis clients',
      'Contact',
    ]);
    expect(STANDARD_VITRINE_SCOPE).toContain('avant acceptation du devis');
    expect(STANDARD_VITRINE_SCOPE).not.toContain('Mentions légales');
  });
  it('ne propose ce périmètre que sur l’offre vitrine explicitement identifiée',()=>{
    expect(defaultVitrineLineScope('atoumweb-vitrine',null)).toBe(STANDARD_VITRINE_SCOPE);
    expect(defaultVitrineLineScope('autre-identité','AW-WEB-VITRINE-5P')).toBe(STANDARD_VITRINE_SCOPE);
    expect(defaultVitrineLineScope('autre-identité',null)).toBeNull();
    expect(defaultVitrineLineScope('atoumweb-ecommerce',null)).toBeNull();
  });
});
