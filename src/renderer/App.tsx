import { useEffect, useState } from 'react';
import type { BootstrapState, ThemeName } from '../shared/contracts';

const NAV_ITEMS = [
  'Accueil',
  'Prospects',
  'Clients',
  'Offres & Tarifs',
  'Devis',
  'Projets',
  'Interventions & Maintenance',
  'Gestion des temps',
  'Facturation',
  'Dépenses',
  'Documents & Contrats',
  'Bibliothèque AtoumWeb',
  'Sauvegardes',
  'Annuaire',
  'Statistiques',
  'Réglages',
] as const;

type PageName = (typeof NAV_ITEMS)[number];

const PAGE_HINTS: Record<PageName, string> = {
  Accueil: 'Vue synthétique des actions, alertes et indicateurs AtoumWeb.',
  Prospects: 'Pipeline commercial et prochaines actions.',
  Clients: 'Base clients, contacts, projets et historique.',
  'Offres & Tarifs': 'Catalogue, services, offres et versions tarifaires.',
  Devis: 'Création guidée et suivi des devis.',
  Projets: 'Lots, modules, tâches, ressources et avancement.',
  'Interventions & Maintenance': 'Demandes, interventions, maintenance et packs d’heures.',
  'Gestion des temps': 'Analyse du temps réel par client, projet et activité.',
  Facturation: 'Éléments à facturer et suivi des factures Abby.',
  Dépenses: 'Abonnements, dépenses et échéances AtoumWeb.',
  'Documents & Contrats': 'Modèles, contrats, avenants, rapports et PDF.',
  'Bibliothèque AtoumWeb': 'Composants et références techniques réutilisables.',
  Sauvegardes: 'Traçabilité des sauvegardes serveur, locales et externes.',
  Annuaire: 'Fournisseurs, partenaires et contacts professionnels.',
  Statistiques: 'Commercial, temps, rentabilité, clients et prestations.',
  Réglages: 'Identité, apparence, stockage, modèles et préférences.',
};

const THEMES: Array<{ id: ThemeName; label: string; description: string }> = [
  { id: 'atoumweb', label: 'AtoumWeb', description: 'Marine, clair et accent or — thème par défaut.' },
  { id: 'noir', label: 'Noir', description: 'Interface sombre et neutre.' },
  { id: 'blanc', label: 'Blanc', description: 'Interface claire et minimaliste.' },
];

function applyTheme(theme: ThemeName): void {
  document.documentElement.dataset.theme = theme;
}

function App() {
  const [bootstrap, setBootstrap] = useState<BootstrapState | null>(null);
  const [activePage, setActivePage] = useState<PageName>('Accueil');
  const [theme, setTheme] = useState<ThemeName>('atoumweb');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  useEffect(() => {
    window.atoumweb.app.getBootstrap()
      .then((state) => {
        setBootstrap(state);
        setTheme(state.theme);
        applyTheme(state.theme);
      })
      .catch((error: unknown) => {
        setLoadingError(error instanceof Error ? error.message : 'Erreur de démarrage inconnue.');
      });
  }, []);

  async function updateTheme(nextTheme: ThemeName): Promise<void> {
    const savedTheme = await window.atoumweb.settings.setTheme(nextTheme);
    setTheme(savedTheme);
    applyTheme(savedTheme);
    setMessage(`Thème « ${THEMES.find((item) => item.id === savedTheme)?.label ?? savedTheme} » appliqué.`);
  }

  async function chooseWorkspace(): Promise<void> {
    const result = await window.atoumweb.workspace.choose();
    if (result.cancelled) return;

    setMessage(
      result.restartRequired
        ? `Nouveau dossier enregistré : ${result.workspacePath}. Redémarre l’application pour l’utiliser. Les données de l’ancien workspace ne sont pas déplacées automatiquement.`
        : 'Le dossier de travail sélectionné est déjà actif.',
    );
  }

  async function createManualBackup(): Promise<void> {
    const result = await window.atoumweb.backups.createManual();
    setMessage(`Sauvegarde créée : ${result.path}`);
  }

  async function restoreBackup(): Promise<void> {
    const result = await window.atoumweb.backups.restore();
    if (result.cancelled) return;

    setMessage(
      result.restartScheduled
        ? 'Restauration programmée. L’application va redémarrer.'
        : 'Restauration programmée. En mode développement, ferme AtoumWeb Manager puis relance « npm start » pour appliquer la restauration.',
    );
  }

  function submitFoundationSearch(): void {
    if (!searchTerm.trim()) return;
    setMessage(`Recherche « ${searchTerm.trim()} » : le champ global est prêt, le moteur multi-modules sera raccordé avec le socle CRM.`);
  }

  if (loadingError) {
    return (
      <div className="fatal-screen">
        <div className="fatal-card">
          <span className="eyebrow">AtoumWeb Manager</span>
          <h1>Le démarrage a échoué</h1>
          <p>{loadingError}</p>
        </div>
      </div>
    );
  }

  if (!bootstrap) {
    return (
      <div className="splash-screen">
        <div className="brand-mark">AW</div>
        <strong>AtoumWeb Manager</strong>
        <span>Initialisation du workspace et de la base locale…</span>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">AW</div>
          <div>
            <strong>AtoumWeb</strong>
            <span>Manager</span>
          </div>
        </div>

        <nav className="navigation" aria-label="Navigation principale">
          {NAV_ITEMS.map((item) => (
            <button
              key={item}
              className={`nav-item ${activePage === item ? 'active' : ''}`}
              onClick={() => setActivePage(item)}
              type="button"
            >
              <span className="nav-dot" />
              <span>{item}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span>V{bootstrap.appVersion}</span>
          <span className="status-pill">Local</span>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="global-search">
            <span aria-hidden="true">⌕</span>
            <input
              aria-label="Recherche globale"
              onChange={(event) => setSearchTerm(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') submitFoundationSearch();
              }}
              placeholder="Rechercher dans AtoumWeb Manager…"
              value={searchTerm}
            />
          </div>

          <div className="timer-widget" title="Le timer global sera raccordé aux tâches et interventions.">
            <div>
              <span className="timer-label">Timer</span>
              <strong>00:00:00</strong>
            </div>
            <span className="timer-context">Aucune activité</span>
            <button type="button" disabled>▶</button>
          </div>
        </header>

        <section className="content-area">
          <div className="page-heading">
            <div>
              <span className="eyebrow">AtoumWeb Manager</span>
              <h1>{activePage}</h1>
              <p>{PAGE_HINTS[activePage]}</p>
            </div>
            <div className="database-chip">
              <span className="health-dot" />
              SQLite · {bootstrap.database.migrationCount} migration
            </div>
          </div>

          {message && (
            <div className="notice" role="status">
              <span>{message}</span>
              <button type="button" onClick={() => setMessage(null)}>×</button>
            </div>
          )}

          {activePage === 'Accueil' && <Dashboard bootstrap={bootstrap} />}
          {activePage === 'Réglages' && (
            <SettingsPage
              bootstrap={bootstrap}
              theme={theme}
              onThemeChange={updateTheme}
              onChooseWorkspace={chooseWorkspace}
              onCreateBackup={createManualBackup}
              onRestoreBackup={restoreBackup}
            />
          )}
          {activePage !== 'Accueil' && activePage !== 'Réglages' && (
            <ModulePlaceholder page={activePage} />
          )}
        </section>
      </main>
    </div>
  );
}

function Dashboard({ bootstrap }: { bootstrap: BootstrapState }) {
  return (
    <>
      <div className="kpi-grid">
        <KpiCard label="Prospects actifs" value="0" detail="Aucune donnée pour l’instant" />
        <KpiCard label="Projets en cours" value="0" detail="Socle technique en construction" />
        <KpiCard label="CA encaissé ce mois" value="0 €" detail="Suivi Abby à venir" />
        <KpiCard label="Temps travaillé ce mois" value="0 h" detail="Timer prêt à être raccordé" />
      </div>

      <div className="dashboard-grid">
        <article className="panel panel-large">
          <div className="panel-title">
            <div>
              <span className="eyebrow">Fondation</span>
              <h2>Socle V1 actif</h2>
            </div>
            <span className="success-badge">Prêt</span>
          </div>
          <div className="foundation-list">
            <FoundationRow label="Workspace local" value={bootstrap.workspacePath} />
            <FoundationRow label="Base SQLite" value={bootstrap.databasePath} />
            <FoundationRow label="Sécurité Electron" value="Preload isolé · Node désactivé dans l’interface" />
            <FoundationRow label="Sauvegarde" value="Quotidienne + manuelle + restauration sécurisée" />
          </div>
        </article>

        <article className="panel">
          <span className="eyebrow">Aujourd’hui</span>
          <h2>Rien à traiter</h2>
          <p className="muted">Les prospects, tâches, maintenances et échéances apparaîtront ici.</p>
        </article>

        <article className="panel">
          <span className="eyebrow">Prochaine étape</span>
          <h2>Socle CRM</h2>
          <p className="muted">Premières entités : contacts, prospects et clients, puis recherche globale réelle.</p>
        </article>
      </div>
    </>
  );
}

function SettingsPage({
  bootstrap,
  theme,
  onThemeChange,
  onChooseWorkspace,
  onCreateBackup,
  onRestoreBackup,
}: {
  bootstrap: BootstrapState;
  theme: ThemeName;
  onThemeChange: (theme: ThemeName) => Promise<void>;
  onChooseWorkspace: () => Promise<void>;
  onCreateBackup: () => Promise<void>;
  onRestoreBackup: () => Promise<void>;
}) {
  return (
    <div className="settings-grid">
      <article className="panel panel-large">
        <div className="panel-title">
          <div>
            <span className="eyebrow">Apparence</span>
            <h2>Thème de l’interface</h2>
          </div>
          {theme !== 'atoumweb' && (
            <button className="secondary-button" type="button" onClick={() => void onThemeChange('atoumweb')}>
              Rétablir le thème par défaut
            </button>
          )}
        </div>
        <div className="theme-grid">
          {THEMES.map((item) => (
            <button
              className={`theme-card ${theme === item.id ? 'selected' : ''}`}
              key={item.id}
              onClick={() => void onThemeChange(item.id)}
              type="button"
            >
              <span className={`theme-preview preview-${item.id}`}>
                <i />
                <b />
              </span>
              <strong>{item.label}</strong>
              <span>{item.description}</span>
            </button>
          ))}
        </div>
      </article>

      <article className="panel">
        <span className="eyebrow">Stockage</span>
        <h2>Workspace local</h2>
        <p className="path-value">{bootstrap.workspacePath}</p>
        <button className="primary-button" type="button" onClick={() => void onChooseWorkspace()}>
          Choisir un autre dossier
        </button>
      </article>

      <article className="panel">
        <span className="eyebrow">Sécurité</span>
        <h2>Sauvegarde de la base</h2>
        <p className="muted">Une sauvegarde automatique est créée chaque jour. Une copie de sécurité est aussi créée avant toute restauration.</p>
        <div className="button-row">
          <button className="secondary-button" type="button" onClick={() => void onCreateBackup()}>
            Sauvegarder maintenant
          </button>
          <button className="secondary-button" type="button" onClick={() => void onRestoreBackup()}>
            Restaurer une sauvegarde
          </button>
        </div>
      </article>
    </div>
  );
}

function ModulePlaceholder({ page }: { page: PageName }) {
  return (
    <article className="panel empty-module">
      <span className="module-number">V1</span>
      <h2>{page}</h2>
      <p>{PAGE_HINTS[page]}</p>
      <span className="status-pill">Conception validée · Développement à venir</span>
    </article>
  );
}

function KpiCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="kpi-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function FoundationRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="foundation-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default App;
