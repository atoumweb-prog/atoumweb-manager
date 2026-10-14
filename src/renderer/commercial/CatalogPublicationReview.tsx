import type { CatalogItemDetail, CatalogVersion, OfferComponent } from '../../shared/commercial';
import { compareCatalogVersions, reviewCatalogPrepublication } from '../../shared/catalogVersionReview';
import { compareCatalogSalesAdvice } from '../../shared/catalogAdviceComparison';

export function CatalogPublicationReview({
  item, draft, components, busy, onConfirm, onCancel,
}: {
  item: CatalogItemDetail;
  draft: CatalogVersion;
  components: readonly OfferComponent[] | null;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const prior = item.versions.find(v=>v.status==='published') ??
    item.versions.find(v=>v.status==='retired') ?? null;
  const differences = compareCatalogVersions(prior,draft);
  const adviceDifferences = compareCatalogSalesAdvice(prior,draft);
  const review = reviewCatalogPrepublication(item,draft,components);

  return <section className="catalog-detail-section catalog-prepublication-review"
    role="region" aria-label="Préparer la publication du Catalogue">
    <h3>Préparer la publication — v{draft.versionNumber}</h3>
    <p className="muted">Comparaison des données <strong>enregistrées</strong>, pas des modifications locales non sauvegardées. Cette action ne publie ni site WordPress ni Devis.</p>
    <details open>
      <summary>{prior ? `Différences avec v${prior.versionNumber} (${differences.length})` : `Première publication (${differences.length} champs renseignés)`}</summary>
      {differences.length === 0 ? <p>Aucun changement dans les champs commerciaux comparés.</p> :
        <table className="catalog-version-diff-table"><thead><tr><th>Champ</th><th>Version précédente</th><th>Brouillon</th></tr></thead>
          <tbody>{differences.map(row=><tr key={row.field}><th scope="row">{row.label}</th><td>{row.previous}</td><td>{row.proposed}</td></tr>)}</tbody>
        </table>}
      {adviceDifferences.length>0 && <section aria-label="Différences des aides à la vente">
        <h4>Aides commerciales versionnées — comparaison détaillée</h4>
        <table className="catalog-version-diff-table"><thead><tr><th>Champ d'aide</th><th>Version précédente</th><th>Brouillon</th></tr></thead>
          <tbody>{adviceDifferences.map(row=><tr key={row.field}><th scope="row">{row.label}</th><td>{row.previous}</td><td>{row.proposed}</td></tr>)}</tbody>
        </table>
        <p className="muted">Ces conseils restent internes et ne constituent ni un contrat ni une promesse automatiquement approuvée.</p>
      </section>}
      <p className="muted">Les associations CGV, composants et blueprints doivent être vérifiés dans leurs panneaux dédiés : ce comparateur ne les certifie pas.</p>
    </details>
    <div className="catalog-prepublication-checks">
      <h4>Contrôles avant publication</h4>
      {review.blocking.length>0 && <div role="alert"><strong>Blocage technique</strong>
        <ul>{review.blocking.map((warning,index)=><li key={index}>{warning}</li>)}</ul>
      </div>}
      {review.warnings.length>0 && <div><strong>Points à vérifier manuellement</strong>
        <ul>{review.warnings.map((warning,index)=><li key={index}>{warning}</li>)}</ul>
      </div>}
      <p className="muted">Un contrôle technique réussi ne signifie pas « contrat conforme ». Les anciennes versions et les Devis historiques ne sont pas modifiés par la publication.</p>
    </div>
    <div className="inline-editor-actions">
      <button type="button" className="secondary-button" disabled={busy} onClick={onCancel}>Annuler</button>
      <button type="button" className="primary-button" disabled={busy||review.blocking.length>0}
        onClick={onConfirm}>{busy?'Publication…':'Confirmer la publication de ce brouillon'}</button>
    </div>
  </section>;
}
