import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/** F71b : plus de 30 % par défaut dans l'interface ; la règle s'affiche, la facilité de paiement reste manuelle. */
const read = (file: string) => readFileSync(resolve(__dirname, file), 'utf8');
const wizard = read('QuoteWizard.tsx');

describe('F71b : assistant de devis', () => {
  it('aucun acompte pré-rempli (ni 30 %, ni réglage, ni acompte de la version)', () => {
    expect(wizard).not.toMatch(/depositPercent: '30'/);
    expect(wizard).not.toContain('defaultDeposit');
    expect(wizard).not.toContain('defaults.depositPercent');
    expect(wizard).not.toContain('defaultDepositPercent');
  });

  it('l’échéancier proposé vient de la règle partagée et s’affiche avec sa raison', () => {
    expect(wizard).toContain("import {defaultPaymentSchedule} from '../../shared/paymentScheduleRules';");
    expect(wizard).toContain('scheduleDecision.reason');
  });

  it('seule une facilité de paiement choisie à la main envoie un acompte', () => {
    expect(wizard).toContain("...(draft.payment === 'manual' ? {depositPercent: Number(draft.depositPercent)} : {})");
    expect(wizard).not.toContain('paymentPlan: plan.id');
  });
});

describe('F71b : Réglages et préparation', () => {
  it('le réglage « Acompte proposé (%) » n’est plus à l’écran', () => {
    expect(read('CompanyQuoteSettings.tsx')).not.toContain('Acompte proposé');
  });

  it('la préparation dit d’où vient l’échéancier', () => {
    const panel = read('QuoteContractPreparationPanel.tsx');
    expect(panel).toContain("p.payment.origin==='to_define'");
    expect(panel).toContain('Échéancier à définir');
    expect(panel).toContain('Échéancier posé par la règle');
  });
});
