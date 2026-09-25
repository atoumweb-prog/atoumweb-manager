export const ATOUMWEB_COMPONENT_FIELD_TYPES = [
  'text',
  'textarea',
  'rich_text',
  'url',
  'image',
  'color',
  'number',
  'select',
  'toggle',
  'icon',
] as const;

export type AtoumWebComponentFieldType = typeof ATOUMWEB_COMPONENT_FIELD_TYPES[number];

export type AtoumWebComponentFieldBinding =
  | { type: 'html_text'; selector: string }
  | { type: 'html_html'; selector: string }
  | { type: 'html_attribute'; selector: string; attribute: string }
  | { type: 'css_variable'; name: string; selector?: string | null }
  | { type: 'css_url'; token: string }
  | { type: 'unresolved'; reason: string };

export interface AtoumWebComponentFieldOption {
  value: string;
  label: string;
}

export interface AtoumWebComponentFieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  allowedMimeTypes?: string[];
}

export interface AtoumWebComponentFieldSource {
  mode: 'declared' | 'auto_detected';
  confidence?: 'high' | 'medium' | 'low';
  ambiguous?: boolean;
  note?: string | null;
}

export interface AtoumWebComponentField {
  id: string;
  type: AtoumWebComponentFieldType;
  label: string;
  description?: string | null;
  group?: string | null;
  default: string | number | boolean | null;
  required: boolean;
  binding: AtoumWebComponentFieldBinding;
  validation?: AtoumWebComponentFieldValidation | null;
  options?: AtoumWebComponentFieldOption[] | null;
  source: AtoumWebComponentFieldSource;
}

export interface AtoumWebComponentFieldsV1 {
  contract: 'atoumweb_component_fields';
  schemaVersion: 1;
  fields: AtoumWebComponentField[];
}

interface LegacyField {
  id?: unknown;
  type?: unknown;
  label?: unknown;
  selector?: unknown;
  originalValue?: unknown;
  defaultValue?: unknown;
}

export function canonicalizeComponentFields(fields: unknown): AtoumWebComponentFieldsV1 {
  const input = Array.isArray(fields) ? fields : [];
  return {
    contract: 'atoumweb_component_fields',
    schemaVersion: 1,
    fields: input.flatMap((entry, index) => canonicalizeField(entry, index)),
  };
}

function canonicalizeField(value: unknown, index: number): AtoumWebComponentField[] {
  if (!value || typeof value !== 'object') return [];
  const raw = value as Record<string, unknown>;

  if (isCanonicalField(raw)) {
    return [{
      id: raw.id,
      type: raw.type,
      label: raw.label,
      description: typeof raw.description === 'string' ? raw.description : null,
      group: typeof raw.group === 'string' ? raw.group : null,
      default: canonicalDefault(raw.default),
      required: raw.required === true,
      binding: canonicalBinding(raw.binding),
      validation: canonicalValidation(raw.validation),
      options: canonicalOptions(raw.options),
      source: canonicalSource(raw.source),
    }];
  }

  return [legacyFieldToCanonical(raw as LegacyField, index)];
}

function isCanonicalField(value: Record<string, unknown>): value is Record<string, unknown> & {
  id: string;
  type: AtoumWebComponentFieldType;
  label: string;
} {
  return typeof value.id === 'string'
    && typeof value.label === 'string'
    && typeof value.type === 'string'
    && (ATOUMWEB_COMPONENT_FIELD_TYPES as readonly string[]).includes(value.type);
}

function legacyFieldToCanonical(field: LegacyField, index: number): AtoumWebComponentField {
  const legacyType = typeof field.type === 'string' ? field.type : 'text';
  const id = typeof field.id === 'string' && field.id.trim() ? field.id : `field-${index + 1}`;
  const selector = typeof field.selector === 'string' ? field.selector : '';
  const label = typeof field.label === 'string' && field.label.trim() ? field.label : `Champ ${index + 1}`;
  const originalValue = typeof field.originalValue === 'string' ? field.originalValue : '';
  const defaultValue = typeof field.defaultValue === 'string' ? field.defaultValue : originalValue;

  if (legacyType === 'link') {
    return {
      id,
      type: 'url',
      label,
      group: 'Liens',
      default: defaultValue,
      required: false,
      binding: selector
        ? { type: 'html_attribute', selector, attribute: 'href' }
        : { type: 'unresolved', reason: 'Ancien champ lien sans sélecteur exploitable.' },
      source: { mode: 'auto_detected', confidence: selector ? 'high' : 'low', ambiguous: !selector },
    };
  }

  if (legacyType === 'image') {
    if (selector.startsWith('css:url:')) {
      return {
        id,
        type: 'image',
        label,
        group: 'Images',
        default: defaultValue,
        required: false,
        binding: { type: 'css_url', token: selector.slice('css:url:'.length) || id },
        source: {
          mode: 'auto_detected',
          confidence: 'medium',
          ambiguous: true,
          note: 'Image détectée dans le CSS historique : Bridge doit confirmer la cible avant modification automatique.',
        },
      };
    }
    return {
      id,
      type: 'image',
      label,
      group: 'Images',
      default: defaultValue,
      required: false,
      binding: selector
        ? { type: 'html_attribute', selector, attribute: 'src' }
        : { type: 'unresolved', reason: 'Ancien champ image sans sélecteur exploitable.' },
      source: { mode: 'auto_detected', confidence: selector ? 'high' : 'low', ambiguous: !selector },
    };
  }

  return {
    id,
    type: 'text',
    label,
    group: /^titre\b/i.test(label) ? 'Contenu · Titres' : 'Contenu',
    default: defaultValue,
    required: false,
    binding: selector
      ? { type: 'html_text', selector }
      : { type: 'unresolved', reason: 'Ancien champ texte sans sélecteur exploitable.' },
    source: { mode: 'auto_detected', confidence: selector ? 'high' : 'low', ambiguous: !selector },
  };
}

function canonicalDefault(value: unknown): string | number | boolean | null {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? value : null;
}

function canonicalBinding(value: unknown): AtoumWebComponentFieldBinding {
  if (!value || typeof value !== 'object') return { type: 'unresolved', reason: 'Binding absent.' };
  const binding = value as Record<string, unknown>;
  if (binding.type === 'html_text' && typeof binding.selector === 'string') return { type: 'html_text', selector: binding.selector };
  if (binding.type === 'html_html' && typeof binding.selector === 'string') return { type: 'html_html', selector: binding.selector };
  if (binding.type === 'html_attribute' && typeof binding.selector === 'string' && typeof binding.attribute === 'string') {
    return { type: 'html_attribute', selector: binding.selector, attribute: binding.attribute };
  }
  if (binding.type === 'css_variable' && typeof binding.name === 'string') {
    return { type: 'css_variable', name: binding.name, selector: typeof binding.selector === 'string' ? binding.selector : null };
  }
  if (binding.type === 'css_url' && typeof binding.token === 'string') return { type: 'css_url', token: binding.token };
  if (binding.type === 'unresolved' && typeof binding.reason === 'string') return { type: 'unresolved', reason: binding.reason };
  return { type: 'unresolved', reason: 'Binding non reconnu.' };
}

function canonicalValidation(value: unknown): AtoumWebComponentFieldValidation | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Record<string, unknown>;
  const validation: AtoumWebComponentFieldValidation = {};
  if (typeof input.minLength === 'number') validation.minLength = input.minLength;
  if (typeof input.maxLength === 'number') validation.maxLength = input.maxLength;
  if (typeof input.min === 'number') validation.min = input.min;
  if (typeof input.max === 'number') validation.max = input.max;
  if (typeof input.step === 'number') validation.step = input.step;
  if (typeof input.pattern === 'string') validation.pattern = input.pattern;
  if (Array.isArray(input.allowedMimeTypes)) validation.allowedMimeTypes = input.allowedMimeTypes.filter((item): item is string => typeof item === 'string');
  return Object.keys(validation).length ? validation : null;
}

function canonicalOptions(value: unknown): AtoumWebComponentFieldOption[] | null {
  if (!Array.isArray(value)) return null;
  const options = value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const option = entry as Record<string, unknown>;
    return typeof option.value === 'string' && typeof option.label === 'string'
      ? [{ value: option.value, label: option.label }]
      : [];
  });
  return options.length ? options : null;
}

function canonicalSource(value: unknown): AtoumWebComponentFieldSource {
  if (!value || typeof value !== 'object') return { mode: 'declared' };
  const source = value as Record<string, unknown>;
  const mode = source.mode === 'auto_detected' ? 'auto_detected' : 'declared';
  const confidence = source.confidence === 'high' || source.confidence === 'medium' || source.confidence === 'low'
    ? source.confidence
    : undefined;
  return {
    mode,
    ...(confidence ? { confidence } : {}),
    ...(typeof source.ambiguous === 'boolean' ? { ambiguous: source.ambiguous } : {}),
    ...(typeof source.note === 'string' ? { note: source.note } : {}),
  };
}
