import {describe,expect,it} from 'vitest';
import {CATALOG_EDITOR_TABS,CATALOG_INPUT_TABS,catalogTabHasVersionFields,catalogTabAppliesToType} from './catalogEditorTabs';

describe('04C — huit onglets métier',()=>{
  it('garde exactement huit identifiants stables, labels distincts et navigation accessible',()=>{
    expect(CATALOG_EDITOR_TABS.map(t=>t.id)).toEqual([
      'identity','pricing','scope','associations','sales','contracts','production','history',
    ]);
    expect(new Set(CATALOG_EDITOR_TABS.map(t=>t.id)).size).toBe(8);
    expect(new Set(CATALOG_EDITOR_TABS.map(t=>t.label)).size).toBe(8);
    expect(CATALOG_EDITOR_TABS.every(t=>t.label&&t.hint)).toBe(true);
  });
  it('tous les champs modifiables restent dans le même brouillon, associations/production/historique hors formulaire',()=>{
    expect(CATALOG_INPUT_TABS).toEqual(['identity','pricing','scope','sales','contracts']);
    expect(CATALOG_EDITOR_TABS.filter(t=>catalogTabHasVersionFields(t.id)).map(t=>t.id))
      .toEqual(CATALOG_INPUT_TABS);
    expect(catalogTabHasVersionFields('production')).toBe(false);
  });
  it('les compositions concernent les Offres, mais les recommandations 04D aussi les Services',()=>{
    expect(catalogTabAppliesToType('associations','offer')).toBe(true);
    expect(catalogTabAppliesToType('associations','service')).toBe(true);
    expect(catalogTabAppliesToType('production','service')).toBe(true);
  });
});
