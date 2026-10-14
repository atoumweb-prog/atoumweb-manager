import type { CatalogItemSummary } from '../../shared/commercial';
import { buildCatalogCategoryInventory } from './catalogCategoryInventory';

export function CatalogCategoryInventory({
  items, onFilter, onClose,
}: {
  items: readonly CatalogItemSummary[];
  onFilter: (category: string) => void;
  onClose: () => void;
}) {
  const report = buildCatalogCategoryInventory(items);
  const conflictCount = report.normalizedConflictGroups.length + report.displayAliasConflictGroups.length;
  return (
    <section className="panel catalog-category-inventory" aria-label="Inventaire des catégories du catalogue">
      <div className="catalog-category-inventory-header">
        <div>
          <h3>Catégories existantes</h3>
          <p className="muted">Inventaire de lecture seule. Aucun renommage, aucune réaffectation et aucune modification des versions.</p>
        </div>
        <button type="button" className="secondary-button" onClick={onClose}>Fermer les catégories</button>
      </div>
      <p className="catalog-category-inventory-summary" role="status">
        {report.rows.length} catégorie(s) distincte(s), {report.unassignedCount} prestation(s) sans catégorie,
        {' '}{conflictCount} groupe(s) à examiner.
      </p>
      {conflictCount > 0 && (
        <div className="catalog-category-inventory-warning" role="note">
          <strong>Réconciliation humaine nécessaire</strong>
          <p>Les variantes de noms ou les alias d’affichage similaires ne sont pas fusionnés automatiquement.</p>
          {report.normalizedConflictGroups.map((names, index) => (
            <p key={'normalized-' + index}>Doublon de nom : {names.join(' / ')}</p>
          ))}
          {report.displayAliasConflictGroups.map((names, index) => (
            <p key={'alias-' + index}>Alias partagé : {names.join(' / ')}</p>
          ))}
        </div>
      )}
      <div className="catalog-category-inventory-scroll">
        <table className="catalog-category-inventory-table">
          <thead>
            <tr>
              <th>Catégorie affichée</th><th>Valeur enregistrée</th><th>Total</th>
              <th>Actifs</th><th>Archivés</th><th>Contrôle</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {report.rows.map(row => (
              <tr key={row.rawValue}>
                <td>{row.label}</td>
                <td><code>{row.rawValue}</code></td>
                <td>{row.count}</td><td>{row.activeCount}</td><td>{row.archivedCount}</td>
                <td>{row.normalizedCollision || row.displayAliasCollision ? 'À réconcilier' : 'Distincte'}</td>
                <td>
                  <button className="secondary-button" type="button" onClick={() => onFilter(row.rawValue)}>
                    Voir les prestations
                  </button>
                </td>
              </tr>
            ))}
            {report.unassignedCount > 0 && (
              <tr>
                <td>Sans catégorie</td><td>—</td><td>{report.unassignedCount}</td><td>—</td><td>—</td>
                <td>À classer</td><td>Classement à définir</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {report.rows.length === 0 && report.unassignedCount === 0 &&
        <p className="muted">Aucune prestation n’est enregistrée dans ce catalogue.</p>}
    </section>
  );
}
