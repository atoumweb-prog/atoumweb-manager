import { AppButton } from './AppButton';
import { tableErrorMessage } from './tableEmpty';

/**
 * P6b (D1) : bloc commun d'une liste dont la source a échoué. Utilisé par `DataTable` et par les listes
 * qui ne passent pas par elle (Sauvegardes, Annuaire). Rien n'est rendu sans erreur.
 */
export function ListLoadError({ error, onRetry }: { error?: string | null; onRetry?: () => void }) {
  if (!error) return null;
  return <div className="aw-table-empty aw-table-error" role="alert"><p>{tableErrorMessage(error)}</p>{onRetry && <AppButton onAction={onRetry}>Réessayer</AppButton>}</div>;
}
