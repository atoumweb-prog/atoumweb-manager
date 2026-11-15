import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { noticeText, noticeStaysOnPage } from './noticeLifetime';
import { tableErrorMessage } from './tableEmpty';

/** P6b (états rares) : gardes des corrections du relevé, par fonctions pures et lecture du source. */
const read = (relative: string) => readFileSync(resolve(__dirname, '..', relative), 'utf8');

describe('C1 : l’avis global n’affiche jamais le message technique d’Electron', () => {
  it('retire le préfixe « Error invoking remote method » et le « Error: » qui suit', () => {
    expect(noticeText("Error invoking remote method 'quotes:list': Error: Base indisponible")).toBe('Base indisponible');
    expect(noticeText('Error invoking remote method "crm:prospects:list": Error: Accès refusé.')).toBe('Accès refusé.');
  });

  it('laisse intacts les messages déjà rédigés pour l’utilisateur', () => {
    expect(noticeText('Sauvegarde créée : C:\\dossier\\copie.sqlite')).toBe('Sauvegarde créée : C:\\dossier\\copie.sqlite');
    expect(noticeText('Error: valeur')).toBe('valeur');
  });

  it('l’avis d’App.tsx passe par noticeText', () => {
    const app = read('App.tsx');
    expect(app).toContain('<span>{noticeText(message)}</span>');
    expect(app).not.toContain('<span>{message}</span>');
  });
});

describe('C2 et C3 : noms lisibles pour le lecteur d’écran', () => {
  it('la poignée de largeur annonce le libellé de la colonne, pas son identifiant interne', () => {
    const table = read('ui/DataTable.tsx');
    expect(table).toContain('aria-label={`Largeur de la colonne ${label}`}');
    expect(table).not.toContain('aria-label={`Largeur ${id}`}');
    expect(table).toMatch(/<ColumnSizer [^>]*label=\{column\.label\}/);
  });

  it('la recherche de Devis a un nom accessible', () => {
    expect(read('commercial/QuotesPage.tsx')).toMatch(/<input className="inline-search" aria-label="Rechercher un devis"/);
  });
});

/** Corps de la première règle dont le sélecteur est exactement `selector` (format `selecteur {` ou `selecteur{`). */
const ruleBody = (source: string, selector: string) => {
  for (const opener of [`${selector} {`, `${selector}{`]) {
    const start = source.indexOf(opener);
    if (start >= 0) return source.slice(start, source.indexOf('}', start));
  }
  return '';
};

describe('C5, C6, C8 : mises en page mesurées en P6b', () => {
  it('C5 : le libellé du chrono tient sur une ligne, l’heure passe dessous si la place manque', () => {
    const time = read('time.css');
    expect(ruleBody(time, '.timer-topline')).toMatch(/flex-wrap:\s*wrap/);
    expect(ruleBody(time, '.timer-label')).toMatch(/white-space:\s*nowrap/);
  });

  it('C6 : la décision d’un devis ne force plus 150 px dans une cellule plus étroite', () => {
    const body = ruleBody(read('commercial.css'), '.quote-decision-actions');
    expect(body).toMatch(/min-width:\s*0/);
    expect(body).not.toContain('min-width: 150px');
  });

  it('C7 : dans l’assistant, un texte d’exemple n’est pas en gras comme une valeur saisie', () => {
    expect(read('commercial.css')).toContain('.quote-step-content input::placeholder, .quote-step-content textarea::placeholder { font-weight: 400; }');
  });

  it('C8 : les en-têtes de tableau sont centrés verticalement, triables ou non', () => {
    // Dans la règle existante des en-têtes (tableLayoutCss.test.ts lit la première règle de ce sélecteur).
    expect(read('ui/table-layout.css')).toContain('.aw-data-table > thead > tr > th{vertical-align:middle;text-transform:none;');
  });
});

describe('D1 : une liste dont la source échoue ne se fait pas passer pour vide', () => {
  it('le message dit ce qui s’est passé, sans jargon, et quoi faire', () => {
    const text = tableErrorMessage("Error invoking remote method 'quotes:list': Error: Base verrouillée");
    expect(text).toBe('La liste n’a pas pu être chargée (Base verrouillée). Rien n’est affiché tant qu’elle n’est pas rechargée : réessaie, et si le problème continue, regarde Réglages, rubrique « Diagnostic du Manager ».');
    expect(text).not.toMatch(/Error|invoking/);
  });

  it('un seul bloc d’erreur commun : message rédigé et « Réessayer »', () => {
    const block = read('ui/ListLoadError.tsx');
    expect(block).toContain('<div className="aw-table-empty aw-table-error" role="alert"><p>{tableErrorMessage(error)}</p>{onRetry && <AppButton onAction={onRetry}>Réessayer</AppButton>}</div>');
  });

  it('DataTable montre ce bloc à la place du message de liste vide', () => {
    const table = read('ui/DataTable.tsx');
    expect(table).toContain('error?: string | null; onRetry?: () => void;');
    expect(table).toContain('<ListLoadError error={error} onRetry={onRetry}/>');
    expect(table).toContain('{!rows.length && !loading && !unavailable && !error && ');
  });

  it('ConfiguredDataTable relaie error et onRetry', () => {
    const configured = read('ui/ConfiguredDataTable.tsx');
    expect(configured).toMatch(/emptyFilteredText,error:loadError,onRetry\}/);
    expect(configured).toContain('<DataTable error={loadError} onRetry={onRetry}');
    // La barre « Colonnes et vues » ne dit pas « 0 résultats » quand la source a échoué.
    expect(configured).toContain("· {loadError ? '—' : rows.length} résultats");
  });
});

describe('D1 : les six listes relevées branchent l’état d’erreur', () => {
  const pages = ['commercial/QuotesPage.tsx', 'crm/ProspectsPageV2.tsx', 'projects/ProjectsPage.tsx', 'billing/BillingPage.tsx', 'backups/BusinessBackupsPage.tsx', 'directory/DirectoryPage.tsx'];
  for (const page of pages) {
    it(`${page} : erreur notée, effacée au succès, montrée par la table avec « Réessayer », compteur « — »`, () => {
      const source = read(page);
      expect(source, 'état').toMatch(/const \[listError, setListError\] = useState<string \| null>\(null\);/);
      expect(source, 'succès').toContain('setListError(null);');
      expect(source, 'échec').toMatch(/setListError\([^)]/);
      expect(source, 'table').toMatch(/error=\{listError\} onRetry=\{/);
      expect(source, 'compteur').toContain("listError ? '—' :");
    });
  }
});

describe('D2 : un avis reste sur la page où il a été posé', () => {
  it('règle pure : l’avis reste seulement sur sa page', () => {
    expect(noticeStaysOnPage('Statistiques', 'Statistiques')).toBe(true);
    expect(noticeStaysOnPage('Statistiques', 'Sauvegardes')).toBe(false);
  });

  it('App.tsx note la page de l’avis avant de réagir au changement de page, puis le ferme', () => {
    const app = read('App.tsx');
    const owner = app.indexOf('messagePageRef.current = activePage;');
    const watch = app.indexOf('if (!noticeStaysOnPage(messagePageRef.current, activePage)) closeMessage();');
    expect(owner).toBeGreaterThan(0);
    expect(watch).toBeGreaterThan(owner);
  });
});
