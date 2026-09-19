import { WorkflowDashboard } from './workflow/WorkflowDashboard';
import { DemoPanel } from './workflow/DemoPanel';
import { useEffect, useState } from 'react';
import type { BootstrapState, DisplayDensity, ThemeName } from '../shared/contracts';
import type { SearchResult } from '../shared/crm';
import { CatalogPage } from './commercial/CatalogPage';
import { QuotesPage } from './commercial/QuotesPage';
import { ClientsPage } from './crm/ClientsPage';
import { GlobalSearch } from './crm/GlobalSearch';
import { ProspectsPage } from './crm/ProspectsPage';
import { DashboardOperationsWatch } from './operations/DashboardOperationsWatch';
import { OperationsPage, type OperationsSearchTarget } from './operations/OperationsPage';
import { ProjectsPage } from './projects/ProjectsPage';
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
  const [bootstrap, setBootstrap] = useState<BootstrapState | null>(null);
  const [activePage, setActivePage] = useState<PageName>('Accueil');
  const [theme, setTheme] = useState<ThemeName>('atoumweb');
  const [displayDensity, setDisplayDensity] = useState<DisplayDensity>('comfort');
  const [message, setMessage] = useState<string | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [crmTarget,setCrmTarget] = useState<string|null>(null);
  const [quoteTarget,setQuoteTarget] = useState<string|null>(null);
  useEffect(()=>{const open=(event:Event)=>openSearchResult((event as CustomEvent<SearchResult>).detail);window.addEventListener('atoumweb:navigate',open);return()=>window.removeEventListener('atoumweb:navigate',open);},[]);
  useEffect(() => { const open = (event: Event) => setActivePage((event as CustomEvent<PageName>).detail); window.addEventListener('atoumweb:open-page', open); return () => window.removeEventListener('atoumweb:open-page', open); }, []);
  const [projectSearchTarget, setProjectSearchTarget] = useState<string | null>(null);
  const [operationsSearchTarget, setOperationsSearchTarget] = useState<OperationsSearchTarget | null>(null);

  useEffect(() => {
    window.atoumweb.app.getBootstrap()
      .then((state) => {
        setBootstrap(state);
        setTheme(state.theme);
        setDisplayDensity(state.displayDensity);
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
    setActivePage(page);
  }

  function openOperationsTarget(target: OperationsSearchTarget): void {
    setOperationsSearchTarget(target);
    setActivePage('Interventions & Maintenance');
  }

  function openSearchResult(result: SearchResult): void {
    switch (result.entityType) {
      case 'prospect': setCrmTarget(result.entityId); setActivePage('Prospects'); break;
      case 'catalog': setActivePage('Offres & Tarifs'); break;
      case 'quote': setQuoteTarget(result.entityId); setActivePage('Devis'); break;
      case 'project':
        setProjectSearchTarget(result.entityId);
        setActivePage('Projets');
        break;
      case 'service_request':
      case 'intervention':
      case 'maintenance':
      case 'hour_pack':
        openOperationsTarget({ entityType: result.entityType, entityId: result.entityId });
        break;
      case 'client': setCrmTarget(result.entityId); setActivePage('Clients'); break;
      case 'client_document': setCrmTarget(result.parentEntityId??result.entityId); setActivePage('Clients'); break;

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

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block"><div className="brand-mark">AW</div><div><strong>AtoumWeb</strong><span>Manager</span></div></div>
        <nav className="navigation" aria-label="Navigation principale">
          {NAV_ITEMS.map((item) => <button key={item} className={`nav-item ${activePage === item ? 'active' : ''}`} onClick={() => navigate(item)} type="button"><span className="nav-dot" /><span>{item}</span></button>)}
        </nav>
        <div className="sidebar-footer"><span>V{bootstrap.appVersion}</span><span className="status-pill">Local</span></div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <GlobalSearch onOpen={openSearchResult} />
          <GlobalTimer onMessage={setMessage} />
        </header>

        <section className="content-area">
          <div className="page-heading"><div><span className="eyebrow">AtoumWeb Manager</span><h1>{activePage}</h1><p>{PAGE_HINTS[activePage]}</p></div><div className="database-chip"><span className="health-dot" />SQLite · {bootstrap.database.migrationCount} migration{bootstrap.database.migrationCount > 1 ? 's' : ''}</div></div>
          {message && <div className="notice" role="status"><span>{message}</span><button type="button" onClick={() => setMessage(null)}>×</button></div>}

          {activePage === 'Accueil' && <WorkflowDashboard />}
          {activePage === 'Réglages' && <DemoPanel />}
          {activePage === 'Accueil' && <Dashboard bootstrap={bootstrap} onOpenOperations={openOperationsTarget} onMessage={setMessage} />}
          {activePage === 'Prospects' && <ProspectsPage key={crmTarget} initialId={crmTarget} onMessage={setMessage} />}
          {activePage === 'Clients' && <ClientsPage key={crmTarget} initialId={crmTarget} onMessage={setMessage} />}
          {activePage === 'Offres & Tarifs' && <CatalogPage onMessage={setMessage} />}
          {activePage === 'Devis' && <QuotesPage key={quoteTarget} initialId={quoteTarget} onMessage={setMessage} />}
          {activePage === 'Projets' && <ProjectsPage onMessage={setMessage} initialProjectId={projectSearchTarget} />}
          {activePage === 'Interventions & Maintenance' && <OperationsPage onMessage={setMessage} initialTarget={operationsSearchTarget} />}
          {activePage === 'Gestion des temps' && <TimePage onMessage={setMessage} />}
          {activePage === 'Réglages' && <SettingsPage bootstrap={bootstrap} theme={theme} displayDensity={displayDensity} onThemeChange={updateTheme} onDensityChange={updateDisplayDensity} onChooseWorkspace={chooseWorkspace} onCreateBackup={createManualBackup} onRestoreBackup={restoreBackup} />}
          {activePage !== 'Accueil' && activePage !== 'Prospects' && activePage !== 'Clients' && activePage !== 'Offres & Tarifs' && activePage !== 'Devis' && activePage !== 'Projets' && activePage !== 'Interventions & Maintenance' && activePage !== 'Gestion des temps' && activePage !== 'Réglages' && <ModulePlaceholder page={activePage} />}
        </section>
      </main>
    </div>
  );
}

function Dashboard({ bootstrap, onOpenOperations, onMessage }: {
  bootstrap: BootstrapState;
  onOpenOperations: (target: OperationsSearchTarget) => void;
  onMessage: (message: string) => void;
}) {
  const [prospectCount, setProspectCount] = useState<number | null>(null);
  const [clientCount, setClientCount] = useState<number | null>(null);
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [monthTime, setMonthTime] = useState<number | null>(null);

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    void Promise.all([
      window.atoumweb.crm.prospects.list(),
      window.atoumweb.crm.clients.list(),
      window.atoumweb.projects.projects.list(),
      window.atoumweb.time.summary({ from: start.toISOString(), to: end.toISOString() }),
    ]).then(([prospects, clients, projects, timeSummary]) => {
      setProspectCount(prospects.filter((prospect) => prospect.stage !== 'won' && prospect.stage !== 'lost').length);
      setClientCount(clients.length);
      setProjectCount(projects.filter((project) => !['completed', 'archived'].includes(project.status)).length);
      setMonthTime(timeSummary.totalSeconds);
    });
  }, []);

  return (
    <>
      <div className="kpi-grid">
        <KpiCard label="Prospects actifs" value={prospectCount == null ? '…' : String(prospectCount)} detail="Pipeline commercial" />
        <KpiCard label="Projets en cours" value={projectCount == null ? '…' : String(projectCount)} detail={`${clientCount ?? 0} client${clientCount === 1 ? '' : 's'} enregistré${clientCount === 1 ? '' : 's'}`} />
        <KpiCard label="CA encaissé ce mois" value="0 €" detail="Suivi Abby à venir" />
        <KpiCard label="Temps travaillé ce mois" value={monthTime == null ? '…' : formatDashboardTime(monthTime)} detail="Calculé depuis les sessions" />
      </div>
      <div className="dashboard-grid">
        <DashboardOperationsWatch onOpen={onOpenOperations} onMessage={onMessage} />
        <article className="panel panel-large"><div className="panel-title"><div><span className="eyebrow">Socle métier</span><h2>CRM + Commercial + Projets + Opérations</h2></div><span className="status-pill">Phase 4 en cours</span></div><div className="foundation-list"><FoundationRow label="Workspace local" value={bootstrap.workspacePath} /><FoundationRow label="Base SQLite" value={bootstrap.databasePath} /><FoundationRow label="CRM" value="Organisations · Contacts · Prospects · Clients" /><FoundationRow label="Commercial" value="Catalogue · Devis · Snapshots" /><FoundationRow label="Production" value="Projets · Modèles · Plans · Ressources · Temps" /><FoundationRow label="Opérations" value="Demandes · Interventions · Maintenance · Packs d’heures" /></div></article>
        <article className="panel"><span className="eyebrow">Aujourd’hui</span><h2>{prospectCount ? `${prospectCount} prospect${prospectCount > 1 ? 's' : ''} actif${prospectCount > 1 ? 's' : ''}` : 'Pipeline à jour'}</h2><p className="muted">Les actions commerciales et le travail projet alimentent progressivement cette vue.</p></article>
        <article className="panel"><span className="eyebrow">Production</span><h2>{projectCount ?? 0} projet{projectCount === 1 ? '' : 's'} actif{projectCount === 1 ? '' : 's'}</h2><p className="muted">Le temps réel est maintenant issu exclusivement des sessions du timer et des saisies manuelles.</p></article>
      </div>
    </>
  );
}

function formatDashboardTime(seconds: number): string {
  const hours = seconds / 3600;
  return hours < 10 ? `${hours.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} h` : `${Math.round(hours)} h`;
}

function SettingsPage({ bootstrap, theme, displayDensity, onThemeChange, onDensityChange, onChooseWorkspace, onCreateBackup, onRestoreBackup }: {
  bootstrap: BootstrapState;
  theme: ThemeName;
  displayDensity: DisplayDensity;
  onThemeChange: (theme: ThemeName) => Promise<void>;
  onDensityChange: (density: DisplayDensity) => Promise<void>;
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
      </article>
      <article className="panel"><span className="eyebrow">Stockage</span><h2>Workspace local</h2><p className="path-value">{bootstrap.workspacePath}</p><button className="primary-button" type="button" onClick={() => void onChooseWorkspace()}>Choisir un autre dossier</button></article>
      <article className="panel"><span className="eyebrow">Sécurité</span><h2>Sauvegarde de la base</h2><p className="muted">Une sauvegarde automatique est créée chaque jour. Une copie de sécurité est aussi créée avant toute restauration.</p><div className="button-row"><button className="secondary-button" type="button" onClick={() => void onCreateBackup()}>Sauvegarder maintenant</button><button className="secondary-button" type="button" onClick={() => void onRestoreBackup()}>Restaurer une sauvegarde</button></div></article>
    </div>
  );
}

function ModulePlaceholder({ page }: { page: PageName }) {
  return <article className="panel empty-module"><span className="module-number">V1</span><h2>{page}</h2><p>{PAGE_HINTS[page]}</p><span className="status-pill">Conception validée · Développement à venir</span></article>;
}

function KpiCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="kpi-card"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}

function FoundationRow({ label, value }: { label: string; value: string }) {
  return <div className="foundation-row"><span>{label}</span><strong>{value}</strong></div>;
}

export default App;
