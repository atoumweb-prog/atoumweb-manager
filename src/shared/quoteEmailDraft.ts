import type { QuoteDetail } from './commercial';

/**
 * Lot 4 — brouillon d'e-mail d'envoi du devis.
 * Le Manager n'envoie rien : il ouvre un brouillon dans la messagerie de l'utilisateur, qui joint
 * lui-même le PDF et clique sur Envoyer. Un lien « mailto » ne peut pas porter de pièce jointe.
 */
export interface QuoteEmailDraft { to: string | null; subject: string; body: string; mailto: string; }

const EMAIL = /^[^\s@<>,;:"']+@[^\s@<>,;:"']+\.[^\s@<>,;:"']+$/;

export function quoteEmailDraft(quote: Pick<QuoteDetail, 'number' | 'subject' | 'validUntil' | 'recipient'>): QuoteEmailDraft {
  const candidate = (quote.recipient?.contactEmail || quote.recipient?.email || '').trim();
  const to = EMAIL.test(candidate) ? candidate : null;
  const validUntil = quote.validUntil && Number.isFinite(Date.parse(quote.validUntil)) ? new Date(quote.validUntil).toLocaleDateString('fr-FR') : null;
  const subject = `Devis ${quote.number} — ${quote.subject}`;
  const body = [
    'Bonjour,',
    `Veuillez trouver ci-joint le devis ${quote.number} « ${quote.subject} », accompagné de nos conditions générales de vente.`,
    validUntil ? `Ce devis est valable jusqu’au ${validUntil}.` : '',
    'Je reste à votre disposition pour toute question.',
    'Cordialement,',
  ].filter(Boolean).join('\n\n');
  return { to, subject, body, mailto: `mailto:${to ? encodeURIComponent(to) : ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` };
}
