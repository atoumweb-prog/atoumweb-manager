import { statisticsDelta } from '../../shared/statistics';

export interface StatisticsComparison {
  text: string;
  direction: 'up' | 'down' | 'same' | 'new';
}

export function compare(current: number, previous: number): StatisticsComparison {
  if (current === 0 && previous === 0) return { text: 'Aucune donnée sur les deux périodes', direction: 'same' };
  const delta = statisticsDelta(current, previous);
  if (delta === null) return { text: 'Nouveau sur la période', direction: 'new' };
  if (Math.abs(delta) < .05) return { text: 'Stable vs période précédente', direction: 'same' };
  return {
    text: (delta > 0 ? '+' : '') + delta.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' % vs période précédente',
    direction: delta > 0 ? 'up' : 'down',
  };
}

/** Texte d'aide d'une carte de chiffre. Les deux périodes à zéro n'apprennent rien : pas de ligne répétée sur les quatre cartes. */
export function comparisonHelper(value: StatisticsComparison | undefined): string | undefined {
  if (!value) return undefined;
  if (value.direction === 'same' && value.text === 'Aucune donnée sur les deux périodes') return undefined;
  return value.text;
}
