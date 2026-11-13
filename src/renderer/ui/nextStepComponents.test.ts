import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MoreMenu } from './MoreMenu';
import { NextStepCard } from './NextStepCard';
import { RecordHeader } from './RecordHeader';
import { StatusPill, toneOrNeutral } from './StatusPill';

const html = (element: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(element);

describe('StatusPill', () => {
  it('always shows its label, with the tone as a class', () => {
    const markup = html(createElement(StatusPill, { tone: 'success', children: 'Devis accepté' }));
    expect(markup).toContain('aw-status-pill--success');
    expect(markup).toContain('Devis accepté');
  });

  it('falls back to neutral for an unknown tone', () => {
    expect(toneOrNeutral('inconnu')).toBe('neutral');
    expect(toneOrNeutral(undefined)).toBe('neutral');
    expect(toneOrNeutral('danger')).toBe('danger');
    expect(html(createElement(StatusPill, { tone: 'inconnu' as never, children: 'Brouillon' }))).toContain('aw-status-pill--neutral');
  });
});

describe('NextStepCard', () => {
  const base = {
    title: 'Relancer le devis DEV-2026-012 (J+7, le 20/11)',
    reason: 'Le silence du client ne vaut jamais accord.',
    primary: { label: 'Relance faite', onAction: () => undefined },
    secondary: [{ label: 'Le client a accepté', onAction: () => undefined }],
  };

  it('names itself « Prochaine étape » and shows the title, the reason and the actions', () => {
    const markup = html(createElement(NextStepCard, base));
    expect(markup).toContain('aria-label="Prochaine étape"');
    expect(markup).toContain('Prochaine étape');
    expect(markup).toContain('Relancer le devis DEV-2026-012 (J+7, le 20/11)');
    expect(markup).toContain('Le silence du client ne vaut jamais accord.');
    expect(markup).toContain('Relance faite');
    expect(markup).toContain('Le client a accepté');
  });

  it('uses AppButton variants : primary for the main action, secondary for the others', () => {
    const markup = html(createElement(NextStepCard, base));
    expect(markup).toContain('aw-ui-button--primary');
    expect(markup).toContain('aw-ui-button--secondary');
  });

  it('puts the label inline before the title, never as a kicker above it', () => {
    const markup = html(createElement(NextStepCard, base));
    expect(markup).not.toContain('eyebrow');
    expect(markup).toMatch(/<h3[^>]*>[^<]*<span class="aw-next-step-prefix">Prochaine étape<\/span>/);
  });

  it('renders alerts with a role and a tone, text included', () => {
    const markup = html(createElement(NextStepCard, { ...base, alerts: [{ tone: 'danger', text: 'Convention de médiation non conclue : envoi bloqué.' }] }));
    expect(markup).toContain('role="status"');
    expect(markup).toContain('aw-next-step-alert--danger');
    expect(markup).toContain('Convention de médiation non conclue : envoi bloqué.');
  });

  it('works without any action or reason', () => {
    const markup = html(createElement(NextStepCard, { title: 'Échéancier à définir' }));
    expect(markup).toContain('Échéancier à définir');
    expect(markup).not.toContain('aw-next-step-actions');
  });
});

describe('MoreMenu', () => {
  const items = [{ id: 'archiver', label: 'Archiver' }, { id: 'perdu', label: 'Classer comme perdu', danger: true }, { id: 'x', label: 'Désactivé', disabled: true }];

  it('shows only the trigger when closed, with the menu semantics', () => {
    const markup = html(createElement(MoreMenu, { items, onSelect: () => undefined }));
    expect(markup).toContain('Plus');
    expect(markup).toContain('aria-haspopup="menu"');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).not.toContain('role="menu"');
  });

  it('shows the items when open, marks danger and disabled ones', () => {
    const markup = html(createElement(MoreMenu, { items, onSelect: () => undefined, initialOpen: true }));
    expect(markup).toContain('aria-expanded="true"');
    expect(markup).toContain('role="menu"');
    expect(markup.match(/role="menuitem"/g)).toHaveLength(3);
    expect(markup).toContain('aw-more-menu-item--danger');
    expect(markup).toMatch(/role="menuitem"[^>]*disabled/);
  });

  it('accepts another label than « Plus »', () => {
    expect(html(createElement(MoreMenu, { items, onSelect: () => undefined, label: 'Autres actions' }))).toContain('Autres actions');
  });
});

describe('RecordHeader', () => {
  it('shows the title, the subtitle, the status pill and the « Plus » menu', () => {
    const markup = html(createElement(RecordHeader, {
      title: 'TEST - Boulangerie du Lac',
      subtitle: 'Professionnel · camille@exemple.test',
      status: { label: 'Devis envoyé le 13/11', tone: 'info' },
      moreItems: [{ id: 'archiver', label: 'Archiver' }],
      onMore: () => undefined,
    }));
    expect(markup).toContain('TEST - Boulangerie du Lac');
    expect(markup).toContain('Professionnel · camille@exemple.test');
    expect(markup).toContain('aw-status-pill--info');
    expect(markup).toContain('Plus');
  });

  it('hosts the « Prochaine étape » block under the header', () => {
    const next = createElement(NextStepCard, { title: 'Relancer le devis' });
    const markup = html(createElement(RecordHeader, { title: 'Dossier' }, next));
    expect(markup).toContain('aw-record-header-next');
    expect(markup.indexOf('Dossier')).toBeLessThan(markup.indexOf('Relancer le devis'));
  });

  it('omits the « Plus » menu when there is nothing in it', () => {
    expect(html(createElement(RecordHeader, { title: 'Dossier' }))).not.toContain('aw-more-menu');
  });
});
