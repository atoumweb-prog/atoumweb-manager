import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DISPLAY_NOTICE_MS, noticeTimeout } from './noticeLifetime';

describe('durée de vie d’une notice', () => {
  it('une notice avec une action ne se ferme jamais seule', () => {
    expect(noticeTimeout({ hasAction: true, autoDismissMs: 8000 })).toBeNull();
  });

  it('sans échéance demandée, la notice reste (erreurs comprises)', () => {
    expect(noticeTimeout({ hasAction: false })).toBeNull();
    expect(noticeTimeout({ hasAction: false, autoDismissMs: 0 })).toBeNull();
    expect(noticeTimeout({ hasAction: false, autoDismissMs: -5 })).toBeNull();
  });

  it('avec une échéance demandée et sans action, la notice se ferme à l’échéance', () => {
    expect(noticeTimeout({ hasAction: false, autoDismissMs: 8000 })).toBe(8000);
    expect(DISPLAY_NOTICE_MS).toBe(8000);
  });
});

describe('App : notices de thème et de densité', () => {
  const app = readFileSync(resolve(__dirname, '..', 'App.tsx'), 'utf8');

  it('se ferment seules, les autres messages restent', () => {
    expect(app).toMatch(/showMessage\(`Thème « [^`]*appliqué\.`, undefined, \{ autoDismissMs: DISPLAY_NOTICE_MS \}\)/);
    expect(app).toMatch(/showMessage\(`Affichage « [^`]*appliqué\.`, undefined, \{ autoDismissMs: DISPLAY_NOTICE_MS \}\)/);
    expect((app.match(/autoDismissMs: DISPLAY_NOTICE_MS/g) ?? []).length).toBe(2);
  });
});
