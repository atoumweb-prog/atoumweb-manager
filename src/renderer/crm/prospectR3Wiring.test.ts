import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * R3 : câblage de la fiche de travail du prospect, vérifié par lecture du source
 * (même méthode que `ui/tableFiltersWiring.test.ts`). Les règles pures sont testées dans `shared/prospectNextStep.test.ts`.
 */
const read = (name: string) => readFileSync(resolve(__dirname, name), 'utf8');

describe('R3 : un seul « Enregistrer » dans Besoins', () => {
  const needs = read('ProspectNeedsPanel.tsx');

  it('les trois anciens boutons d’enregistrement n’existent plus', () => {
    expect(needs).not.toContain('Enregistrer et continuer');
    expect(needs).not.toContain('Enregistrer le besoin');
    expect(needs).not.toContain('Enregistrer et faire le devis');
    expect(needs).not.toContain('crm-need-footer');
  });

  it('un seul bouton « Enregistrer » (le texte d’état « Enregistrement… » reste)', () => {
    const labels = needs.match(/'Enregistrer'/g) ?? [];
    expect(labels).toHaveLength(1);
    expect(needs).toContain('Enregistrement…');
  });

  it('le panneau n’accepte plus les raccourcis onContinue et onPrepareQuote', () => {
    expect(needs).not.toMatch(/onPrepareQuote|onContinue/);
  });

  it('le brouillon « Identification du besoin » sait s’enregistrer (fenêtre de sortie et saveThenRun)', () => {
    const guard = needs.match(/useUnsavedDraft\('Identification du besoin'[\s\S]*?\}\);\r?\n/);
    expect(guard).not.toBeNull();
    expect(guard![0]).toContain('save:()=>saveForGuard()');
    expect(needs).toMatch(/async function saveForGuard\(\)\{lastSaveSucceeded\.current=false;await saveIdentification\(\);return lastSaveSucceeded\.current;\}/);
  });

  it('« Enregistrer » est jaune seulement quand le formulaire est modifié', () => {
    expect(needs).toMatch(/infoGuard\.dirty\s*\?\s*'primary-button'\s*:\s*'secondary-button'/);
  });
});

describe('R3 : Besoins en sections repliables', () => {
  const needs = read('ProspectNeedsPanel.tsx');
  const page = read('ProspectsPageV2.tsx');

  it('la page n’a plus la rangée de sous-onglets « Informations du besoin »', () => {
    expect(page).not.toContain('aria-label="Informations du besoin"');
    expect(page).not.toContain('aria-label="Préparer l’échange"');
  });

  it('les quatre sections existent avec leur titre et un bouton repliable', () => {
    const titles = read('NeedsSectionHeader.tsx') + needs + page;
    for (const title of ['Qualification', 'Demande et besoin', 'Budget et délais', 'Prestations et points à confirmer']) expect(titles).toContain(title);
    expect(read('NeedsSectionHeader.tsx')).toContain('aria-expanded');
  });

  it('une section repliée reste montée (hidden) : un brouillon n’est jamais perdu en repliant', () => {
    expect(needs).toMatch(/hidden=\{!open\.brief\}/);
    expect(needs).toMatch(/hidden=\{!open\.commercial\}/);
    expect(needs).toMatch(/hidden=\{!open\.services\}/);
    expect(needs).not.toMatch(/section!==/);
  });

  it('« Compléter » ouvre la section ciblée avant de donner le focus', () => {
    const fn = page.match(/function completeMissing\([\s\S]*?\n/)![0];
    expect(fn).toContain('openNeedsSection');
  });
});

describe('R3 : le focus ne vise jamais une section repliée', () => {
  it('« Compléter » ignore les champs invalides situés dans une section masquée', () => {
    const fn = read('ProspectsPageV2.tsx').match(/function completeMissing\([\s\S]*?\n/)![0];
    expect(fn).toContain("closest('[hidden]')");
  });
});

describe('R3 : une seule façon de programmer une action', () => {
  const actions = read('ProspectActionsPanel.tsx');
  const page = read('ProspectsPageV2.tsx');

  it('« + Action » et « Planification ouverte » n’existent plus : un seul verbe, « Programmer une action »', () => {
    expect(actions).not.toContain('+ Action');
    expect(actions).not.toContain('Planification ouverte');
    expect(actions).toContain('Programmer une action');
  });

  it('la fenêtre « Planifier une action » n’est rendue qu’à un seul endroit', () => {
    const all = ['ProspectsPageV2.tsx', 'ProspectActionsPanel.tsx', 'ProspectQuotePanel.tsx', 'ProspectQuoteWorkspace.tsx'].map(read).join('\n');
    expect(all.match(/label="Planifier une action"/g)).toHaveLength(1);
  });

  it('le panneau ouvre la fenêtre sur demande, une seule fois, puis consomme la demande', () => {
    expect(actions).toMatch(/openCreateRequest\??:\s*boolean/);
    expect(actions).toMatch(/onCreateRequestConsumed\??:\s*\(\)\s*=>\s*void/);
    expect(actions).toMatch(/useEffect\(\(\)\s*=>\s*\{\s*if\s*\(openCreateRequest\)\s*\{\s*setCreateOpen\(true\);\s*onCreateRequestConsumed\?\.\(\);\s*\}\s*\},\s*\[openCreateRequest\]\)/);
  });

  it('la fiche donne une porte directe : elle ouvre l’onglet Actions puis la fenêtre, derrière la garde de sortie', () => {
    expect(page).toMatch(/function openActionDialog\(\)\{requestUnsavedExit\(\(\)=>\{[^}]*applyWorkspaceTab\('actions'\);setActionRequested\(true\);/);
    expect(page).toMatch(/<ProspectActionsPanel[^>]*openCreateRequest=\{actionRequested\}[^>]*onCreateRequestConsumed=\{\(\)=>setActionRequested\(false\)\}/);
  });

  it('« Prochaine action » n’est plus un bouton dans la fiche', () => {
    expect(page).not.toMatch(/<button[^>]*>[^<]*Prochaine action/);
    expect(actions).not.toMatch(/<button[^>]*>[^<]*Prochaine action/);
  });
});

describe('R3 : en-tête de la fiche de travail', () => {
  const page = read('ProspectsPageV2.tsx');

  it('le mode « desk » utilise RecordHeader, NextStepCard et MoreMenu (via RecordHeader)', () => {
    expect(page).toContain('<RecordHeader');
    expect(page).toContain('<NextStepCard');
    expect(page).toMatch(/moreItems=\{/);
  });

  it('l’ancien bloc d’en-tête et de synthèse n’existe plus', () => {
    for (const old of ['prospect-workspace-header', 'prospect-focus-summary', 'prospect-workspace-tools', 'crm-journey-actions']) expect(page).not.toContain(old);
  });

  it('les libellés d’action viennent des règles pures, écrits une seule fois', () => {
    expect(page).toContain("from '../../shared/prospectNextStep'");
    for (const label of ['Poursuivre le devis', 'Valider la qualification et passer à Besoins', 'Compléter la qualification avant l’étape Besoins']) expect(page).not.toContain(label);
  });

  it('l’onglet d’ouverture vient de prospectOpeningTab', () => {
    expect(page).toMatch(/useState(<string>)?\(prospectOpeningTab\(\{/);
  });

  it('le menu « Plus » range les cinq actions, Perdu et Archiver en danger', () => {
    for (const label of ['Identité et logo', 'Associations', 'Changer la situation', 'Classer comme perdu', 'Archiver']) expect(page).toMatch(new RegExp(`label:\\s*'${label}'`));
    expect(page).toMatch(/id:\s*'lost',\s*label:\s*'Classer comme perdu',\s*danger:\s*true/);
    expect(page).toMatch(/id:\s*'archive',\s*label:\s*'Archiver',\s*danger:\s*true/);
  });

  it('« Préparer / Poursuivre le devis » enregistre d’abord (saveThenRun), et la carte cède le jaune à un formulaire modifié', () => {
    expect(page).toContain('unsavedRegistry.saveThenRun(');
    expect(page).toMatch(/primaryDemoted=\{hasUnsaved\}/);
  });

  it('un dossier clos n’a ni action principale ni « Programmer une action »', () => {
    expect(page).toMatch(/kind==='closed'\?\[\]/);
  });
});

describe('R3 : liste Prospection et trois vues', () => {
  const page = read('ProspectsPageV2.tsx');
  const css = (name: string) => readFileSync(resolve(__dirname, name), 'utf8');

  it('l’en-tête de la page est le PageHeader commun, avec « + Prospect » à droite', () => {
    expect(page).toContain('<PageHeader');
    expect(page).not.toContain('prospection-pilot-heading');
    expect(page).toMatch(/<PageHeader\b[\s\S]*?title="Prospection"/);
  });

  it('la première vue s’appelle « Liste » : « Annuaire prospects » n’existe plus nulle part dans l’écran', () => {
    expect(page).toMatch(/<\/OperationIcon>|<OperationIcon name="contact"\/>Liste <span>/);
    expect(page).not.toContain('Annuaire prospects');
  });

  it('les filtres du parcours commercial sont des boutons à bascule neutres, jamais jaunes', () => {
    expect(page).not.toMatch(/pipelineFilter === '[a-z]+' \? 'primary-button'/);
    expect(page).toMatch(/aria-pressed=\{pipelineFilter === 'all'\}/);
    expect(page).toMatch(/aria-pressed=\{pipelineFilter === 'relaunch'\}/);
    expect(page).toMatch(/aria-pressed=\{pipelineFilter === 'overdue'\}/);
  });

  it('« Clients acquis » et « Retour au parcours commercial » sont des liens discrets', () => {
    expect(page).toMatch(/<AppButton variant="quiet"[^\n]*?Clients acquis/);
    expect(page).toMatch(/<AppButton variant="quiet"[^\n]*?>Retour au parcours commercial/);
  });

  it('les statuts de la liste et de l’historique utilisent StatusPill, plus les classes maison', () => {
    expect(page).toContain('<StatusPill tone={prospectStatusTone(directoryStatus(p).tone)}');
    expect(page).not.toContain('prospect-directory-status-');
    expect(page).toMatch(/<StatusPill tone=\{historyOutcomeTone\(historyOutcome\(item\)\.kind\)\}/);
  });

  it('les feuilles de style de Prospection ne masquent ni ne restylent plus l’en-tête de page', () => {
    for (const name of ['prospect-visual-pilot.css', 'prospection-directory-pilot.css']) {
      const source = css(name);
      expect(source).not.toMatch(/:has\(>?\.prospects-v2\)>\.page-heading/);
      expect(source).not.toContain('.prospection-pilot-heading');
    }
  });
});

describe('R3 : en-tête de Clients', () => {
  it('Clients passe par le PageHeader commun, sans en-tête générique caché derrière', () => {
    const clients = read('ClientsPage.tsx');
    const app = readFileSync(resolve(__dirname, '..', 'App.tsx'), 'utf8');
    const css = read('client-list-quick-v2.css');
    expect(clients).toMatch(/<PageHeader\b[\s\S]*?title="Clients"/);
    expect(clients).not.toContain('client-heading');
    expect(app).toMatch(/activePage !== 'Prospects' && activePage !== 'Clients' && <PageHeader/);
    expect(css).not.toMatch(/\.content-area>\.page-heading\{display:none\}/);
  });
});

describe('P3a : titres dits une fois (F1) et fiche en fenêtre basse (F46, M8)', () => {
  const page = read('ProspectsPageV2.tsx');
  const research = read('ProspectResearchPanel.tsx');
  const reference = read('ProspectReferenceWindow.tsx');
  const qualification = read('ProspectQualificationPanelV2.tsx');

  it('la section « Analyse de l’entreprise » ne répète pas son titre dans le panneau', () => {
    expect(page).toMatch(/<ProspectResearchPanel scope="research"[^>]*hideTitle/);
    expect(research).toMatch(/hideTitle\??:\s*boolean/);
    expect(research).toMatch(/!hideTitle&&<h3>/);
  });

  it('la fenêtre « Référence prospect » garde le titre du panneau', () => {
    expect(reference).not.toContain('hideTitle');
  });

  it('l’étiquette de la qualification dit l’origine et non « Qualification » une seconde fois', () => {
    expect(qualification).not.toContain('Qualification · ');
    expect(qualification).toContain('Origine · ');
  });

  it('F46 : en fenêtre basse, l’en-tête, la Prochaine étape et les étapes défilent avec le contenu, onglets visibles', () => {
    const css = read('prospect-workspace-pilot.css');
    const block = css.match(/@media \(max-height: 600px\) \{[\s\S]*?\r?\n\}/);
    expect(block, 'requête max-height: 600px').not.toBeNull();
    expect(block![0]).toMatch(/\.prospect-detail-desk>\.prospect-workspace\{[^}]*overflow-y:\s*auto/);
    expect(block![0]).toMatch(/\.prospect-workspace>\.prospect-desk-content\{[^}]*overflow:\s*visible/);
    expect(block![0]).toMatch(/\.prospect-workspace>\.prospect-desk-tabs\{[^}]*position:\s*sticky/);
    // Rien ne change hors fenêtre basse : ces déclarations n'existent nulle part ailleurs dans la feuille.
    const outside = css.replace(block![0], '');
    expect(outside).not.toMatch(/\.prospect-desk-tabs\{[^}]*position:\s*sticky/);
    expect(outside).not.toMatch(/\.prospect-detail-desk>\.prospect-workspace\{[^}]*overflow-y:\s*auto/);
    expect(block![0]).not.toContain('!important');
  });

  it('F46 : les libellés des onglets de la fiche ne se coupent plus au milieu d’un mot (la rangée défile)', () => {
    const css = read('prospect-workspace-pilot.css');
    const rule = css.match(/\.prospect-workspace>\.prospect-desk-tabs button\{[^}]*\}/);
    expect(rule, 'règle des boutons d’onglet').not.toBeNull();
    expect(rule![0]).toMatch(/flex:\s*0 0 auto/);
    expect(rule![0]).toMatch(/white-space:\s*nowrap/);
    expect(rule![0]).not.toContain('!important');
    // La rangée ne doit pas élargir le cadre de la fiche (mesuré : 924 px pour 853 px utiles sans cette règle).
    const row = css.match(/\.prospect-workspace>\.prospect-desk-tabs\{[^}]*contain:\s*inline-size[^}]*\}/);
    expect(row, 'rangée d’onglets sans contribution à la largeur de la fiche').not.toBeNull();
    expect(row![0]).not.toContain('!important');
  });

  it('F45 : la pastille de statut de la table de Prospection passe sur deux lignes au lieu de déborder', () => {
    const css = read('prospect-visual-pilot.css');
    const rule = css.match(/\.prospects-v2 \.aw-data-table td \.aw-status-pill\s*\{[^}]*\}/);
    expect(rule, 'règle de la pastille dans la table de Prospection').not.toBeNull();
    expect(rule![0]).toMatch(/max-width:\s*100%/);
    expect(rule![0]).toMatch(/white-space:\s*normal/);
    expect(rule![0]).not.toContain('!important');
  });

  it('M8 : les en-têtes de la table de Prospection suivent le style partagé de DataTable', () => {
    const pilot = read('prospect-visual-pilot.css');
    expect(pilot).not.toMatch(/\.aw-data-table th\s*\{\s*font-weight:\s*600/);
  });
});
