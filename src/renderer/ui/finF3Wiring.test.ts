import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/** Fin de refonte, lot F3 : logo lisible en Blanc, Noir au premier lancement (décision de Carlos du 15/11/2026). */
const read = (relative: string) => readFileSync(resolve(__dirname, '..', relative), 'utf8');
const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

describe('F3 : logo lisible sur le rail clair du thème Blanc', () => {
  it('les éléments blanc cassé du logo (mot « Atoum », triangle intérieur) portent la classe d’encre', () => {
    const mark = read('ui/BrandMark.tsx');
    expect((mark.match(/className="aw-brand-ink" fill="#f7f7f4"/g) ?? []).length).toBe(2);
  });

  it('en Blanc, l’encre du logo prend la couleur du texte du thème', () => {
    expect(strip(read('ui/navigation-rail.css'))).toContain(":root[data-theme='blanc'] .aw-brand-ink{fill:var(--text)}");
  });
});

describe('F3 : le Manager s’ouvre en Noir au premier lancement', () => {
  it('le réglage initial de la base est « noir »', () => {
    expect(readFileSync(resolve(__dirname, '../../main/database/DatabaseService.ts'), 'utf8')).toContain("this.setSettingIfMissing('theme', 'noir');");
  });

  it('l’interface démarre en Noir avant de lire le réglage (pas de flash d’un autre thème)', () => {
    expect(read('App.tsx')).toContain("useState<ThemeName>('noir')");
  });
});

/** Contraste WCAG entre deux couleurs hexadécimales #rrggbb. */
const ratio = (a: string, b: string) => {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const v = parseInt(hex.slice(i, i + 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const themeTokens = (theme: 'blanc' | 'atoumweb') => {
  const css = strip(read('styles.css'));
  const block = theme === 'atoumweb' ? css.match(/:root,\s*:root\[data-theme='atoumweb'\]\s*\{([^}]*)\}/)![1] : css.match(/:root\[data-theme='blanc'\]\s*\{([^}]*)\}/)![1];
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2].toLowerCase()]));
};

describe('F3 : texte atténué lisible en Blanc et AtoumWeb (≥ 4,5:1)', () => {
  for (const theme of ['blanc', 'atoumweb'] as const) {
    it(`en ${theme}, --muted atteint 4,5:1 sur le fond, les surfaces et le fond d’accent`, () => {
      const t = themeTokens(theme);
      for (const bg of ['canvas', 'surface', 'surface-soft', 'accent-soft']) expect(ratio(t.muted, t[bg]), `${theme} muted / ${bg}`).toBeGreaterThanOrEqual(4.5);
    });
  }

  it('en AtoumWeb, les titres de groupe du rail sombre prennent la couleur atténuée du rail', () => {
    const t = themeTokens('atoumweb');
    expect(strip(read('ui/navigation-rail.css'))).toContain(":root[data-theme='atoumweb'] .aw-manager-shell .aw-rail-group-heading{color:var(--sidebar-muted)}");
    expect(ratio(t['sidebar-muted'], t.sidebar)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('F3 : pastilles de facturation et de dépenses sur les jetons sémantiques', () => {
  const tone = (file: string, selector: string) => {
    const css = strip(read(file));
    const at = css.indexOf(selector + ' {');
    expect(at, selector).toBeGreaterThan(-1);
    return css.slice(at, css.indexOf('}', at));
  };
  it.each([
    ['billing.css', '.billing-status.status-planned', 'warning'],
    ['billing.css', '.billing-status.status-offered', 'accent'],
    ['billing.css', '.billing-status.status-cancelled', 'danger'],
    ['billing.css', '.billing-source-pill', 'accent'],
    ['expenses.css', '.expense-status.status-planned', 'info'],
    ['expenses.css', '.expense-status.status-committed', 'warning'],
    ['expenses.css', '.expense-status.status-cancelled', 'danger'],
  ])('%s %s utilise le ton %s', (file, selector, name) => {
    const rule = tone(file, selector);
    expect(rule).toContain(`color: var(--aw-${name}-soft-fg)`);
    expect(rule).toContain(`background: var(--aw-${name}-soft-bg)`);
  });
});

describe('F3 : l’or lisible comme texte et sous le texte du bouton principal', () => {
  const onSolid = (theme: 'blanc' | 'atoumweb') => {
    const css = strip(read('tokens.css'));
    const block = theme === 'atoumweb' ? css.match(/:root,\s*:root\[data-theme='atoumweb'\]\s*\{([^}]*)\}/)![1] : css.match(/:root\[data-theme='blanc'\]\s*\{([^}]*)\}/)![1];
    return /--aw-accent-on-solid:\s*(#[0-9a-f]{6})/i.exec(block)![1];
  };
  for (const theme of ['blanc', 'atoumweb'] as const) {
    it(`en ${theme}, --accent et --accent-strong atteignent 4,5:1 sur le fond et les surfaces`, () => {
      const t = themeTokens(theme);
      for (const fg of ['accent', 'accent-strong']) for (const bg of ['canvas', 'surface', 'surface-soft']) expect(ratio(t[fg], t[bg]), `${theme} ${fg} / ${bg}`).toBeGreaterThanOrEqual(4.5);
    });
    it(`en ${theme}, le texte du bouton principal atteint 4,5:1 sur --accent-strong`, () => {
      expect(ratio(onSolid(theme), themeTokens(theme)['accent-strong'])).toBeGreaterThanOrEqual(4.5);
    });
  }

  it('hors Noir, l’échéance dépassée prend le ton danger et l’aide de champ n’est plus estompée', () => {
    const pilot = strip(read('crm/prospection-directory-pilot.css'));
    expect(pilot).toContain(":root:not([data-theme='noir']) .app-shell .prospects-v2 .prospection-due-overdue{color:var(--aw-danger-soft-fg)}");
    expect(strip(read('workflow.css'))).toContain(":root:not([data-theme='noir']) .field-help{opacity:1}");
  });
});

describe('F3 : pastilles de relation (Annuaire) et de statut client lisibles hors Noir', () => {
  it('les quatre relations de l’Annuaire mélangent leur teinte à 50 % avec le texte hors Noir', () => {
    const css = strip(read('directory/DirectoryPage.css'));
    for (const [relation, hue] of [['client', '#48b77d'], ['prospect', '#5c93dd'], ['client-prospect', '#9b72d3'], ['external', '#d2a24b']]) {
      expect(css).toContain(`:root:not([data-theme='noir']) .directory-relation-pill.relation-${relation}{color:color-mix(in srgb,${hue} 50%,var(--text))}`);
    }
  });

  it('les statuts client actif et archivé prennent les tons succès et alerte hors Noir', () => {
    const css = strip(read('crm.css'));
    expect(css).toContain(":root:not([data-theme='noir']) .client-status.status-active{color:var(--aw-success-soft-fg)}");
    expect(css).toContain(":root:not([data-theme='noir']) .client-status.status-archived{color:var(--aw-warning-soft-fg)}");
  });
});

describe('F77 : logo du Manager visible quel que soit le thème (accord de Carlos du 16/11/2026)', () => {
  it('les parties jaunes du logo vectoriel portent la classe d’or (deux formes, « Web », « MANAGER »)', () => {
    const mark = read('ui/BrandMark.tsx');
    expect((mark.match(/className="aw-brand-gold"[^>]*fill="#ffda00"/g) ?? []).length).toBe(4);
  });

  it('en Blanc, l’or du logo prend l’or foncé du thème, lisible sur le rail blanc', () => {
    expect(strip(read('ui/navigation-rail.css'))).toContain(":root[data-theme='blanc'] .aw-brand-gold{fill:var(--accent)}");
    const t = themeTokens('blanc');
    expect(ratio(t.accent, t.sidebar)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t.text, t.sidebar)).toBeGreaterThanOrEqual(4.5);
  });

  it('sur les rails sombres (Noir, AtoumWeb), le jaune et le blanc cassé du logo restent lisibles', () => {
    for (const sidebar of ['#080a0d', themeTokens('atoumweb').sidebar]) {
      expect(ratio('#ffda00', sidebar)).toBeGreaterThanOrEqual(4.5);
      expect(ratio('#f7f7f4', sidebar)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
