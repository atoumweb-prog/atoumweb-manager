/** Prix de l'offre de départ, identique pour l'aperçu et la création. */
export function quoteWizardPriceCents(value: string, catalogCents: number | null | undefined): number | null {
  const cleaned = value.trim().replace(',', '.');
  if (!cleaned) return catalogCents ?? null;
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0 || !Number.isSafeInteger(Math.round(parsed * 100))) {
    throw new Error('Montant invalide.');
  }
  return Math.round(parsed * 100);
}
