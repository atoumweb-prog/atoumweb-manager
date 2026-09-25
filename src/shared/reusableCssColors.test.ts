import { describe, expect, it } from 'vitest';
import { generalizeReusableCssColors } from './reusableCssColors';

describe('generalizeReusableCssColors', () => {
  it('expose les couleurs hex solides comme variables CSS configurables', () => {
    const result = generalizeReusableCssColors(
      '.atoum-card { color: #071B3A; background: #D88972; border-color: #071b3a; }',
      ['atoum-card'],
    );

    expect(result.fields).toHaveLength(2);
    expect(result.fields[0]).toMatchObject({
      id: 'color-1',
      type: 'color',
      defaultValue: '#071b3a',
      binding: {
        type: 'css_variable',
        name: '--aw-atoum-card-color-1',
        selector: '.atoum-card',
      },
    });
    expect(result.css).toContain('--aw-atoum-card-color-1: #071b3a;');
    expect(result.css).toContain('--aw-atoum-card-color-2: #d88972;');
    expect(result.css).toContain('color: var(--aw-atoum-card-color-1)');
    expect(result.css).toContain('background: var(--aw-atoum-card-color-2)');
    expect(result.css).toContain('border-color: var(--aw-atoum-card-color-1)');
  });

  it('préserve les commentaires contenant une syntaxe qui ressemble à une couleur', () => {
    const result = generalizeReusableCssColors(
      '/* color: #123456; */\n.atoum-card {\n  color: #071b3a;\n  background: #d88972;\n}',
      ['atoum-card'],
    );

    expect(result.fields).toHaveLength(2);
    expect(result.css).toContain('/* color: #123456; */');
    expect(result.css).toContain('color: var(--aw-atoum-card-color-1)');
    expect(result.css).toContain('background: var(--aw-atoum-card-color-2)');
  });

  it('ne transforme pas les couleurs rgba', () => {
    const result = generalizeReusableCssColors(
      '.atoum-card { box-shadow: 0 10px 20px rgba(7, 27, 58, 0.08); color: #071b3a; }',
      ['atoum-card'],
    );

    expect(result.fields).toHaveLength(1);
    expect(result.css).toContain('rgba(7, 27, 58, 0.08)');
  });

  it('ne confond pas un sélecteur ID hexadécimal avec une couleur', () => {
    const result = generalizeReusableCssColors(
      '#abcdef { color: #ffffff; }',
      ['atoum-card'],
    );

    expect(result.fields).toHaveLength(1);
    expect(result.css).toContain('#abcdef {');
    expect(result.css).toContain('color: var(--aw-atoum-card-color-1)');
  });

  it('ne modifie rien sans classe racine sûre', () => {
    const css = '.card { color: #071b3a; }';
    const result = generalizeReusableCssColors(css, []);

    expect(result.css).toBe(css);
    expect(result.fields).toEqual([]);
  });

  it('limite le nombre de couleurs exposées', () => {
    const result = generalizeReusableCssColors(
      '.atoum-card { color:#000001; background:#000002; border-color:#000003; outline-color:#000004; }',
      ['atoum-card'],
      2,
    );

    expect(result.fields).toHaveLength(2);
    expect(result.css).toContain('#000003');
    expect(result.css).toContain('#000004');
  });
});
