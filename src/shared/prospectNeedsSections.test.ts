import { describe, expect, it } from 'vitest';
import { defaultOpenNeedsSection, initialNeedsOpen, needsSectionSummary, sectionForMissingTab } from './prospectNeedsSections';

describe('R3 : sections repliables de Besoins', () => {
  it('la section ouverte par défaut suit l’étape du dossier', () => {
    expect(defaultOpenNeedsSection('new')).toBe('qualification');
    expect(defaultOpenNeedsSection('qualifying')).toBe('qualification');
    expect(defaultOpenNeedsSection('need_identified')).toBe('brief');
    expect(defaultOpenNeedsSection('quote_sent')).toBe('brief');
  });

  it('sans préférence enregistrée, une seule section est ouverte', () => {
    expect(initialNeedsOpen('qualifying', {})).toEqual({ qualification: true, brief: false, commercial: false, services: false });
    expect(initialNeedsOpen('need_identified', {})).toEqual({ qualification: false, brief: true, commercial: false, services: false });
  });

  it('une préférence enregistrée l’emporte sur la valeur par défaut, dans les deux sens', () => {
    expect(initialNeedsOpen('need_identified', { brief: 'closed', services: 'open' })).toEqual({ qualification: false, brief: false, commercial: false, services: true });
    expect(initialNeedsOpen('qualifying', { qualification: 'closed' }).qualification).toBe(false);
  });

  it('un champ à compléter ouvre la section qui le contient', () => {
    expect(sectionForMissingTab('qualification')).toBe('qualification');
    expect(sectionForMissingTab('brief')).toBe('brief');
    expect(sectionForMissingTab('commercial')).toBe('commercial');
    expect(sectionForMissingTab('services')).toBe('services');
    expect(sectionForMissingTab('contacts')).toBeNull();
    expect(sectionForMissingTab('inconnu')).toBeNull();
  });

  it('le résumé d’une section repliée tient en une ligne et dit ce qui manque', () => {
    expect(needsSectionSummary('qualification', { qualificationGaps: 2 })).toBe('2 informations à compléter');
    expect(needsSectionSummary('qualification', { qualificationGaps: 1 })).toBe('1 information à compléter');
    expect(needsSectionSummary('qualification', { qualificationGaps: 0 })).toBe('Complète');
    expect(needsSectionSummary('brief', { projectSummary: '  Site vitrine pour la mairie  ' })).toBe('Site vitrine pour la mairie');
    expect(needsSectionSummary('brief', { projectSummary: '' })).toBe('À préciser');
    expect(needsSectionSummary('brief', { projectSummary: 'x'.repeat(200) }).length).toBeLessThanOrEqual(80);
    expect(needsSectionSummary('commercial', { budgetStatus: 'range', timelineStatus: 'date' })).toBe('Renseigné');
    expect(needsSectionSummary('commercial', { budgetStatus: null, timelineStatus: 'date' })).toBe('À renseigner');
  });

  it('P3a (F4) : « Prestations et points à confirmer » résume les points à confirmer et leurs bloquants', () => {
    expect(needsSectionSummary('services', {})).toBe('À préciser');
    expect(needsSectionSummary('services', { informationCount: 0 })).toBe('À préciser');
    expect(needsSectionSummary('services', { informationCount: 3, openInformationCount: 0 })).toBe('Tout est confirmé');
    expect(needsSectionSummary('services', { informationCount: 3, openInformationCount: 1 })).toBe('1 point à confirmer');
    expect(needsSectionSummary('services', { informationCount: 4, openInformationCount: 2, blockingInformationCount: 0 })).toBe('2 points à confirmer');
    expect(needsSectionSummary('services', { informationCount: 4, openInformationCount: 2, blockingInformationCount: 1 })).toBe('2 points à confirmer · 1 bloquant');
    expect(needsSectionSummary('services', { informationCount: 4, openInformationCount: 3, blockingInformationCount: 2 })).toBe('3 points à confirmer · 2 bloquants');
  });
});
