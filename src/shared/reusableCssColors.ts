export interface GeneratedCssColorField {
  id: string;
  label: string;
  type: 'color';
  selector: string;
  originalValue: string;
  defaultValue: string;
  group: 'Couleurs';
  required: false;
  binding: {
    type: 'css_variable';
    name: string;
    selector: string;
  };
  sourceMode: 'auto_detected';
}

export interface GeneralizedCssColorsResult {
  css: string;
  fields: GeneratedCssColorField[];
  generalized: boolean;
}

const HEX_COLOR_RE = /#[0-9a-fA-F]{6}\b/g;
const DECLARATION_RE = /(^\s*|[;{]\s*)([-A-Za-z][A-Za-z0-9_-]*)\s*:\s*([^;{}]+)(?=;|})/gm;

export function generalizeReusableCssColors(
  css: string,
  rootClasses: string[],
  maxFields = 12,
): GeneralizedCssColorsResult {
  if (!css.trim()) return { css, fields: [], generalized: true };

  const rootClass = rootClasses
    .map((value) => value.trim())
    .find((value) => /^[A-Za-z_][A-Za-z0-9_-]*$/.test(value));

  if (!rootClass) return { css, fields: [], generalized: true };

  const selector = `.${rootClass}`;
  const slug = rootClass.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'component';
  const colors: string[] = [];

  const rewriteDeclarations = (segment: string): string => segment.replace(
    DECLARATION_RE,
    (whole, prefix: string, property: string, rawValue: string) => {
      if (property.startsWith('--')) return whole;

      const nextValue = rawValue.replace(HEX_COLOR_RE, (matched: string) => {
        const normalized = matched.toLowerCase();
        let index = colors.indexOf(normalized);
        if (index < 0) {
          if (colors.length >= maxFields) return matched;
          colors.push(normalized);
          index = colors.length - 1;
        }
        return `var(--aw-${slug}-color-${index + 1})`;
      });

      return `${prefix}${property}: ${nextValue}`;
    },
  );

  const rewritten = css
    .split(/(\/\*[\s\S]*?\*\/)/g)
    .map((segment) => segment.startsWith('/*') ? segment : rewriteDeclarations(segment))
    .join('');

  if (!colors.length) return { css, fields: [], generalized: true };

  const declarations = colors
    .map((color, index) => `  --aw-${slug}-color-${index + 1}: ${color};`)
    .join('\n');
  const variablesBlock = `${selector} {\n${declarations}\n}\n\n`;

  const fields: GeneratedCssColorField[] = colors.map((color, index) => ({
    id: `color-${index + 1}`,
    label: `Couleur ${index + 1}`,
    type: 'color',
    selector,
    originalValue: color,
    defaultValue: color,
    group: 'Couleurs',
    required: false,
    binding: {
      type: 'css_variable',
      name: `--aw-${slug}-color-${index + 1}`,
      selector,
    },
    sourceMode: 'auto_detected',
  }));

  return {
    css: variablesBlock + rewritten,
    fields,
    generalized: true,
  };
}
