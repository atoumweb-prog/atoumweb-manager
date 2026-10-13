import type { QuoteDetail } from './commercial';
import type { ProjectSummary } from './projects';

/**
 * 03B.4 — le Projet est préparé depuis un Devis réel, jamais depuis le
 * simple stade du Prospect. Le service conserve les contrôles métier.
 */
export function canAccessQuoteProject(quote: Pick<QuoteDetail, 'status' | 'lines'>): boolean {
  return quote.lines.length > 0
    && (quote.status === 'draft' || quote.status === 'sent'
      || quote.status === 'viewed' || quote.status === 'accepted');
}

/**
 * Le lien quote.projectId est historique : une nouvelle révision peut avoir
 * un ID distinct tout en gardant le Projet provisoire du dossier commercial.
 * On vérifie donc l'ID du devis courant dans le dossier, sans inférer le lien
 * à partir du seul Prospect ou Client.
 */
export async function findCurrentQuoteProject(
  quote: Pick<QuoteDetail, 'id' | 'projectId' | 'prospectId' | 'clientAccountId'>,
  projects: readonly ProjectSummary[],
  currentQuoteIdForProject: (projectId: string) => Promise<string | null>,
): Promise<ProjectSummary | null> {
  const direct = projects.find((project) => project.id === quote.projectId || project.sourceQuoteId === quote.id);
  if (direct) return direct;

  const candidateProjects = projects.filter((project) => project.commercialDossierId &&
    ((quote.prospectId && project.prospectId === quote.prospectId)
      || (quote.clientAccountId && project.clientAccountId === quote.clientAccountId)));
  for (const candidate of candidateProjects) {
    if (await currentQuoteIdForProject(candidate.id) === quote.id) return candidate;
  }
  return null;
}
