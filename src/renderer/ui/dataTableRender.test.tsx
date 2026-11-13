import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DataTable, type TableColumn } from './DataTable';

interface Row { id: string; name: string }
const columns: TableColumn<Row>[] = [{ id: 'name', label: 'Destinataire', sortValue: (row) => row.name, render: (row) => row.name }];
const base = { columns, selectedId: null, getId: (row: Row) => row.id, sort: null, onSort: () => undefined, caption: 'Devis' };

describe('DataTable : tableau vide', () => {
  it('sans filtre actif, n’affiche jamais le mot « filtre »', () => {
    const html = renderToStaticMarkup(<DataTable {...base} rows={[]} />);
    expect(html).toContain('Rien à afficher pour l’instant.');
    expect(html).not.toMatch(/filtre/i);
  });

  it('sans filtre actif, un texte propre à l’écran remplace le texte par défaut', () => {
    const html = renderToStaticMarkup(<DataTable {...base} rows={[]} emptyText="Aucun devis pour l’instant." />);
    expect(html).toContain('Aucun devis pour l’instant.');
    expect(html).not.toMatch(/filtre/i);
  });

  it('avec un filtre actif, le dit et propose d’effacer les filtres', () => {
    const html = renderToStaticMarkup(<DataTable {...base} rows={[]} filtersActive onClearFilters={() => undefined} emptyText="Aucun devis pour l’instant." />);
    expect(html).toContain('Aucun résultat pour ces filtres.');
    expect(html).toContain('Effacer les filtres');
    expect(html).not.toContain('Aucun devis pour l’instant.');
  });

  it('avec un filtre actif mais sans moyen de l’effacer, n’affiche pas de bouton', () => {
    const html = renderToStaticMarkup(<DataTable {...base} rows={[]} filtersActive />);
    expect(html).toContain('Aucun résultat pour ces filtres.');
    expect(html).not.toContain('Effacer les filtres');
  });

  it('n’affiche aucun message avec des lignes, en chargement ou indisponible', () => {
    expect(renderToStaticMarkup(<DataTable {...base} rows={[{ id: '1', name: 'Mairie' }]} />)).not.toContain('Rien à afficher');
    expect(renderToStaticMarkup(<DataTable {...base} rows={[]} loading />)).not.toContain('Rien à afficher');
    expect(renderToStaticMarkup(<DataTable {...base} rows={[]} unavailable />)).not.toContain('Rien à afficher');
  });
});
