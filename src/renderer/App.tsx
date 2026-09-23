import { DemoPanel } from './workflow/DemoPanel';
import { useEffect, useState } from 'react';
import type { BootstrapState, DisplayDensity, ThemeName } from '../shared/contracts';
import type { SearchResult } from '../shared/crm';
import { BusinessBackupsPage } from './backups/BusinessBackupsPage';
import { BillingPage } from './billing/BillingPage';
import { ExpensesPage } from './expenses/ExpensesPage';
import { DocumentsPage } from './documents/DocumentsPage';
import { CatalogPage } from './commercial/CatalogPage';
import { QuotesPage } from './commercial/QuotesPage';
import { ClientsPage } from './crm/ClientsPage';
import { GlobalSearch } from './crm/GlobalSearch';
import { HomeDashboard } from './home/HomeDashboard';
import { ProspectsPage } from './crm/ProspectsPage';
import { ProspectReferenceWindow } from './crm/ProspectReferenceWindow';
import { OperationsPage, type OperationsSearchTarget } from './operations/OperationsPage';
import { ProjectsPage } from './projects/ProjectsPage';
import { AtoumWebLibraryPage } from './referentials/AtoumWebLibraryPage';
import { GlobalTimer } from './time/GlobalTimer';
import { TimePage } from './time/TimePage';

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
  Prospects: 'Annuaire, démarchage, qualification, devis et suivi des opportunités.',
  Clients: 'Base clients, contacts, projets et historique.',
  'Offres & Tarifs': 'Catalogue, services, offres et versions tarifaires.',
  Devis: 'Création guidée et suivi des devis.',
  Projets: 'Lots, modules, tâches, ressources et avancement.',
  'Interventions & Maintenance': 'Demandes, interventions, maintenance et packs d’heures.',
  'Gestion des temps': 'Analyse du temps réel par client, projet et activité.',
  Facturation: 'Éléments à facturer et archivage des PDF de factures Abby.',
  Dépenses: 'Frais AtoumWeb, dépenses clients/projets, abonnements et justificatifs.',
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

const DENSITIES: Array<{ id: DisplayDensity; label: string; description: string }> = [
  { id: 'compact', label: 'Compact', description: 'Plus d’informations visibles avec des espacements resserrés.' },
  { id: 'comfort', label: 'Confort', description: 'Réglage par défaut, équilibré pour le travail quotidien.' },
  { id: 'comfort_plus', label: 'Confort +', description: 'Texte et zones cliquables plus grands pour une lecture facilitée.' },
];

function applyTheme(theme: ThemeName): void {
  document.documentElement.dataset.theme = theme;
}

function applyDensity(density: DisplayDensity): void {
  document.documentElement.dataset.density = density;
}

function App() {
  const prospectReferenceId = new URLSearchParams(window.location.search).get('prospectReference');
  const [bootstrap, setBootstrap] = useState<BootstrapState | null>(null);
  const [activePage, setActivePage] = useState<PageName>('Accueil');
  const [theme, setTheme] = useState<ThemeName>('atoumweb');
  const [displayDensity, setDisplayDensity] = useState<DisplayDensity>('comfort');
  const [showHoverHelp, setShowHoverHelp] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [crmTarget,setCrmTarget] = useState<string|null>(null);
  const [prospectViewTarget, setProspectViewTarget] = useState<'directory' | 'pipeline' | 'history'>('directory');
  const [quoteTarget,setQuoteTarget] = useState<string|null>(null);
  const [documentTarget, setDocumentTarget] = useState<string | null>(null);
  useEffect(()=>{const open=(event:Event)=>openSearchResult((event as CustomEvent<SearchResult>).detail);window.addEventListener('atoumweb:navigate',open);return()=>window.removeEventListener('atoumweb:navigate',open);},[]);
  useEffect(() => { const open = (event: Event) => setActivePage((event as CustomEvent<PageName>).detail); window.addEventListener('atoumweb:open-page', open); return () => window.removeEventListener('atoumweb:open-page', open); }, []);
  useEffect(() => {
    const open = (event: Event) => {
      const view = (event as CustomEvent<'directory' | 'pipeline' | 'history'>).detail;
      setProspectViewTarget(view);
      setCrmTarget(null);
      setActivePage('Prospects');
    };
    window.addEventListener('atoumweb:open-prospects-view', open);
    return () => window.removeEventListener('atoumweb:open-prospects-view', open);
  }, []);
  useEffect(() => {
    const openConclusion = (event: Event) => {
      const interventionId = (event as CustomEvent<{ interventionId?: string }>).detail?.interventionId;
      if (!interventionId) return;
      setOperationsSearchTarget({ entityType: 'intervention', entityId: interventionId, focus: 'conclusion' });
      setActivePage('Interventions & Maintenance');
    };
    window.addEventListener('atoumweb:open-intervention-conclusion', openConclusion);
    return () => window.removeEventListener('atoumweb:open-intervention-conclusion', openConclusion);
  }, []);
  useEffect(() => {
    const collapse = (event: Event) => setSidebarCollapsed(Boolean((event as CustomEvent<boolean>).detail));
    window.addEventListener('atoumweb:sidebar-collapse', collapse);
    return () => window.removeEventListener('atoumweb:sidebar-collapse', collapse);
  }, []);
  const [projectSearchTarget, setProjectSearchTarget] = useState<string | null>(null);
  const [operationsSearchTarget, setOperationsSearchTarget] = useState<OperationsSearchTarget | null>(null);
  const [librarySearchTarget, setLibrarySearchTarget] = useState<string | null>(null);
  const [backupSearchTarget, setBackupSearchTarget] = useState<string | null>(null);

  useEffect(() => {
    window.atoumweb.app.getBootstrap()
      .then((state) => {
        setBootstrap(state);
        setTheme(state.theme);
        setDisplayDensity(state.displayDensity);
        setShowHoverHelp(state.showHoverHelp);
        applyTheme(state.theme);
        applyDensity(state.displayDensity);
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

  async function updateDisplayDensity(nextDensity: DisplayDensity): Promise<void> {
    const savedDensity = await window.atoumweb.settings.setDisplayDensity(nextDensity);
    setDisplayDensity(savedDensity);
    applyDensity(savedDensity);
    setMessage(`Affichage « ${DENSITIES.find((item) => item.id === savedDensity)?.label ?? savedDensity} » appliqué.`);
  }

  async function updateShowHoverHelp(enabled: boolean): Promise<void> {
    const saved = await window.atoumweb.settings.setShowHoverHelp(enabled);
    setShowHoverHelp(saved);
    setMessage(saved ? 'Aides contextuelles activées.' : 'Aides contextuelles masquées.');
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

  function navigate(page: PageName): void {
    if (page === 'Interventions & Maintenance') setOperationsSearchTarget(null);
    if (page === 'Projets') setProjectSearchTarget(null);
    if (page === 'Bibliothèque AtoumWeb') setLibrarySearchTarget(null);
    if (page === 'Sauvegardes') setBackupSearchTarget(null);
    if (page === 'Documents & Contrats') setDocumentTarget(null);
    setActivePage(page);
  }

  function openOperationsTarget(target: OperationsSearchTarget): void {
    setOperationsSearchTarget(target);
    setActivePage('Interventions & Maintenance');
  }

  function openSearchResult(result: SearchResult): void {
    switch (result.entityType) {
      case 'prospect': setProspectViewTarget('directory'); setCrmTarget(result.entityId); setActivePage('Prospects'); break;
      case 'catalog': setActivePage('Offres & Tarifs'); break;
      case 'quote': setQuoteTarget(result.entityId); setActivePage('Devis'); break;
      case 'project':
        setProjectSearchTarget(result.entityId);
        setActivePage('Projets');
        break;
      case 'atoumweb_library':
        setLibrarySearchTarget(result.entityId);
        setActivePage('Bibliothèque AtoumWeb');
        break;
      case 'backup_record':
        setBackupSearchTarget(result.entityId);
        setActivePage('Sauvegardes');
        break;
      case 'service_request':
      case 'intervention':
      case 'maintenance':
      case 'hour_pack':
        openOperationsTarget({ entityType: result.entityType, entityId: result.entityId });
        break;
      case 'client': setCrmTarget(result.entityId); setActivePage('Clients'); break;
      case 'client_document': setDocumentTarget(result.entityId); setActivePage('Documents & Contrats'); break;

      case 'organization':
      case 'contact':
      default: setActivePage('Clients'); break;
    }
    setMessage(`${result.title} trouvé dans la recherche globale.`);
  }

  if (loadingError) {
    return <div className="fatal-screen"><div className="fatal-card"><span className="eyebrow">AtoumWeb Manager</span><h1>Le démarrage a échoué</h1><p>{loadingError}</p></div></div>;
  }

  if (!bootstrap) {
    return <div className="splash-screen"><div className="brand-mark">AW</div><strong>AtoumWeb Manager</strong><span>Initialisation du workspace et de la base locale…</span></div>;
  }

  if (prospectReferenceId) {
    return <ProspectReferenceWindow prospectId={prospectReferenceId} />;
  }

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${showHoverHelp ? '' : 'help-disabled'}`}>
      <aside className="sidebar">
        <div className="brand-block"><div className="brand-mark">AW</div><div><strong>AtoumWeb</strong><span>Manager</span></div></div>
        <nav className="navigation" aria-label="Navigation principale">
          {NAV_ITEMS.map((item) => <button key={item} className={`nav-item ${activePage === item ? 'active' : ''}`} onClick={() => navigate(item)} type="button"><span className="nav-dot" /><span>{item === 'Prospects' ? 'Prospection' : item}</span></button>)}
        </nav>
        <div className="sidebar-footer"><span>V{bootstrap.appVersion}</span><span className="status-pill">Local</span></div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="sidebar-toggle"
              type="button"
              title={sidebarCollapsed ? 'Afficher le menu' : 'Masquer le menu'}
              aria-label={sidebarCollapsed ? 'Afficher le menu' : 'Masquer le menu'}
              aria-pressed={sidebarCollapsed}
              onClick={() => setSidebarCollapsed((value) => !value)}
            >{sidebarCollapsed ? '☰' : '‹'}</button>
            <GlobalSearch onOpen={openSearchResult} />
          </div>
          <GlobalTimer onMessage={setMessage} />
        </header>

        <section className={`content-area ${activePage === 'Accueil' ? 'home-content' : ''}`}>
          {activePage !== 'Accueil' && <div className="page-heading"><div><span className="eyebrow">AtoumWeb Manager</span><h1>{activePage === 'Prospects' ? 'Prospection' : activePage}</h1><p>{PAGE_HINTS[activePage]}</p></div><div className="database-chip"><span className="health-dot" />SQLite · {bootstrap.database.migrationCount} migration{bootstrap.database.migrationCount > 1 ? 's' : ''}</div></div>}
          {message && <div className="notice" role="status"><span>{message}</span><button type="button" onClick={() => setMessage(null)}>×</button></div>}

          {activePage === 'Accueil' && <HomeDashboard onMessage={setMessage} />}
          {activePage === 'Réglages' && <DemoPanel />}
          {activePage === 'Prospects' && <ProspectsPage key={`${crmTarget ?? 'none'}:${prospectViewTarget}`} initialId={crmTarget} initialView={prospectViewTarget} onMessage={setMessage} />}
          {activePage === 'Clients' && <ClientsPage key={crmTarget} initialId={crmTarget} onMessage={setMessage} />}
          {activePage === 'Offres & Tarifs' && <CatalogPage onMessage={setMessage} />}
          {activePage === 'Devis' && <QuotesPage key={quoteTarget} initialId={quoteTarget} onMessage={setMessage} />}
          {activePage === 'Projets' && <ProjectsPage onMessage={setMessage} initialProjectId={projectSearchTarget} showHoverHelp={showHoverHelp} />}
          {activePage === 'Interventions & Maintenance' && <OperationsPage onMessage={setMessage} initialTarget={operationsSearchTarget} />}
          {activePage === 'Gestion des temps' && <TimePage onMessage={setMessage} />}
          {activePage === 'Facturation' && <BillingPage onMessage={setMessage} />}
          {activePage === 'Dépenses' && <ExpensesPage onMessage={setMessage} />}
          {activePage === 'Documents & Contrats' && <DocumentsPage onMessage={setMessage} initialDocumentId={documentTarget} />}
          {activePage === 'Bibliothèque AtoumWeb' && <AtoumWebLibraryPage onMessage={setMessage} initialItemId={librarySearchTarget} />}
          {activePage === 'Sauvegardes' && <BusinessBackupsPage onMessage={setMessage} initialRecordId={backupSearchTarget} />}
          {activePage === 'Réglages' && <SettingsPage bootstrap={bootstrap} theme={theme} displayDensity={displayDensity} showHoverHelp={showHoverHelp} onThemeChange={updateTheme} onDensityChange={updateDisplayDensity} onShowHoverHelpChange={updateShowHoverHelp} onChooseWorkspace={chooseWorkspace} onCreateBackup={createManualBackup} onRestoreBackup={restoreBackup} />}
          {activePage !== 'Accueil' && activePage !== 'Prospects' && activePage !== 'Clients' && activePage !== 'Offres & Tarifs' && activePage !== 'Devis' && activePage !== 'Projets' && activePage !== 'Interventions & Maintenance' && activePage !== 'Gestion des temps' && activePage !== 'Facturation' && activePage !== 'Dépenses' && activePage !== 'Documents & Contrats' && activePage !== 'Bibliothèque AtoumWeb' && activePage !== 'Sauvegardes' && activePage !== 'Réglages' && <ModulePlaceholder page={activePage} />}
        </section>
      </main>
    </div>
  );
}

function SettingsPage({ bootstrap, theme, displayDensity, showHoverHelp, onThemeChange, onDensityChange, onShowHoverHelpChange, onChooseWorkspace, onCreateBackup, onRestoreBackup }: {
  bootstrap: BootstrapState;
  theme: ThemeName;
  displayDensity: DisplayDensity;
  showHoverHelp: boolean;
  onThemeChange: (theme: ThemeName) => Promise<void>;
  onDensityChange: (density: DisplayDensity) => Promise<void>;
  onShowHoverHelpChange: (enabled: boolean) => Promise<void>;
  onChooseWorkspace: () => Promise<void>;
  onCreateBackup: () => Promise<void>;
  onRestoreBackup: () => Promise<void>;
}) {
  return (
    <div className="settings-grid">
      <article className="panel panel-large">
        <div className="panel-title"><div><span className="eyebrow">Apparence</span><h2>Thème de l’interface</h2></div>{theme !== 'atoumweb' && <button className="secondary-button" type="button" onClick={() => void onThemeChange('atoumweb')}>Rétablir le thème par défaut</button>}</div>
        <div className="theme-grid">{THEMES.map((item) => <button className={`theme-card ${theme === item.id ? 'selected' : ''}`} key={item.id} onClick={() => void onThemeChange(item.id)} type="button"><span className={`theme-preview preview-${item.id}`}><i /><b /></span><strong>{item.label}</strong><span>{item.description}</span></button>)}</div>
        <div className="density-settings">
          <div><span className="eyebrow">Lisibilité</span><h2>Densité d’affichage</h2><p className="muted">Adapte la taille des textes, les espacements et les zones cliquables à ton confort de travail.</p></div>
          <div className="density-grid">{DENSITIES.map((item) => <button className={`density-card ${displayDensity === item.id ? 'selected' : ''}`} key={item.id} type="button" onClick={() => void onDensityChange(item.id)}><strong>{item.label}</strong><span>{item.description}</span></button>)}</div>
        </div>
        <div className="settings-help-row">
          <div>
            <span className="eyebrow">Aide contextuelle</span>
            <h2>Conseils au survol</h2>
            <p className="muted">Affiche de courtes explications sur les champs de production quand tu passes la souris dessus.</p>
          </div>
          <label className="settings-switch">
            <input type="checkbox" checked={showHoverHelp} onChange={(event) => void onShowHoverHelpChange(event.target.checked)} />
            <span>{showHoverHelp ? 'Activée' : 'Désactivée'}</span>
          </label>
        </div>
      </article>
      <article className="panel"><span className="eyebrow">Stockage</span><h2>Workspace local</h2><p className="path-value">{bootstrap.workspacePath}</p><button className="primary-button" type="button" onClick={() => void onChooseWorkspace()}>Choisir un autre dossier</button></article>
      <article className="panel"><span className="eyebrow">Sécurité</span><h2>Sauvegarde de la base</h2><p className="muted">Une sauvegarde automatique est créée chaque jour. Une copie de sécurité est aussi créée avant toute restauration.</p><div className="button-row"><button className="secondary-button" type="button" onClick={() => void onCreateBackup()}>Sauvegarder maintenant</button><button className="secondary-button" type="button" onClick={() => void onRestoreBackup()}>Restaurer une sauvegarde</button></div></article>
    </div>
  );
}

function ModulePlaceholder({ page }: { page: PageName }) {
  return <article className="panel empty-module"><span className="module-number">V1</span><h2>{page}</h2><p>{PAGE_HINTS[page]}</p><span className="status-pill">Conception validée · Développement à venir</span></article>;
}

export default App;
