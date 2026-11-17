import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ProjectClosedLine } from './projects/ProjectNowLine';

/** Lot G2 (décisions de Carlos du 16/11/2026) : F57 prochaine étape, F58 projet terminé, F60 focus de la fiche rapide. */
const read = (file: string) => readFileSync(resolve(__dirname, file), 'utf8');
const prospects = read('crm/ProspectsPageV2.tsx');
const projects = read('projects/ProjectsPage.tsx');
const summary = read('projects/ProjectSummaryTab.tsx');

describe('F57 : la fiche prospect connaît l’état du devis courant', () => {
  it('la fiche rapide et la fiche de travail reçoivent le statut du dernier devis', () => {
    expect((prospects.match(/quoteStatus=\{latestQuotesByProspect\.get\(/g) ?? []).length).toBe(2);
    expect(prospects).toContain('qualificationGaps:qualificationGaps.length,quoteStatus});');
  });

  it('devis envoyé : l’action secondaire devient « Programmer une relance »', () => {
    expect(prospects).toContain("label:nextStep.kind==='record_reply'?'Programmer une relance':'Programmer une action'");
  });
});

describe('F58 : projet terminé', () => {
  const render = (props: Parameters<typeof ProjectClosedLine>[0]) => renderToStaticMarkup(createElement(ProjectClosedLine, props));
  const noop = () => undefined;

  it('bandeau « Projet terminé le… » avec ce qui n’était pas fait à la clôture, sans alerte', () => {
    const html = render({ completedAt: '2026-11-12T10:00:00.000Z', prerequisitesMissing: 4, openTasks: 7, onShowAction: noop, onShowPrerequisites: noop });
    expect(html).toContain('Projet terminé le 12/11/2026');
    expect(html).toContain('Non fait à la clôture');
    expect(html).toContain('4 prérequis');
    expect(html).toContain('7 tâches');
    expect(html).toContain('Le chrono reste possible pour des retouches après livraison.');
    expect(html).not.toContain('manquant');
  });

  it('tout fait à la clôture : une phrase, sans compteur', () => {
    const html = render({ completedAt: null, prerequisitesMissing: 0, openTasks: 0, onShowAction: noop, onShowPrerequisites: noop });
    expect(html).toContain('Projet terminé');
    expect(html).toContain('Tout était fait à la clôture.');
  });

  it('l’en-tête du projet montre ce bandeau à la place de « En ce moment » quand le projet est terminé', () => {
    expect(projects).toContain("{detail.status === 'completed' ? <ProjectClosedLine");
  });

  it('le résumé ne présente plus ces restes comme des alertes', () => {
    expect(summary).toContain("const closed = project.status === 'completed';");
    expect(summary).toContain("label: closed ? 'Tâches non faites à la clôture' : 'Tâches restantes'");
    expect(summary).toContain("missing > 0 && !closed");
  });
});

describe('F60 : focus de la fiche rapide', () => {
  it('à l’ouverture, le focus va au titre de la fiche rapide', () => {
    expect(prospects).toContain("const heading=panelRef.current?.querySelector<HTMLElement>('.detail-panel-heading h2');");
    expect(prospects).toContain('heading.focus({preventScroll:true});');
  });

  it('Échap ferme la fiche rapide (le focus revient sur la ligne, comme avec « Fermer »)', () => {
    expect(prospects).toContain("onKeyDown={event=>{if(event.key==='Escape'&&!event.defaultPrevented){event.preventDefault();onClose();}}}");
    expect(prospects).toContain('tr[data-record-id="${selected?.id}"]');
  });
});
