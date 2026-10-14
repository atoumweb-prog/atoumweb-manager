import {describe,expect,it} from 'vitest';
import {compareCatalogSalesAdvice} from './catalogAdviceComparison';

describe('04E — comparer les aides entre snapshots de version',()=>{
  it('expose les champs métier modifiés sans modifier les versions',()=>{
    const prior={commercialParameters:{salesPitch:'Présenter la version 1',
      relevantSituations:'Commerce local',commercialCautions:'Sans garantie de ventes'},
      internalAdvice:'Rappeler le périmètre'};
    const next={commercialParameters:{salesPitch:'Présenter la version 2',
      relevantSituations:'PME locale',commercialCautions:'Sans garantie de ventes',
      qualificationQuestions:'Le client a-t-il ses contenus ?'},
      internalAdvice:'Rappeler les délais'};
    const state=JSON.stringify([prior,next]);
    const result=compareCatalogSalesAdvice(prior,next);
    expect(result.map(row=>row.field)).toEqual([
      'commercialParameters.salesPitch','commercialParameters.qualificationQuestions',
      'commercialParameters.relevantSituations','internalAdvice',
    ]);
    expect(result[1]).toMatchObject({label:'Questions de qualification',previous:'—',
      proposed:'Le client a-t-il ses contenus ?'});
    expect(JSON.stringify([prior,next])).toBe(state);
    expect(result.some(row=>/CGV|contrat/i.test(row.label))).toBe(false);
  });
  it('ne montre aucune fausse différence si les données sont identiques',()=>{
    const current={commercialParameters:{objections:'Budget : expliquer les livrables'},internalAdvice:'Interne'};
    expect(compareCatalogSalesAdvice(current,current)).toEqual([]);
  });
  it('affiche un retrait explicite sans supprimer les données historiques',()=>{
    const original={commercialParameters:{benefits:'Présence web'},internalAdvice:'Historique'};
    const proposed={commercialParameters:{},internalAdvice:null};
    expect(compareCatalogSalesAdvice(original,proposed)).toEqual([
      {field:'commercialParameters.benefits',label:'Bénéfices client',previous:'Présence web',proposed:'—'},
      {field:'internalAdvice',label:'Conseils internes',previous:'Historique',proposed:'—'},
    ]);
  });
});