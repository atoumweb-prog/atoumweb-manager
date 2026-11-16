import { describe, expect, it } from 'vitest';
import { prospectNextStep } from './prospectNextStep';

/** F57 (décision de Carlos du 16/11/2026) : la prochaine étape suit l'état du devis courant. Affichage seul. */
const step = (stage: Parameters<typeof prospectNextStep>[0]['stage'], quoteStatus: Parameters<typeof prospectNextStep>[0]['quoteStatus']) =>
  prospectNextStep({ stage, quoteStatus, qualificationGaps: 0 });

describe('F57 : prochaine étape selon l’état du devis', () => {
  it('devis en brouillon ou absent : « Poursuivre le devis »', () => {
    expect(step('quote_to_prepare', 'draft')).toMatchObject({ kind: 'continue_quote', primaryLabel: 'Poursuivre le devis' });
    expect(step('quote_to_send', null)).toMatchObject({ kind: 'continue_quote', primaryLabel: 'Poursuivre le devis' });
  });

  it('devis envoyé ou vu, prospect en négociation : « Enregistrer la réponse du client »', () => {
    expect(step('negotiation', 'sent')).toMatchObject({ kind: 'record_reply', primaryLabel: 'Enregistrer la réponse du client' });
    expect(step('follow_up', 'viewed')).toMatchObject({ kind: 'record_reply', primaryLabel: 'Enregistrer la réponse du client' });
  });

  it('devis refusé ou expiré : revoir le devis', () => {
    expect(step('negotiation', 'refused')).toMatchObject({ kind: 'review_quote', primaryLabel: 'Revoir le devis (révision ou nouveau devis)' });
    expect(step('waiting', 'expired')).toMatchObject({ kind: 'review_quote' });
  });

  it('devis accepté sur un dossier pas encore clos : voir le devis accepté', () => {
    expect(step('negotiation', 'accepted')).toMatchObject({ kind: 'review_quote', primaryLabel: 'Voir le devis accepté' });
  });

  it('avant l’étape devis, l’état d’un devis ne change rien', () => {
    expect(step('need_identified', 'sent')).toMatchObject({ kind: 'prepare_quote', primaryLabel: 'Préparer le devis' });
  });

  it('un dossier clos reste clos', () => {
    expect(prospectNextStep({ stage: 'won', quoteStatus: 'accepted', qualificationGaps: 0 })).toMatchObject({ kind: 'closed' });
  });
});
