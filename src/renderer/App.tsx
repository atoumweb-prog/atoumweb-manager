import {useCallback} from 'react';
import {SEARCH_DESTINATIONS,searchDestination,readSearchTarget,type SearchNavigationResult} from '../shared/searchNavigation';
import {useMemo} from 'react';
import {NavigationRail, type NavigationRailControls} from './ui/NavigationRail';
import {WorkspaceHeader} from './ui/WorkspaceHeader';
import './ui/manager-shell.css';
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
import { ProjectsPage, type ProjectReturnContext } from './projects/ProjectsPage';
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
  const navigationEpoch=useRef(0);
  const visibleEntity=useRef<{type:SearchResult['entityType'];id:string}|null>(null);
  const pendingSearch=useRef<{result:SearchResult;resolve:(outcome:SearchNavigationResult)=>void}|null>(null);
  const cancelSearchNavigation=useCallback(()=>{navigationEpoch.current++;const pending=pendingSearch.current;pendingSearch.current=null;pending?.resolve({status:'cancelled',cancelledReason:'superseded',message:'Navigation remplacée ou annulée ; recherche conservée.'});},[]);
  const markEntityReady=useCallback((type:SearchResult['entityType'],id:string|null,error?:string)=>{
    if(SEARCH_DESTINATIONS[type]!==activePageRef.current)return;
    const pending=pendingSearch.current;
    if(pending){
      if(pending.result.entityType!==type||pending.result.entityId!==id)return;
      pendingSearch.current=null;
      if(error){visibleEntity.current=null;pending.resolve({status:'failed',message:error});setMessage(error);return;}
      visibleEntity.current=id?{type,id}:null;
      pending.resolve({status:'opened'});
      setMessage((pending.result.title||'Fiche')+' : fiche chargée.');
      if(id){
        const focusOrigin=document.activeElement,epoch=navigationEpoch.current;
        requestAnimationFrame(()=>{
          if(epoch!==navigationEpoch.current||visibleEntity.current?.type!==type||visibleEntity.current.id!==id)return;
          const pane=document.querySelector<HTMLElement>('[data-search-entity-id="'+CSS.escape(id)+'"][data-search-entity-type="'+type+'"]');
          // A field selected after loading owns focus; a delayed search acknowledgement must not take it back.
          if(document.activeElement!==focusOrigin||(pane?.contains(document.activeElement)&&document.activeElement!==pane))return;
          pane?.focus({preventScroll:true});
        });
      }
    }else visibleEntity.current=!error&&id?{type,id}:null;
  },[]);
  useEffect(()=>()=>cancelSearchNavigation(),[cancelSearchNavigation]);

  function requestPage(page:PageName,run:()=>void,replace=false){const transition=()=>{cancelSearchNavigation();if(page!==activePageRef.current||replace){visibleEntity.current=null;setQuoteReturnProjectId(null);setProjectReturnContext(null);}if((page==='Clients'||page==='Prospects')&&page!==activePageRef.current)setCrmTarget(null);run();};if(page===activePageRef.current&&!replace)transition();else requestUnsavedExit(transition);}
  const [theme, setTheme] = useState<ThemeName>('atoumweb');
  const [displayDensity, setDisplayDensity] = useState<DisplayDensity>('comfort');
  const [showHoverHelp, setShowHoverHelp] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const railControls = useRef<NavigationRailControls>(null);
  const [timerDialogOpen, setTimerDialogOpen] = useState(false);
  const visualStore = useMemo(() => ({getItem: (key:string) => window.atoumweb.visualPreferences.getItem(key), setItem: (key:string,value:string) => window.atoumweb.visualPreferences.setItem(key,value), removeItem: (key:string) => window.atoumweb.visualPreferences.removeItem(key)}), []);
  useEffect(() => window.atoumweb.visualPreferences.subscribe(key => window.dispatchEvent(new StorageEvent('storage', {key}))), []);
  const [libraryHeaderCollapsed, setLibraryHeaderCollapsed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageAction, setMessageAction] = useState<MessageAction | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [crmTarget,setCrmTarget] = useState<string|null>(null);
  const [prospectViewTarget, setProspectViewTarget] = useState<'directory' | 'pipeline' | 'history' | 'conversions'>('directory');
  const [prospectPipelineFilter, setProspectPipelineFilter] = useState<ProspectPipelineFilter>('all');
  const [quoteTarget,setQuoteTarget] = useState<string|null>(null);
  const [quoteReturnProjectId, setQuoteReturnProjectId] = useState<string | null>(null);
  const [projectReturnContext, setProjectReturnContext] = useState<ProjectReturnContext | null>(null);
  const routeKeys=useRef({crmTarget,quoteTarget,prospectViewTarget,prospectPipelineFilter});routeKeys.current={crmTarget,quoteTarget,prospectViewTarget,prospectPipelineFilter};
  const [documentTarget, setDocumentTarget] = useState<string | null>(null);
  const [contractTypeTarget,setContractTypeTarget]=useState<string|null>(null);
  const [catalogTarget,setCatalogTarget]=useState<string|null>(null);
  useEffect(()=>{
    const contract=(e:Event)=>{requestPage('Documents & Contrats',()=>{setContractTypeTarget((e as CustomEvent<string|null>).detail??'all');setActivePage('Documents & Contrats');});};
    const catalog=(e:Event)=>{void openSearchResult({entityType:'catalog',entityId:(e as CustomEvent<string>).detail,title:'Catalogue'},'event');};
    window.addEventListener('atoumweb:open-contract-library',contract);window.addEventListener('atoumweb:open-catalog-item',catalog);
    return()=>{window.removeEventListener('atoumweb:open-contract-library',contract);window.removeEventListener('atoumweb:open-catalog-item',catalog);};
  },[]);
  const [directoryTarget, setDirectoryTarget] = useState<DirectorySearchTarget | null>(null);
  useEffect(()=>{const open=(event:Event)=>void openSearchResult((event as CustomEvent<SearchResult>).detail,'event');window.addEventListener('atoumweb:navigate',open);return()=>window.removeEventListener('atoumweb:navigate',open);},[]);
  useEffect(() => { const open = (event: Event) => {requestPage((event as CustomEvent<PageName>).detail,()=>{setActivePage((event as CustomEvent<PageName>).detail);});}; window.addEventListener('atoumweb:open-page', open); return () => window.removeEventListener('atoumweb:open-page', open); }, []);
  useEffect(() => {
    const open = (event: Event) => {const target=(event as CustomEvent<'directory'|'pipeline'|'history'|'conversions'|{view:'directory'|'pipeline'|'history'|'conversions';pipelineFilter?:ProspectPipelineFilter}>).detail;const targetView=typeof target==='string'?target:target.view;const targetFilter=targetView==='pipeline'&&typeof target!=='string'?target.pipelineFilter??'all':'all';requestPage('Prospects',()=>{
      const detail = (event as CustomEvent<
        | 'directory'
        | 'pipeline'
        | 'history'
        | 'conversions'
        | { view: 'directory' | 'pipeline' | 'history' | 'conversions'; pipelineFilter?: ProspectPipelineFilter }
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
    const openConclusion = (event: Event) => {
      const interventionId = (event as CustomEvent<{ interventionId?: string }>).detail?.interventionId;
      if (!interventionId) return;
      const run=()=>{setNavigationRequest(value=>value+1);setOperationsSearchTarget({ entityType: 'intervention', entityId: interventionId, focus: 'conclusion' });setActivePage('Interventions & Maintenance');};
      if(activePageRef.current==='Interventions & Maintenance'&&visibleEntity.current?.type==='intervention'&&visibleEntity.current.id===interventionId){cancelSearchNavigation();run();}
      else requestPage('Interventions & Maintenance',run);
    };
    window.addEventListener('atoumweb:open-intervention-conclusion', openConclusion);
    return () => window.removeEventListener('atoumweb:open-intervention-conclusion', openConclusion);
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
    const openLibraryItem = (event: Event) => {void openSearchResult({entityType:'atoumweb_library',entityId:(event as CustomEvent<string>).detail,title:'Bibliothèque'},'event');};
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
    // Le contexte Projet/Devis ne survit pas à une navigation indépendante par le rail.
    setQuoteReturnProjectId(null);
    setProjectReturnContext(null);
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
      case 'catalog': setCatalogTarget(result.entityId); setActivePage('Offres & Tarifs'); break;
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
        openOperationsTargetDirect({ entityType: result.entityType, entityId: result.entityId });
        break;
      case 'client': setCrmTarget(result.entityId); setActivePage('Clients'); break;
      case 'client_document': setDocumentTarget(result.entityId); setActivePage('Documents & Contrats'); break;

      case 'organization':
      case 'contact':
        setDirectoryTarget({ entityType: result.entityType, entityId: result.entityId });
        setActivePage('Annuaire');
        break;
      default: return;
    }

  }

  function navigate(item:PageName){if(item===activePageRef.current){cancelSearchNavigation();return true;}return requestUnsavedExit(()=>{cancelSearchNavigation();visibleEntity.current=null;if(item==='Clients'||item==='Prospects')setCrmTarget(null);navigateDirect(item);});}
  async function openSearchResult(result:SearchResult,source:'search'|'event'='search'):Promise<SearchNavigationResult>{
    const destination=searchDestination(result);
    if(!destination){const message='Type ou identifiant de destination non pris en charge.';setMessage(message);return {status:'unsupported',message};}
    if(visibleEntity.current?.type===result.entityType&&visibleEntity.current.id===result.entityId&&activePageRef.current===destination){cancelSearchNavigation();requestAnimationFrame(()=>{if(visibleEntity.current?.type===result.entityType&&visibleEntity.current.id===result.entityId)document.querySelector<HTMLElement>('[data-search-entity-id="'+CSS.escape(result.entityId)+'"][data-search-entity-type="'+result.entityType+'"]')?.focus({preventScroll:true});});return {status:'opened'};}
    cancelSearchNavigation();const epoch=navigationEpoch.current;
    try {await readSearchTarget(window.atoumweb,result,source==='event');}
    catch(error){if(epoch!==navigationEpoch.current)return {status:'cancelled',cancelledReason:'superseded'};const message=error instanceof Error?error.message:'Fiche inaccessible.';setMessage(message);return {status:'failed',message};}
    if(epoch!==navigationEpoch.current)return {status:'cancelled',cancelledReason:'superseded'};
    return new Promise(resolve=>{
      const allowed=requestUnsavedExit(()=>{
        visibleEntity.current=null;pendingSearch.current={result,resolve};
        if(destination==='Clients'||destination==='Prospects')setCrmTarget(null);
        // Capturer la provenance AVANT de changer la page : un updater React différé
        // ne doit jamais relire activePageRef lorsque cette valeur peut déjà avoir changé.
        const fromProjectQuote = result.entityType === 'quote' && activePageRef.current === 'Projets';
        const sourceContext = fromProjectQuote ? (result as SearchResult & { projectContext?: ProjectReturnContext }).projectContext : null;
        setQuoteReturnProjectId(fromProjectQuote ? result.parentEntityId ?? null : null);
        setProjectReturnContext(previous => {
          if (fromProjectQuote) return result.parentEntityId && sourceContext?.projectId === result.parentEntityId ? sourceContext : null;
          return result.entityType === 'project' && previous?.projectId === result.entityId ? previous : null;
        });
        setNavigationRequest(value=>value+1);openSearchResultDirect(result);
      });
      if(!allowed)resolve({status:'cancelled',cancelledReason:'guard',message:'Navigation annulée ; brouillon et recherche conservés.'});
    });
  }
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
    <div className={`app-shell aw-manager-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${showHoverHelp ? '' : 'help-disabled'}`}>
      <NavigationRail appVersion={bootstrap.appVersion} active={activePage} onNavigate={navigate} store={visualStore} controlsRef={railControls} onCollapsedChange={setSidebarCollapsed} confirmReset={() => window.atoumweb.visualPreferences.confirmReset()}/>
      <main className="main-area">
        <WorkspaceHeader store={visualStore} moduleLabel={activePage === 'Prospects' ? 'Prospection' : activePage} workspaceLabel={(bootstrap.workspacePath.split(/[\\/]/).filter(Boolean).at(-1) ?? bootstrap.workspacePath) + ' · Local'}
          railCollapsed={sidebarCollapsed} onToggleRail={() => railControls.current?.toggle()}
          timer={<GlobalTimer onMessage={setMessage} onDialogChange={setTimerDialogOpen}/>} timerDialogOpen={timerDialogOpen}
          search={close => <GlobalSearch onOpen={openSearchResult} onDismiss={close} onCancelSelection={cancelSearchNavigation} contextKey={activePage}/>} clock={<GlobalClock/>}
          libraryCollapsed={libraryHeaderCollapsed} onToggleLibrary={() => setLibraryHeaderCollapsed(value=>!value)}
          environmentBanner={/([\\/])Validation-MSI$/i.test(bootstrap.workspacePath) ? <div role="status" className="development-environment-banner">DÉVELOPPEMENT — dossiers TEST — aucune valeur contractuelle réelle</div> : undefined}/>



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
          {activePage === 'Prospects' && <ProspectsPage onEntityReady={markEntityReady} key={`${crmTarget ?? 'none'}:${prospectViewTarget}:${prospectPipelineFilter}`} initialId={crmTarget} initialRequest={navigationRequest} initialView={prospectViewTarget} initialPipelineFilter={prospectPipelineFilter} onMessage={setMessage} />}
          {activePage === 'Clients' && <ClientsPage initialRequest={navigationRequest} onEntityReady={markEntityReady} key={crmTarget} initialId={crmTarget} onMessage={setMessage} />}
          {activePage === 'Offres & Tarifs' && <CatalogPage initialRequest={navigationRequest} onEntityReady={markEntityReady} onMessage={setMessage} initialId={catalogTarget}/>}
          {activePage === 'Devis' && <QuotesPage onEntityReady={markEntityReady} key={quoteTarget} initialId={quoteTarget} initialRequest={navigationRequest} returnProjectId={quoteReturnProjectId} onMessage={setMessage} />}
          {activePage === 'Projets' && <ProjectsPage initialRequest={navigationRequest} onEntityReady={markEntityReady} onMessage={showMessage} initialProjectId={projectSearchTarget} returnContext={projectSearchTarget && projectReturnContext?.projectId === projectSearchTarget ? projectReturnContext : null} showHoverHelp={showHoverHelp} />}
          {activePage === 'Interventions & Maintenance' && <OperationsPage initialRequest={navigationRequest} onEntityReady={markEntityReady} onMessage={setMessage} initialTarget={operationsSearchTarget} />}
          {activePage === 'Gestion des temps' && <TimePage onMessage={setMessage} />}
          {activePage === 'Facturation' && <BillingPage onMessage={setMessage} />}
          {activePage === 'Dépenses' && <ExpensesPage onMessage={setMessage} />}
          {activePage === 'Documents & Contrats' && <DocumentsPage initialRequest={navigationRequest} onEntityReady={markEntityReady} onMessage={setMessage} initialDocumentId={documentTarget} initialContractTypeId={contractTypeTarget}/>}
          {activePage === 'Bibliothèque AtoumWeb' && <AtoumWebLibraryPage
            initialRequest={navigationRequest} onEntityReady={markEntityReady}
            onMessage={setMessage}
            initialItemId={librarySearchTarget}
            headerCollapsed={libraryHeaderCollapsed}
          />}
          {activePage === 'Sites' && <BridgeSitesPage onMessage={setMessage} />}
          {activePage === 'Sauvegardes' && <BusinessBackupsPage initialRequest={navigationRequest} onEntityReady={markEntityReady} onMessage={setMessage} initialRecordId={backupSearchTarget} />}
          {activePage === 'Annuaire' && <DirectoryPage initialRequest={navigationRequest} onEntityReady={markEntityReady} onMessage={setMessage} initialTarget={directoryTarget} />}
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
