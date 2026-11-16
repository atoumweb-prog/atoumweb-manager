import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/** Lot G3 (décisions de Carlos du 16/11/2026) : F56 un seul jaune par vue, F59 rail replié en fenêtre étroite, F63 Sites en français simple. */
const read = (file: string) => readFileSync(resolve(__dirname, file), 'utf8');
const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

describe('F56 : un seul bouton jaune par vue', () => {
  it('projet, onglet Production : « ▶ Démarrer » passe en secondaire, « Enregistrer la fiche » reste l’action principale', () => {
    expect(read('projects/ProjectsPage.tsx')).toContain('<button className="secondary-button" type="button" disabled={timerBusy} onClick={() => void startNodeTimer()}>▶ Démarrer</button>');
  });

  it('devis accepté : « Ouvrir le projet » est une navigation, en secondaire', () => {
    expect(read('workflow/QuoteWorkflow.tsx')).toContain("<button type=\"button\" className=\"secondary-button\" onClick={()=>openEntity({entityType:'project',entityId:project.id,");
  });

  const deskCss = existsSync(resolve(__dirname, 'crm/prospect-desk-g3.css')) ? strip(read('crm/prospect-desk-g3.css')) : '';
  it('la fiche de travail du prospect charge sa feuille G3', () => {
    expect(read('crm/ProspectsPageV2.tsx')).toContain("import './prospect-desk-g3.css';");
  });

  it('fiche de travail : l’onglet actif n’est plus un bouton jaune plein', () => {
    expect(deskCss).toContain(':root[data-theme][data-density] .app-shell .prospects-v2 .prospect-workspace .prospect-desk-tabs button[aria-selected=true]{background:var(--surface-soft)!important;color:var(--text)!important;-webkit-text-fill-color:var(--text)!important;');
  });

  it('fiche de travail : dans le devis intégré, les actions passent en secondaire (le jaune reste à la prochaine étape)', () => {
    expect(deskCss).toContain(':root[data-theme][data-density] .app-shell .prospect-detail-desk .quotes-embedded .primary-button{background:var(--surface-soft)!important;color:var(--text)!important;-webkit-text-fill-color:var(--text)!important;border-color:var(--border)!important;');
  });

  it('aucune couleur en dur dans la feuille G3', () => {
    expect(deskCss).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i);
  });
});

describe('F59 : rail replié en fenêtre étroite, sans toucher au réglage', () => {
  const rail = read('ui/NavigationRail.tsx');
  it('la largeur étroite est suivie (seuil de la feuille du rail : 760 px)', () => {
    expect(rail).toContain("const NARROW_RAIL_QUERY='(max-width: 760px)';");
    expect(rail).toContain('window.matchMedia(NARROW_RAIL_QUERY)');
  });

  it('en fenêtre étroite, le rail est replié sauf ouverture à la demande', () => {
    expect(rail).toContain('const collapsed=temporary??(narrow?!narrowOpen:preference.railCollapsed);');
  });

  it('le bouton du rail ouvre et ferme sans enregistrer de réglage en fenêtre étroite', () => {
    expect(rail).toContain('if(narrow){setNarrowOpen(value=>!value);setTemporary(null);setOpenGroup(null);return;}');
  });

  it('le rail ouvert à la demande se referme après un choix de page', () => {
    expect(rail).toContain('useEffect(()=>{setNarrowOpen(false);},[active]);');
  });
});

describe('F63 : Sites en français simple (libellés seulement)', () => {
  const sites = read('bridge/BridgeSitesPage.tsx');
  it.each([
    'Importer un snapshot Bridge', 'lance le diff', 'selon Snapshot V1', 'Snapshots en lecture seule', 'Le snapshot reste',
    'Impossible de charger ce snapshot', 'Le snapshot Bridge ne peut', 'Ce snapshot Bridge était', 'Snapshot Bridge importé',
    'Comparaison des snapshots', 'deux snapshots', 'un « snapshot »', 'depuis le snapshot Bridge', 'Module du snapshot', 'joint au snapshot', 'pour ce snapshot',
  ])('plus de « %s »', (old) => {
    expect(sites).not.toContain(old);
  });

  it('les nouveaux libellés', () => {
    expect(sites).toContain('Importer une copie depuis le Bridge');
    expect(sites).toContain('Choisis les deux copies puis lance la comparaison. Rien n’est modifié dans les copies.');
    expect(sites).toContain('Les deux copies ont le même contenu visible.');
  });
});
