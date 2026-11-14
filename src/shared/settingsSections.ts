/**
 * Réglages (R9). Fonctions pures : ordre des sections et phrase d'état de « Mon entreprise ».
 * Elles lisent les états existants des informations, sans introduire aucune règle métier.
 */

export const SETTINGS_SECTION_ORDER = ['company', 'appearance', 'navigation', 'data', 'diagnostic', 'recette'] as const;
export type SettingsSectionKey = (typeof SETTINGS_SECTION_ORDER)[number];

export type CompanyInfoState = 'missing' | 'filled' | 'verify' | 'not_applicable';

export interface CompanyStatus {
  tone: 'ok' | 'todo';
  text: string;
}

/** Met la première lettre en minuscule, sauf pour un sigle (« TVA »). */
function inline(label: string): string {
  const first = label.split(/\s+/)[0] ?? '';
  const acronym = first.length >= 2 && first === first.toUpperCase() && /[A-ZÀ-Ý]/.test(first);
  return acronym ? label : label.charAt(0).toLowerCase() + label.slice(1);
}

/**
 * `scope` : « company » pour les informations des devis, « terms » pour les informations contractuelles.
 * « non applicable » compte comme traitée ; « à vérifier » demande un contrôle.
 */
export function companyStatus(input: { scope: 'company' | 'terms'; items: Array<{ label: string; state: CompanyInfoState }> }): CompanyStatus {
  const { scope, items } = input;
  if (items.length === 0) return { tone: 'ok', text: 'Aucune information à renseigner.' };
  const missing = items.filter((item) => item.state === 'missing').map((item) => inline(item.label));
  const verify = items.filter((item) => item.state === 'verify').map((item) => inline(item.label));
  if (missing.length === 0 && verify.length === 0) {
    const text = items.length === 1
      ? (scope === 'company' ? 'L’information de tes devis est renseignée.' : 'L’information contractuelle est renseignée.')
      : (scope === 'company' ? `Les ${items.length} informations de tes devis sont renseignées.` : `Les ${items.length} informations contractuelles sont renseignées.`);
    return { tone: 'ok', text };
  }
  const parts: string[] = [];
  if (missing.length) parts.push(`Il manque : ${missing.join(', ')}.`);
  if (verify.length) parts.push(`À vérifier : ${verify.join(', ')}.`);
  return { tone: 'todo', text: parts.join(' ') };
}
