import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CommercialScope } from './CommercialScope';

describe('04E — aide versionnée réutilisée par Prospection et Devis',()=>{
  const fixture={description:'Prestation proposée',inclusions:['Mise en place'],exclusions:['Photographies'],
    commercialParameters:{
      salesPitch:'Site accessible',relevantSituations:'Entreprise locale',
      benefits:'Présentation claire',qualificationQuestions:'Disposez-vous des textes ?',
      commercialCautions:'Ne pas promettre la première place',objections:'Budget : expliquer la portée',
    },
  };
  it('rend un volet ? consultatif au clavier sans bouton de vente ni clauses',()=>{
    const html=renderToStaticMarkup(<CommercialScope version={fixture}/>);
    expect(html).toContain('<details');
    expect(html).toContain('<summary');
    expect(html).toContain('? Aide à la vente');
    expect(html).toContain('Situations pertinentes');
    expect(html).toContain('Questions à poser');
    expect(html).toContain('Vigilances et promesses à éviter');
    expect(html).toContain('Ce qui est inclus');
    expect(html).toContain('Ce qui n’est pas inclus');
    expect(html).not.toContain('Ajouter au devis');
    expect(html).not.toContain('Conditions générales');
  });
  it('reste attaché au snapshot reçu sans lire la version publiée courante',()=>{
    const first=renderToStaticMarkup(<CommercialScope version={{
      ...fixture,commercialParameters:{salesPitch:'Première version'},
    }}/>);
    const second=renderToStaticMarkup(<CommercialScope version={{
      ...fixture,commercialParameters:{salesPitch:'Nouvelle version'},
    }}/>);
    expect(first).toContain('Première version');
    expect(first).not.toContain('Nouvelle version');
    expect(second).toContain('Nouvelle version');
  });
  it('ne crée pas de faux contenus si les champs d’aide sont absents',()=>{
    const html=renderToStaticMarkup(<CommercialScope version={{description:'Document livré'}}/>);
    expect(html).toContain('Document livré');
    expect(html).not.toContain('catalog-sales-guidance-details');
  });
});