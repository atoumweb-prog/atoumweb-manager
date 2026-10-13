import { useEffect, useMemo, useRef, useState } from 'react';
import { THEME_NAMES, DISPLAY_DENSITIES, type BootstrapState, type ThemeName, type DisplayDensity } from '../../shared/contracts';
import type { VisualPreferenceStore } from '../../shared/panelLayout';
import { TableWorkshop } from './TableWorkshop';
import { FormFeedbackWorkshop } from './FormFeedbackWorkshop';
import { FieldHelp } from './FieldHelp';
import { AppButton } from './AppButton';
import { AppNotice } from './AppNotice';
import { installUnsavedLifecycleBridge } from '../unsaved/unsaved';
import './foundation-workshop.css';

export interface FoundationPreferencesBridge {
  getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void;
  resetDispositions(): void;
  subscribe?: (listener: (key: string | null) => void) => () => void;
}
/** Standalone fixture entry only. No registration in App.tsx or production preload. */
export function FoundationWorkshop({ preferences }: { preferences: FoundationPreferencesBridge }) {
  const [appearance, setAppearance] = useState<BootstrapState | null>(null), [error, setError] = useState(''), [pending, setPending] = useState(false), [confirmed, setConfirmed] = useState('');
  const [tab, setTab] = useState('table'), lock = useRef(false), mounted = useRef(true), appearanceRevision = useRef(0);
  const store: VisualPreferenceStore = useMemo(() => preferences, [preferences]);
  useEffect(() => installUnsavedLifecycleBridge(), []);
  useEffect(() => preferences.subscribe?.(key => {
    if (key === 'appearance') {
      const revision = ++appearanceRevision.current;
      void window.atoumweb.app.getBootstrap().then(value => { if (mounted.current && revision === appearanceRevision.current) setAppearance(value); }).catch(() => { if (mounted.current && revision === appearanceRevision.current) setError('Apparence externe non chargée.'); });
    }
    else window.dispatchEvent(new StorageEvent('storage', {key}));
  }), [preferences]);
  useEffect(() => { mounted.current = true; const revision = ++appearanceRevision.current; void window.atoumweb.app.getBootstrap().then(value => { if (mounted.current && revision === appearanceRevision.current) setAppearance(value); }).catch(() => { if (mounted.current && revision === appearanceRevision.current) setError('Apparence non chargée.'); }); return () => { mounted.current = false; appearanceRevision.current++; }; }, []);
  useEffect(() => { if (!appearance) return; document.documentElement.dataset.theme = appearance.theme; document.documentElement.dataset.density = appearance.displayDensity; document.documentElement.classList.toggle('help-disabled', !appearance.showHoverHelp); }, [appearance]);
  async function changeAppearance(kind: 'theme' | 'displayDensity' | 'showHoverHelp', value: ThemeName | DisplayDensity | boolean) {
    if (!appearance || lock.current) return; lock.current = true; setPending(true); setConfirmed(''); setError('');
    const revision = ++appearanceRevision.current;
    try {
      const confirmedValue = kind === 'theme' ? await window.atoumweb.settings.setTheme(value as ThemeName) : kind === 'displayDensity' ? await window.atoumweb.settings.setDisplayDensity(value as DisplayDensity) : await window.atoumweb.settings.setShowHoverHelp(value as boolean);
      if (mounted.current) { if (revision === appearanceRevision.current) setAppearance(current => current ? { ...current, [kind]: confirmedValue } : current); setConfirmed('Préférence visuelle confirmée.'); }
    } catch { if (mounted.current) setError('Préférence visuelle non enregistrée. La valeur confirmée et les brouillons sont conservés.'); }
    finally { lock.current = false; if (mounted.current) setPending(false); }
  }
  function resetDispositions() {
    try { preferences.resetDispositions();
      // Same event path as existing 01C storage listeners; no editor remount or draft reset.
      window.dispatchEvent(new StorageEvent('storage', {key:null}));
      setConfirmed('Dispositions réinitialisées. Les données et l’apparence sont conservées.'); setError('');
    } catch { setError('Dispositions non réinitialisées ; aucun succès annoncé.'); }
  }
  return <section className="aw-foundation-workshop"><h1>Atelier 01F — fondations isolées</h1>
    <AppNotice level="warning">Données synthétiques en mémoire. Seules les préférences visuelles sont persistées dans la base de recette TEMP.</AppNotice>
    <section className="aw-foundation-settings" aria-label="Apparence persistée">
      <label>Thème<select id="foundation-theme" disabled={!appearance || pending} value={appearance?.theme ?? 'atoumweb'} onChange={e => void changeAppearance('theme', e.target.value as ThemeName)}>{THEME_NAMES.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Densité<select id="foundation-density" disabled={!appearance || pending} value={appearance?.displayDensity ?? 'comfort'} onChange={e => void changeAppearance('displayDensity', e.target.value as DisplayDensity)}>{DISPLAY_DENSITIES.map(value => <option key={value}>{value}</option>)}</select></label>
      <label><input id="foundation-help" disabled={!appearance || pending} type="checkbox" checked={appearance?.showHoverHelp ?? true} onChange={e => void changeAppearance('showHoverHelp', e.target.checked)}/>Aide automatique</label><FieldHelp text="Aide explicite disponible." detail="Désactiver le survol ne masque pas le bouton d’aide au clic ou au clavier."/>
      <AppButton onAction={resetDispositions}>Réinitialiser toutes les dispositions</AppButton>
    </section>
    {error && <AppNotice level="error"><span id="foundation-error">{error}</span></AppNotice>}
    {confirmed && !error && <p id="foundation-confirmed" role="status">{confirmed}</p>}
    <nav className="aw-foundation-tabs" aria-label="Ateliers du socle"><AppButton aria-pressed={tab === 'table'} onAction={() => setTab('table')}>Tableau et fiche</AppButton><AppButton aria-pressed={tab === 'forms'} onAction={() => setTab('forms')}>Formulaires et états</AppButton></nav>
    <div hidden={tab !== 'table'}><TableWorkshop store={store} manageLifecycle={false} active={tab === 'table'}/></div>
    <div hidden={tab !== 'forms'}><FormFeedbackWorkshop manageLifecycle={false} active={tab === 'forms'}/></div>
  </section>;
}
