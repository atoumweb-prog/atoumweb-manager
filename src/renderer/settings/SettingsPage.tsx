import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { CompanyQuoteSettings } from '../commercial/CompanyQuoteSettings';
import { settingsSectionMatches } from '../../shared/settingsSearch';
import { workspaceDisplayFolder } from '../../shared/workspacePresentation';
import { defaultNavigationPreference, readNavigationPreference, type NavigationPreference } from '../../shared/navigationRail';
import type { VisualPreferenceStore } from '../../shared/panelLayout';
import { clearNavigationFavorites, resetRegisteredModuleLayout, saveRailCollapsed, type SupportedLayoutModule } from '../../shared/settingsNavigation';
import type { BootstrapState, DisplayDensity, ThemeName, DatabaseHealth } from '../../shared/contracts';
import { SETTINGS_SECTION_ORDER, type SettingsSectionKey } from '../../shared/settingsSections';
import { plural } from '../../shared/projectTabs';
import { FieldHelp } from '../ui/FieldHelp';
import { DemoPanel } from '../workflow/DemoPanel';
import './settings-r9.css';

export const THEMES: Array<{ id: ThemeName; label: string; description: string }> = [
  { id: 'atoumweb', label: 'AtoumWeb', description: 'Marine, clair et accent or. Thème par défaut.' },
  { id: 'noir', label: 'Noir', description: 'Interface sombre et neutre.' },
  { id: 'blanc', label: 'Blanc', description: 'Interface claire et minimaliste.' },
];

export const DENSITIES: Array<{ id: DisplayDensity; label: string; description: string }> = [
  { id: 'compact', label: 'Compact', description: 'Plus d’informations visibles avec des espacements resserrés.' },
  { id: 'comfort', label: 'Confort', description: 'Réglage par défaut, équilibré pour le travail quotidien.' },
  { id: 'comfort_plus', label: 'Confort +', description: 'Texte et zones cliquables plus grands pour une lecture facilitée.' },
];

export function SettingsPage({ visualStore, bootstrap, theme, displayDensity, showHoverHelp, onThemeChange, onDensityChange, onShowHoverHelpChange, onChooseWorkspace, onCreateBackup, onRestoreBackup }: {
  visualStore: VisualPreferenceStore;
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
  const [search, setSearch] = useState('');
  const [navigationPreference, setNavigationPreference] = useState<NavigationPreference>(defaultNavigationPreference);
  const [navigationError, setNavigationError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<DatabaseHealth | null>(null);
  const [diagnosticsError, setDiagnosticsError] = useState<string | null>(null);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const diagnosticsLock = useRef(false);
  async function readDiagnostics(): Promise<void> {
    if (diagnosticsLock.current) return;
    diagnosticsLock.current = true;
    setDiagnosticsLoading(true);
    setDiagnosticsError(null);
    try { setDiagnostics(await window.atoumweb.database.health()); }
    catch (cause) {
      setDiagnostics(null);
      setDiagnosticsError(cause instanceof Error ? cause.message : 'Lecture de diagnostic indisponible.');
    } finally { diagnosticsLock.current = false; setDiagnosticsLoading(false); }
  }
  const [resetModuleIntent, setResetModuleIntent] = useState<SupportedLayoutModule | null>(null);
  useEffect(() => {
    const sync = () => {
      try { setNavigationPreference(readNavigationPreference(visualStore)); setNavigationError(null); }
      catch (cause) { setNavigationError(cause instanceof Error ? cause.message : 'Préférences de navigation indisponibles.'); }
    };
    sync();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [visualStore]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const operationLock = useRef(false);
  const visible = (keywords: string) => settingsSectionMatches(search, keywords);

  async function runSetting(action: () => Promise<void>): Promise<void> {
    // Le verrou est synchrone : deux clics dans le même frame ne lancent pas deux écritures.
    if (operationLock.current) return;
    operationLock.current = true;
    setSaving(true);
    setError(null);
    try { await action(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Impossible de modifier ce réglage. Le choix précédent est conservé.'); }
    finally { operationLock.current = false; setSaving(false); }
  }

  const company = visible('entreprise société identité adresse siret tva email téléphone logo devis modèle conditions cgv présentation');
  const appearance = visible('apparence thème thèmes noir blanc atoumweb densité compact confort affichage interface lisibilité');
  const navigation = visible('navigation vues rail favoris modules ordre disposition largeur colonnes liste clients annuaire');
  const help = visible('aide aides conseil survol ? contextuelle clavier');
  const workspace = visible('stockage workspace dossier répertoire emplacement local changement données transfert redémarrage');
  const documents = visible('documents fichiers archivage archives conservation contrats classement clients exports');
  const advanced = visible('avancé diagnostic diagnostics version migration migrations sqlite intégrité base état erreurs');
  const security = visible('sécurité sauvegarde backup restauration restore sqlite base copie sécurité');
  const recette = visible('recette démonstration démo test tests données reset parcours supprimer');
  const searching = Boolean(search.trim());
  const shortcuts = [
    ...(company ? [{ label: 'Mon entreprise et devis', id: 'settings-company-quotes' }] : []),
    ...(appearance ? [{ label: 'Apparence et densité', id: settingsSectionMatches(search, 'densité compact confort lisibilité') ? 'settings-density-compact' : 'settings-theme-atoumweb' }] : []),
    ...(navigation ? [{ label: 'Navigation et vues', id: 'settings-nav-collapse' }] : []),
    ...(help ? [{ label: 'Aide contextuelle', id: 'settings-hover-help' }] : []),
    ...(workspace ? [{ label: 'Workspace local', id: 'settings-choose-workspace' }] : []),
    ...(documents ? [{ label: 'Documents et archivage', id: 'settings-open-documents' }] : []),
    ...(advanced ? [{ label: 'Diagnostics avancés', id: 'settings-read-diagnostics' }] : []),
    ...(security ? [{ label: 'Sauvegarde et sécurité SQLite', id: 'settings-create-backup' }] : []),
    ...(recette ? [{ label: 'Recette (données de test)', id: 'settings-recette' }] : []),
  ];

  const sections: Record<SettingsSectionKey, ReactNode> = {
    company: company ? <CompanyQuoteSettings /> : null,
    appearance: appearance ? (
      <article className="panel panel-large">
        <div className="panel-title"><h2>Thème de l’interface</h2>{theme !== 'atoumweb' && <button className="secondary-button" type="button" disabled={saving} onClick={() => void runSetting(() => onThemeChange('atoumweb'))}>Rétablir le thème par défaut</button>}</div>
        <div className="theme-grid">{THEMES.map((item) => <button className={`theme-card ${theme === item.id ? 'selected' : ''}`} key={item.id} id={item.id === 'atoumweb' ? 'settings-theme-atoumweb' : undefined} disabled={saving} onClick={() => void runSetting(() => onThemeChange(item.id))} type="button" aria-pressed={theme === item.id}><span className={`theme-preview preview-${item.id}`}><i /><b /></span><strong>{item.label}</strong><span>{item.description}</span></button>)}</div>
        <div className="density-settings">
          <div><h2>Densité d’affichage</h2><p className="muted">Taille des textes, espacements et zones cliquables.</p></div>
          <div className="density-grid">{DENSITIES.map((item) => <button className={`density-card ${displayDensity === item.id ? 'selected' : ''}`} key={item.id} id={item.id === 'compact' ? 'settings-density-compact' : undefined} type="button" disabled={saving} aria-pressed={displayDensity === item.id} onClick={() => void runSetting(() => onDensityChange(item.id))}><strong>{item.label}</strong><span>{item.description}</span></button>)}</div>
        </div>
      </article>
    ) : null,
    navigation: navigation || help ? (
      <article className="panel panel-large settings-navigation">
        <h2>Navigation et aide</h2>
        {navigation && <>
          <p className="muted">Préférences enregistrées dans le workspace ; elles ne modifient ni les Clients, ni les devis, ni les documents.</p>
          {navigationError && <p role="status" className="muted">Préférences indisponibles : {navigationError}. Aucune valeur n’est réinitialisée automatiquement.</p>}
          <div className="settings-navigation-actions">
            <div>
              <strong>Rail latéral</strong>
              <p className="muted">{navigationPreference.railCollapsed ? 'Navigation réduite' : 'Navigation déployée'} · {plural(navigationPreference.favoriteModuleKeys.length, 'favori', 'favoris')}.</p>
            </div>
            <button id="settings-nav-collapse" type="button" className="secondary-button" disabled={saving || !!navigationError}
              onClick={() => void runSetting(async () => {
                setNavigationPreference(saveRailCollapsed(visualStore, !navigationPreference.railCollapsed));
              })}>{navigationPreference.railCollapsed ? 'Déployer le rail' : 'Réduire le rail'}</button>
            <button type="button" className="secondary-button" disabled={saving || !!navigationError || navigationPreference.favoriteModuleKeys.length === 0}
              onClick={() => void runSetting(async () => {
                if (window.atoumweb.visualPreferences.confirmReset()) {
                  setNavigationPreference(clearNavigationFavorites(visualStore));
                }
              })}>Réinitialiser uniquement les favoris</button>
          </div>
          <div className="settings-navigation-layouts">
            <strong>Réinitialiser la largeur d’une liste</strong>
            <p className="muted">Seule la disposition de la liste indiquée revient au défaut. Les colonnes, les filtres enregistrés et les brouillons restent inchangés.</p>
            <div className="button-row">
              <button type="button" className="secondary-button" disabled={saving} onClick={() => setResetModuleIntent('clients')}>Largeur liste Clients</button>
              <button type="button" className="secondary-button" disabled={saving} onClick={() => setResetModuleIntent('directory')}>Largeur liste Annuaire</button>
            </div>
            {resetModuleIntent && <div className="settings-navigation-confirm" role="group" aria-label="Confirmation de remise à zéro de la disposition">
              <p>Réinitialiser uniquement la largeur de la liste <strong>{resetModuleIntent === 'clients' ? 'Clients' : 'Annuaire'}</strong> ? Aucune donnée métier ne sera effacée.</p>
              <button type="button" className="primary-button" disabled={saving} onClick={() => void runSetting(async () => {
                resetRegisteredModuleLayout(visualStore, resetModuleIntent);
                setResetModuleIntent(null);
              })}>Confirmer la disposition par défaut</button>
              <button type="button" className="secondary-button" disabled={saving} onClick={() => setResetModuleIntent(null)}>Annuler</button>
            </div>}
          </div>
        </>}
        {help && <div className="settings-help-row">
          <div>
            <strong>Conseils au survol</strong>
            <p className="muted">Le survol prolongé est facultatif. L’aide « ? » au clic/clavier et les avertissements de sécurité restent toujours disponibles.</p>
          </div>
          <label className="settings-switch">
            <input id="settings-hover-help" type="checkbox" checked={showHoverHelp} disabled={saving} onChange={(event) => void runSetting(() => onShowHoverHelpChange(event.target.checked))} />
            <span>{showHoverHelp ? 'Survol activé' : 'Survol désactivé'}</span>
          </label>
        </div>}
      </article>
    ) : null,
    data: workspace || documents || security ? (
      <article className="panel panel-large settings-data">
        <h2>Données et sauvegarde</h2>
        {workspace && <section className="settings-row" aria-label="Dossier de travail">
          <div>
            <strong>Dossier de travail</strong>
            <p className="path-value">{bootstrap.workspacePath}</p>
            <p className="muted">Choisir un autre dossier ne transfère pas les Clients, Projets, documents ni fichiers de ce workspace. Un redémarrage peut être nécessaire.</p>
          </div>
          <button id="settings-choose-workspace" className="secondary-button" type="button" disabled={saving} onClick={() => void runSetting(onChooseWorkspace)}>Choisir un autre dossier</button>
        </section>}
        {documents && <section className="settings-row settings-documents" aria-label="Réglages Documents">
          <div>
            <strong>Documents des clients</strong>
            <p className="muted">Chaque document garde sa catégorie et son motif de conservation ; aucune règle globale ne les supprime automatiquement. Ils s’importent et se classent depuis « Documents & Contrats ».</p>
            <dl className="settings-diagnostic-list">
              <div><dt>Racine du workspace</dt><dd className="path-value">{bootstrap.workspacePath}</dd></div>
              <div><dt>Dossier racine des Clients</dt><dd className="path-value">{workspaceDisplayFolder(bootstrap.workspacePath, 'clients')}</dd></div>
              <div><dt>Exports</dt><dd className="path-value">{workspaceDisplayFolder(bootstrap.workspacePath, 'exports')}</dd></div>
            </dl>
            <p className="muted">Chemins conventionnels issus de la configuration : la présence des fichiers et la conformité légale des durées de conservation ne sont pas contrôlées ici.</p>
          </div>
          <button id="settings-open-documents" className="secondary-button" type="button" onClick={() =>
            window.dispatchEvent(new CustomEvent('atoumweb:open-page', { detail: 'Documents & Contrats' }))
          }>Ouvrir Documents & Contrats</button>
        </section>}
        {security && <section className="settings-row" aria-label="Sauvegarde de la base">
          <div>
            <h3>Sauvegarde de la base Manager</h3>
            <p className="muted">Une sauvegarde de la base SQLite est prévue quotidiennement, avec une copie de sécurité avant restauration. Elle ne sauvegarde ni ne restaure les documents Clients, photos, sites WordPress et fichiers Bridge.</p>
            <p className="muted">Le registre « Sauvegardes » déclare les copies métier : ce n’est pas le moteur de sauvegarde SQLite. La restauration remplace des données et reste soumise aux vérifications de sécurité du moteur.</p>
          </div>
          <div className="button-row"><button id="settings-create-backup" className="secondary-button" type="button" disabled={saving} onClick={() => void runSetting(onCreateBackup)}>Sauvegarder la base maintenant</button><button className="secondary-button" type="button" disabled={saving} onClick={() => void runSetting(onRestoreBackup)}>Restaurer une sauvegarde SQLite</button></div>
        </section>}
      </article>
    ) : null,
    diagnostic: advanced ? (
      <article className="panel panel-large settings-advanced" aria-label="Diagnostics avancés">
        <details open={search.trim() ? true : undefined}>
          <summary>Diagnostic du Manager (lecture seule)</summary>
          <p className="muted">Consultation technique uniquement : aucune migration, restauration, indexation ni suppression de données n’est exécutée ici.</p>
          <dl className="settings-diagnostic-list">
            <div><dt>Version de l’application</dt><dd>{bootstrap.appVersion}</dd></div>
            <div><dt>Base SQLite active</dt><dd className="path-value">{bootstrap.databasePath}</dd></div>
            <div><dt>Migrations appliquées au démarrage</dt><dd>{bootstrap.database.migrationCount}</dd></div>
            <div><dt>État au démarrage</dt><dd>{bootstrap.database.healthy ? 'Signalé sain au démarrage' : 'Anomalie signalée au démarrage'}</dd></div>
            {diagnostics && <>
              <div><dt>État à la dernière lecture</dt><dd>{diagnostics.healthy ? 'Signalé sain par le service' : 'Anomalie signalée par le service'}</dd></div>
              <div><dt>Migrations à la dernière lecture</dt><dd>{diagnostics.migrationCount}</dd></div>
              <div><dt>Chemin confirmé par le service</dt><dd className="path-value">{diagnostics.databasePath}</dd></div>
            </>}
          </dl>
          {diagnosticsError && <p role="alert" className="settings-diagnostic-error">Diagnostic indisponible : {diagnosticsError}. Aucun état sain n’est déduit de cet échec.</p>}
          <button id="settings-read-diagnostics" type="button" className="secondary-button" disabled={diagnosticsLoading} onClick={() => void readDiagnostics()}>{diagnosticsLoading ? 'Lecture en cours…' : 'Actualiser l’état SQLite (lecture seule)'}</button>
          <p className="muted">Ce diagnostic ne remplace ni une vérification d’intégrité SQLite complète ni un test de restauration.</p>
        </details>
      </article>
    ) : null,
    recette: recette ? <DemoPanel open={searching} /> : null,
  };

  return (
    <div className="settings-grid">
      <div className="settings-toolbar">
        <input id="settings-quick-search" className="settings-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un réglage : thème, aide, dossier…" aria-label="Rechercher un réglage" aria-describedby="settings-search-help" />
        <FieldHelp text="Cette recherche filtre uniquement les rubriques visibles ; elle ne modifie aucune préférence." />
        <span id="settings-search-help" hidden>Cette recherche filtre uniquement les rubriques visibles ; elle ne modifie aucune préférence.</span>
        {search.trim() && shortcuts.length > 0 && <nav className="button-row" aria-label="Accès direct aux réglages correspondant à la recherche">
          {shortcuts.map((shortcut) => <button key={shortcut.id} type="button" className="secondary-button" onClick={() => document.getElementById(shortcut.id)?.focus()}>
            Aller à : {shortcut.label}
          </button>)}
        </nav>}
        {error && <p role="alert" className="notice">{error}</p>}
        {!company && !appearance && !navigation && !help && !documents && !advanced && !workspace && !security && !recette && <p role="status">Aucun réglage correspondant. Efface la recherche pour retrouver toutes les rubriques.</p>}
      </div>
      {SETTINGS_SECTION_ORDER.map((key) => <Fragment key={key}>{sections[key]}</Fragment>)}
    </div>
  );
}
