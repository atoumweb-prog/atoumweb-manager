import {describe,expect,it} from 'vitest';
import {quoteWizardPriceCents} from './quoteWizardPrice';

describe('06A E151 — prix offre du nouvel assistant devis',()=>{
  it('conserve le tarif catalogue sans surcharge',()=>{
    expect(quoteWizardPriceCents('',69900)).toBe(69900);
    expect(quoteWizardPriceCents('   ',0)).toBe(0);
  });
  it('priorise toujours le prix proposé, même zéro',()=>{
    expect(quoteWizardPriceCents('499,99',69900)).toBe(49999);
    expect(quoteWizardPriceCents('0',69900)).toBe(0);
    expect(quoteWizardPriceCents('120.50',null)).toBe(12050);
  });
  it('signale une prestation sans tarif et sans prix proposé',()=>{
    expect(quoteWizardPriceCents('',null)).toBeNull();
    expect(quoteWizardPriceCents('',undefined)).toBeNull();
  });
  it('rejette les prix invalides sans les présenter comme prix catalogue',()=>{
    for(const value of ['abc','-1','Infinity','NaN','999999999999999999999']) {
      expect(()=>quoteWizardPriceCents(value,69900)).toThrow('Montant invalide.');
    }
  });
});
