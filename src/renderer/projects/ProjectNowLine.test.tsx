import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ProjectNowLine } from './ProjectNowLine';

const render = (summary: Parameters<typeof ProjectNowLine>[0]['summary']) =>
  renderToStaticMarkup(createElement(ProjectNowLine, { summary, onShowAction: () => undefined, onShowPrerequisites: () => undefined }));
const base = { blocked: 0, waitingClient: 0, toValidate: 0, prerequisitesMissing: 0, overdue: false, clear: false };

describe('R5a : ligne « En ce moment »', () => {
  it('quand rien ne bloque, elle le dit sans aucun bouton', () => {
    const markup = render({ ...base, clear: true });
    expect(markup).toContain('Rien ne bloque ce projet.');
    expect(markup).not.toContain('<button');
  });

  it('un bouton par compteur non nul, accordé au singulier et au pluriel', () => {
    const markup = render({ ...base, blocked: 1, waitingClient: 2, toValidate: 3, prerequisitesMissing: 1 });
    expect(markup).toContain('1 tâche bloquée');
    expect(markup).toContain('2 attendent le client');
    expect(markup).toContain('3 à valider');
    expect(markup).toContain('1 prérequis manquant');
    expect((markup.match(/<button/g) ?? []).length).toBe(4);
  });

  it('les compteurs à zéro n’apparaissent pas', () => {
    const markup = render({ ...base, blocked: 2 });
    expect(markup).toContain('2 tâches bloquées');
    expect(markup).not.toContain('attend');
    expect(markup).not.toContain('à valider');
    expect(markup).not.toContain('prérequis');
  });

  it('une date cible dépassée est signalée en texte', () => {
    expect(render({ ...base, overdue: true })).toContain('Date cible dépassée');
  });

  it('la ligne est annoncée comme un état (role status)', () => {
    expect(render({ ...base, clear: true })).toContain('role="status"');
  });
});
