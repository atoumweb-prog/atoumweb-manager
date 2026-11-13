import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PageHeader } from './PageHeader';

const count = (html: string, pattern: RegExp) => (html.match(pattern) ?? []).length;

describe('PageHeader : en-tête de page unique', () => {
  it('rend un seul h1 avec l’icône et le titre, et garde la classe page-heading lue par les scripts de recette', () => {
    const html = renderToStaticMarkup(<PageHeader icon={<svg data-icon="x" />} title="Devis" />);
    expect(count(html, /<h1[ >]/g)).toBe(1);
    expect(html).toMatch(/class="page-heading aw-page-header"/);
    expect(html).toMatch(/<h1[^>]*><svg data-icon="x"\/?>(<\/svg>)?Devis<\/h1>/);
  });

  it('ne rend l’aide, le compteur et les actions que s’ils sont fournis', () => {
    const bare = renderToStaticMarkup(<PageHeader icon={null} title="Devis" />);
    expect(bare).not.toContain('aw-page-header-meta');
    expect(bare).not.toContain('aw-page-header-actions');
    expect(bare).not.toContain('aria-expanded');
    const full = renderToStaticMarkup(<PageHeader icon={null} title="Devis" help="Création guidée" meta={<span>3 devis</span>} actions={<button type="button">+ Nouveau devis</button>} />);
    expect(full).toContain('aw-page-header-meta');
    expect(full).toContain('3 devis');
    expect(full).toContain('aw-page-header-actions');
    expect(full).toContain('+ Nouveau devis');
    expect(full).toContain('Création guidée');
  });

  it('n’affiche aucun terme technique de base de données', () => {
    const html = renderToStaticMarkup(<PageHeader icon={null} title="Devis" help="Création guidée" />);
    expect(html).not.toMatch(/SQLite|migration/i);
  });
});

describe('App : en-tête générique', () => {
  const app = readFileSync(resolve(__dirname, '..', 'App.tsx'), 'utf8');

  it('n’affiche plus la puce de migrations dans l’en-tête de page (le détail reste dans Réglages)', () => {
    expect(app).not.toContain('database-chip');
    expect(app).not.toMatch(/SQLite · \{bootstrap/);
    expect(app).toContain('Migrations appliquées au démarrage');
  });

  it('rend l’en-tête générique par PageHeader', () => {
    expect(app).toContain('<PageHeader');
    expect(app).not.toContain('<div className="page-heading">');
  });
});
