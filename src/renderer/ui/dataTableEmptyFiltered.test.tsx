import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DataTable, type TableColumn } from './DataTable';

interface Row { id: string; name: string }
const columns: TableColumn<Row>[] = [{ id: 'name', label: 'Session', sortValue: (row) => row.name, render: (row) => row.name }];
const base = { columns, selectedId: null, getId: (row: Row) => row.id, sort: null, onSort: () => undefined, caption: 'Temps' };

describe('R7 : DataTable dit le contexte même quand des filtres sont actifs', () => {
  it('avec un filtre actif et un texte propre, c’est ce texte qui s’affiche, avec « Effacer les filtres »', () => {
    const html = renderToStaticMarkup(<DataTable {...base} rows={[]} filtersActive onClearFilters={() => undefined} emptyText="Aucune session aujourd’hui." emptyFilteredText="Aucune session pour ces filtres aujourd’hui." />);
    expect(html).toContain('Aucune session pour ces filtres aujourd’hui.');
    expect(html).not.toContain('Aucune session aujourd’hui.');
    expect(html).not.toContain('Aucun résultat pour ces filtres.');
    expect(html).toContain('Effacer les filtres');
  });

  it('avec un filtre actif sans texte propre, le message standard reste', () => {
    const html = renderToStaticMarkup(<DataTable {...base} rows={[]} filtersActive onClearFilters={() => undefined} emptyText="Aucune session aujourd’hui." />);
    expect(html).toContain('Aucun résultat pour ces filtres.');
  });

  it('sans filtre actif, le texte filtré n’apparaît jamais', () => {
    const html = renderToStaticMarkup(<DataTable {...base} rows={[]} emptyText="Aucune session aujourd’hui." emptyFilteredText="Aucune session pour ces filtres aujourd’hui." />);
    expect(html).toContain('Aucune session aujourd’hui.');
    expect(html).not.toContain('pour ces filtres');
  });

  it('ConfiguredDataTable transmet la prop au tableau', () => {
    const source = readFileSync(resolve(__dirname, 'ConfiguredDataTable.tsx'), 'utf8');
    expect(source).toContain('emptyFilteredText={emptyFilteredText}');
    expect(source).toContain('emptyFilteredText?:string');
  });
});
