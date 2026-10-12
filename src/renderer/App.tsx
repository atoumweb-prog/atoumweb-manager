import {requestUnsavedExit,installUnsavedLifecycleBridge} from './unsaved/unsaved';
import { DemoPanel } from './workflow/DemoPanel';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { BootstrapState, DisplayDensity, ThemeName } from '../shared/contracts';
import type { SearchResult } from '../shared/crm';
import { BusinessBackupsPage } from './backups/BusinessBackupsPage';
import { BillingPage } from './billing/BillingPage';
import { ExpensesPage } from './expenses/ExpensesPage';
import { DocumentsPage } from './documents/DocumentsPage';
import { DirectoryPage, type DirectorySearchTarget } from './directory/DirectoryPage';
import { CatalogPage } from './commercial/CatalogPage';
import { QuotesPage } from './commercial/QuotesPage';
import { ClientsPage } from './crm/ClientsPage';
import { GlobalSearch } from './crm/GlobalSearch';
import { HomeDashboard } from './home/HomeDashboard';
import { ProspectsPage } from './crm/ProspectsPage';
import { ProspectReferenceWindow } from './crm/ProspectReferenceWindow';
import { OperationsPage, type OperationsSearchTarget } from './operations/OperationsPage';
import { OperationIcon } from './operations/OperationIcon';
import { ProjectsPage } from './projects/ProjectsPage';
import { AtoumWebLibraryPage } from './referentials/AtoumWebLibraryPage';
import { BridgeSitesPage } from './bridge/BridgeSitesPage';
import { StatisticsPage } from './statistics/StatisticsPage';
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
  'Sites',
  'Sauvegardes',
  'Annuaire',
  'Statistiques',
  'Réglages',
] as const;

type PageName = (typeof NAV_ITEMS)[number];
type ProspectPipelineFilter = 'all' | 'relaunch' | 'overdue';
type MessageAction = { message: string; run: () => void };

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
  Sites: 'Copies techniques, pages et snapshots collectés par AtoumWeb Bridge.',
  Sauvegardes: 'Traçabilité des sauvegardes serveur, locales et externes.',
  Annuaire: 'Organisations, contacts professionnels et relations CRM.',
  Statistiques: 'Commercial, projets, temps, clients et repères financiers.',
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
  useLayoutEffect(installUnsavedLifecycleBridge,[]);
  const prospectReferenceId = new URLSearchParams(window.location.search).get('prospectReference');
  const [bootstrap, setBootstrap] = useState<BootstrapState | null>(null);
  const [activePage, setActivePage] = useState<PageName>('Accueil');
  const activePageRef=useRef(activePage);activePageRef.current=activePage;
  const [navigationRequest,setNavigationRequest]=useState(0);
  function requestPage(page:PageName,run:()=>void,replace=false){const transition=()=>{if((page==='Clients'||page==='Prospects')&&page!==activePageRef.current)setCrmTarget(null);run();};if(page===activePageRef.current&&!replace)transition();else requestUnsavedExit(transition);}
  const [theme, setTheme] = useState<ThemeName>('atoumweb');
  const [displayDensity, setDisplayDensity] = useState<DisplayDensity>('comfort');
  const [showHoverHelp, setShowHoverHelp] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [libraryHeaderCollapsed, setLibraryHeaderCollapsed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageAction, setMessageAction] = useState<MessageAction | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [crmTarget,setCrmTarget] = useState<string|null>(null);
  const [prospectViewTarget, setProspectViewTarget] = useState<'directory' | 'pipeline' | 'history'>('directory');
  const [prospectPipelineFilter, setProspectPipelineFilter] = useState<ProspectPipelineFilter>('all');
  const [quoteTarget,setQuoteTarget] = useState<string|null>(null);
  const routeKeys=useRef({crmTarget,quoteTarget,prospectViewTarget,prospectPipelineFilter});routeKeys.current={crmTarget,quoteTarget,prospectViewTarget,prospectPipelineFilter};
  const [documentTarget, setDocumentTarget] = useState<string | null>(null);
  const [contractTypeTarget,setContractTypeTarget]=useState<string|null>(null);
  const [catalogTarget,setCatalogTarget]=useState<string|null>(null);
  useEffect(()=>{
    const contract=(e:Event)=>{requestPage('Documents & Contrats',()=>{setContractTypeTarget((e as CustomEvent<string|null>).detail??'all');setActivePage('Documents & Contrats');});};
    const catalog=(e:Event)=>{requestPage('Offres & Tarifs',()=>{setCatalogTarget((e as CustomEvent<string>).detail);setActivePage('Offres & Tarifs');});};
    window.addEventListener('atoumweb:open-contract-library',contract);window.addEventListener('atoumweb:open-catalog-item',catalog);
    return()=>{window.removeEventListener('atoumweb:open-contract-library',contract);window.removeEventListener('atoumweb:open-catalog-item',catalog);};
  },[]);
  const [directoryTarget, setDirectoryTarget] = useState<DirectorySearchTarget | null>(null);
  useEffect(()=>{const open=(event:Event)=>openSearchResult((event as CustomEvent<SearchResult>).detail);window.addEventListener('atoumweb:navigate',open);return()=>window.removeEventListener('atoumweb:navigate',open);},[]);
  useEffect(() => { const open = (event: Event) => {requestPage((event as CustomEvent<PageName>).detail,()=>{setActivePage((event as CustomEvent<PageName>).detail);});}; window.addEventListener('atoumweb:open-page', open); return () => window.removeEventListener('atoumweb:open-page', open); }, []);
  useEffect(() => {
    const open = (event: Event) => {const target=(event as CustomEvent<'directory'|'pipeline'|'history'|{view:'directory'|'pipeline'|'history';pipelineFilter?:ProspectPipelineFilter}>).detail;const targetView=typeof target==='string'?target:target.view;const targetFilter=targetView==='pipeline'&&typeof target!=='string'?target.pipelineFilter??'all':'all';requestPage('Prospects',()=>{
      const detail = (event as CustomEvent<
        | 'directory'
        | 'pipeline'
        | 'history'
        | { view: 'directory' | 'pipeline' | 'history'; pipelineFilter?: ProspectPipelineFilter }
      >).detail;
      const view = typeof detail === 'string' ? detail : detail.view;
      const pipelineFilter = typeof detail === 'string' ? 'all' : detail.pipelineFilter ?? 'all';
      setProspectViewTarget(view);
      setProspectPipelineFilter(view === 'pipeline' ? pipelineFilter : 'all');
      setCrmTarget(null);
      setActivePage('Prospects');},routeKeys.current.crmTarget!==null||routeKeys.current.prospectViewTarget!==targetView||routeKeys.current.prospectPipelineFilter!==targetFilter);};
    window.addEventListener('atoumweb:open-prospects-view', open);
    return () => window.removeEventListener('atoumweb:open-prospects-view', open);
  }, []);
  useEffect(() => {
    const openConclusion = (event: Event) => {requestPage('Interventions & Maintenance',()=>{
      const interventionId = (event as CustomEvent<{ interventionId?: string }>).detail?.interventionId;
      if (!interventionId) return;
      setOperationsSearchTarget({ entityType: 'intervention', entityId: interventionId, focus: 'conclusion' });
      setActivePage('Interventions & Maintenance');});};
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

  function showMessage(nextMessage: string, action?: () => void): void {
    setMessage(nextMessage);
    setMessageAction(action ? { message: nextMessage, run: action } : null);
  }

  function closeMessage(): void {
    setMessage(null);
    setMessageAction(null);
  }

  useEffect(() => {
    const openLibraryItem = (event: Event) => {requestPage('Bibliothèque AtoumWeb',()=>{
      const itemId = (event as CustomEvent<string>).detail;
      if (!itemId) return;
      setLibrarySearchTarget(itemId);
      setActivePage('Bibliothèque AtoumWeb');});};
    window.addEventListener('atoumweb:open-library-item', openLibraryItem);
    return () => window.removeEventListener('atoumweb:open-library-item', openLibraryItem);
  }, []);

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

  function navigateDirect(page: PageName): void {
    if (page === 'Interventions & Maintenance') setOperationsSearchTarget(null);
    if (page === 'Projets') setProjectSearchTarget(null);
    if (page === 'Bibliothèque AtoumWeb') setLibrarySearchTarget(null);
    if (page === 'Sauvegardes') setBackupSearchTarget(null);
    if (page === 'Documents & Contrats') {setDocumentTarget(null);setContractTypeTarget(null);}
    if (page === 'Offres & Tarifs') setCatalogTarget(null);
    if (page === 'Annuaire') setDirectoryTarget(null);
    setActivePage(page);
  }

  function openOperationsTargetDirect(target: OperationsSearchTarget): void {
    setOperationsSearchTarget(target);
    setActivePage('Interventions & Maintenance');
  }

  function openSearchResultDirect(result: SearchResult): void {
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
        setDirectoryTarget({ entityType: result.entityType, entityId: result.entityId });
        setActivePage('Annuaire');
        break;
      default: setActivePage('Clients'); break;
    }
    setMessage(`${result.title} trouvé dans la recherche globale.`);
  }

  function navigate(item:PageName){if(item===activePageRef.current)return;requestPage(item,()=>navigateDirect(item));}
  function openSearchResult(result:SearchResult){const destination:PageName=({prospect:'Prospects',quote:'Devis',project:'Projets',catalog:'Offres & Tarifs',client:'Clients',client_document:'Documents & Contrats',organization:'Annuaire',contact:'Annuaire',atoumweb_library:'Bibliothèque AtoumWeb',backup_record:'Sauvegardes',service_request:'Interventions & Maintenance',intervention:'Interventions & Maintenance',maintenance:'Interventions & Maintenance',hour_pack:'Interventions & Maintenance'} as Record<string,PageName>)[result.entityType]??'Clients';requestPage(destination,()=>{setNavigationRequest(n=>n+1);openSearchResultDirect(result);},destination==='Devis'?routeKeys.current.quoteTarget!==result.entityId:destination==='Prospects'?routeKeys.current.crmTarget!==result.entityId||routeKeys.current.prospectViewTarget!=='directory':false);}
  function openOperationsTarget(target:OperationsSearchTarget){requestPage('Interventions & Maintenance',()=>openOperationsTargetDirect(target));}

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
        <header className={/([\\/])Validation-MSI$/i.test(bootstrap.workspacePath)?'topbar is-development':'topbar'}>
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
            {activePage === 'Bibliothèque AtoumWeb' && <button
              className="sidebar-toggle library-header-topbar-toggle"
              type="button"
              title={libraryHeaderCollapsed ? 'Afficher le bandeau de la Bibliothèque' : 'Masquer le bandeau de la Bibliothèque'}
              aria-label={libraryHeaderCollapsed ? 'Afficher le bandeau de la Bibliothèque' : 'Masquer le bandeau de la Bibliothèque'}
              aria-pressed={libraryHeaderCollapsed}
              onClick={() => setLibraryHeaderCollapsed((value) => !value)}
            >
              <OperationIcon name={libraryHeaderCollapsed ? 'chevron-down' : 'chevron-up'} size={20} />
            </button>}
          </div>
          <div className="topbar-right">
            <GlobalTimer onMessage={setMessage} />
            <GlobalClock />
          </div>
        {/([\\/])Validation-MSI$/i.test(bootstrap.workspacePath)&&<div role="status" className="development-environment-banner">DÉVELOPPEMENT — dossiers TEST — aucune valeur contractuelle réelle</div>}
        </header>

        <section className={`content-area ${activePage === 'Accueil' ? 'home-content' : ''} ${activePage === 'Bibliothèque AtoumWeb' || activePage === 'Sites' ? 'workspace-content' : ''} ${activePage === 'Projets' ? 'projects-content' : ''} ${activePage === 'Bibliothèque AtoumWeb' ? 'library-workspace-content' : ''} ${activePage === 'Bibliothèque AtoumWeb' && libraryHeaderCollapsed ? 'library-header-collapsed' : ''}`}>
          {activePage !== 'Accueil' && <div className="page-heading"><div><span className="eyebrow">AtoumWeb Manager</span><h1>{activePage === 'Prospects' ? 'Prospection' : activePage}</h1><p>{PAGE_HINTS[activePage]}</p></div><div className="database-chip"><span className="health-dot" />SQLite · {bootstrap.database.migrationCount} migration{bootstrap.database.migrationCount > 1 ? 's' : ''}</div></div>}
          {message && <div className={`notice ${messageAction?.message === message ? 'is-actionable' : ''}`} role="status">
            {messageAction?.message === message
              ? <button className="notice-action" type="button" onClick={messageAction.run}><span>{message}</span><small>Ouvrir dans l’Explorateur</small></button>
              : <span>{message}</span>}
            <button className="notice-close" type="button" aria-label="Fermer la notification" onClick={closeMessage}>×</button>
          </div>}

          {activePage === 'Accueil' && <HomeDashboard onMessage={setMessage} />}
          {activePage === 'Réglages' && <DemoPanel />}
          {activePage === 'Prospects' && <ProspectsPage key={`${crmTarget ?? 'none'}:${prospectViewTarget}:${prospectPipelineFilter}`} initialId={crmTarget} initialRequest={navigationRequest} initialView={prospectViewTarget} initialPipelineFilter={prospectPipelineFilter} onMessage={setMessage} />}
          {activePage === 'Clients' && <ClientsPage key={crmTarget} initialId={crmTarget} onMessage={setMessage} />}
          {activePage === 'Offres & Tarifs' && <CatalogPage onMessage={setMessage} initialId={catalogTarget}/>}
          {activePage === 'Devis' && <QuotesPage key={quoteTarget} initialId={quoteTarget} initialRequest={navigationRequest} onMessage={setMessage} />}
          {activePage === 'Projets' && <ProjectsPage onMessage={showMessage} initialProjectId={projectSearchTarget} showHoverHelp={showHoverHelp} />}
          {activePage === 'Interventions & Maintenance' && <OperationsPage onMessage={setMessage} initialTarget={operationsSearchTarget} />}
          {activePage === 'Gestion des temps' && <TimePage onMessage={setMessage} />}
          {activePage === 'Facturation' && <BillingPage onMessage={setMessage} />}
          {activePage === 'Dépenses' && <ExpensesPage onMessage={setMessage} />}
          {activePage === 'Documents & Contrats' && <DocumentsPage onMessage={setMessage} initialDocumentId={documentTarget} initialContractTypeId={contractTypeTarget}/>}
          {activePage === 'Bibliothèque AtoumWeb' && <AtoumWebLibraryPage
            onMessage={setMessage}
            initialItemId={librarySearchTarget}
            headerCollapsed={libraryHeaderCollapsed}
          />}
          {activePage === 'Sites' && <BridgeSitesPage onMessage={setMessage} />}
          {activePage === 'Sauvegardes' && <BusinessBackupsPage onMessage={setMessage} initialRecordId={backupSearchTarget} />}
          {activePage === 'Annuaire' && <DirectoryPage onMessage={setMessage} initialTarget={directoryTarget} />}
          {activePage === 'Statistiques' && <StatisticsPage onMessage={setMessage} />}
          {activePage === 'Réglages' && <SettingsPage bootstrap={bootstrap} theme={theme} displayDensity={displayDensity} showHoverHelp={showHoverHelp} onThemeChange={updateTheme} onDensityChange={updateDisplayDensity} onShowHoverHelpChange={updateShowHoverHelp} onChooseWorkspace={chooseWorkspace} onCreateBackup={createManualBackup} onRestoreBackup={restoreBackup} />}
          {activePage !== 'Accueil' && activePage !== 'Prospects' && activePage !== 'Clients' && activePage !== 'Offres & Tarifs' && activePage !== 'Devis' && activePage !== 'Projets' && activePage !== 'Interventions & Maintenance' && activePage !== 'Gestion des temps' && activePage !== 'Facturation' && activePage !== 'Dépenses' && activePage !== 'Documents & Contrats' && activePage !== 'Bibliothèque AtoumWeb' && activePage !== 'Sites' && activePage !== 'Sauvegardes' && activePage !== 'Annuaire' && activePage !== 'Statistiques' && activePage !== 'Réglages' && <ModulePlaceholder page={activePage} />}
        </section>
      </main>
    </div>
  );
}


function GlobalClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const hour = now.getHours();
  const isDay = hour >= 7 && hour < 20;
  const greeting = hour < 18 ? 'Bonjour !' : 'Bonsoir !';
  const time = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return <div className="global-clock" title={isDay ? 'Période de jour' : 'Période de nuit'} aria-label={`${greeting} ${date}, ${time}`}>
    <span className="global-clock-icon"><OperationIcon name={isDay ? 'sun' : 'moon'} size={20} /></span>
    <span className="global-clock-copy"><strong>{greeting}</strong><small>{date}</small></span>
    <b>{time}</b>
  </div>;
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
            <p className="muted">Affiche automatiquement le détail après un survol prolongé. Même désactivée, l’aide ? reste accessible au clic et au clavier.</p>
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
