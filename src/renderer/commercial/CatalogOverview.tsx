import type { CatalogItemSummary } from '../../shared/commercial';
import { buildCataloguePresentation } from './catalogSections';

interface Props {
  items: readonly CatalogItemSummary[];
  formatPrice: (item: CatalogItemSummary) => string;
  onOpen: (id: string) => void;
}

const STATUS_LABELS: Record<CatalogItemSummary['status'], string> = {
  active: 'Actif',
  inactive: 'Inactif',
  archived: 'Archivé',
};

function CatalogueCard({
  item,
  formatPrice,
  onOpen,
}: {
  item: CatalogItemSummary;
  formatPrice: Props['formatPrice'];
  onOpen: Props['onOpen'];
}) {
  const version = item.currentVersion;
  const versionState = version
    ? `v${version.versionNumber} · ${version.status === 'published' ? 'Publiée' : version.status === 'draft' ? 'Brouillon' : 'Retirée'}`
    : 'Sans version';

  return (
    <button
      className="catalog-overview-card"
      data-catalog-item-id={item.id}
      type="button"
      onClick={() => onOpen(item.id)}
      aria-label={`Ouvrir ${item.name}`}
    >
      <span className="catalog-overview-card-title">{item.name}</span>
      <span className="catalog-overview-card-price">{formatPrice(item)}</span>
      <span className="catalog-overview-card-meta">
        <span className={`catalog-status catalog-${item.status}`}>{STATUS_LABELS[item.status]}</span>
        <span>{versionState}</span>
      </span>
      {item.canonicalCode && <small className="catalog-canonical-code">{item.canonicalCode}</small>}
    </button>
  );
}

/**
 * Purely administrative presentation: no catalogue mutations and no replacement for the
 * complete table, version editor, unsaved-draft guard or quote add-line operation.
 */
export function CatalogOverview({ items, formatPrice, onOpen }: Props) {
  const { featured, otherOffers, serviceCategories } = buildCataloguePresentation(items);

  if (items.length === 0) {
    return <div className="empty-table">Aucune offre ou service pour ces filtres.</div>;
  }

  return (
    <div className="catalog-overview" aria-label="Offres et services organisés">
      {featured.length > 0 && (
        <section className="catalog-overview-section" aria-labelledby="catalog-main-offers">
          <div className="catalog-overview-section-header">
            <h3 id="catalog-main-offers">Offres principales</h3>
            <span>{featured.reduce((total, group) => total + group.items.length, 0)} prestation(s)</span>
          </div>
          <div className="catalog-overview-featured-grid">
            {featured.map((group) => (
              <div className="catalog-overview-featured-group" key={group.id}>
                <h4>{group.title}</h4>
                <div className="catalog-overview-card-list">
                  {group.items.map((item) => (
                    <CatalogueCard key={item.id} item={item} formatPrice={formatPrice} onOpen={onOpen} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {otherOffers.length > 0 && (
        <section className="catalog-overview-section" aria-labelledby="catalog-other-offers">
          <div className="catalog-overview-section-header">
            <h3 id="catalog-other-offers">Autres offres</h3>
            <span>{otherOffers.length} prestation(s)</span>
          </div>
          <div className="catalog-overview-cards">
            {otherOffers.map((item) => (
              <CatalogueCard key={item.id} item={item} formatPrice={formatPrice} onOpen={onOpen} />
            ))}
          </div>
        </section>
      )}

      {serviceCategories.length > 0 && (
        <section className="catalog-overview-section" aria-labelledby="catalog-additional-services">
          <div className="catalog-overview-section-header">
            <h3 id="catalog-additional-services">Services complémentaires</h3>
            <span>Catégories A–Z</span>
          </div>
          {serviceCategories.map((category) => (
            <div className="catalog-overview-category" key={category.id}>
              <h4>{category.title} <span>({category.items.length})</span></h4>
              <div className="catalog-overview-cards">
                {category.items.map((item) => (
                  <CatalogueCard key={item.id} item={item} formatPrice={formatPrice} onOpen={onOpen} />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
