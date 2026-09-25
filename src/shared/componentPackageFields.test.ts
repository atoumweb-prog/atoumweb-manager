import { describe, expect, it } from 'vitest';
import { canonicalizeComponentFields } from './componentPackageFields';

describe('Component Fields Contract V1', () => {
  it('convertit les anciens champs texte, lien et image vers le contrat canonique', () => {
    const result = canonicalizeComponentFields([
      {
        id: 'title',
        type: 'text',
        label: 'Titre principal',
        selector: '[data-aw-field-text="title"]',
        defaultValue: 'Votre titre',
      },
      {
        id: 'cta-link',
        type: 'link',
        label: 'Lien 1',
        selector: '[data-aw-field-link="cta-link"]',
        defaultValue: '#',
      },
      {
        id: 'hero-image',
        type: 'image',
        label: 'Image 1',
        selector: '[data-aw-field-image="hero-image"]',
        defaultValue: 'Image de démonstration locale',
      },
    ]);

    expect(result.contract).toBe('atoumweb_component_fields');
    expect(result.schemaVersion).toBe(1);
    expect(result.fields).toHaveLength(3);
    expect(result.fields[0]).toMatchObject({
      id: 'title',
      type: 'text',
      binding: { type: 'html_text', selector: '[data-aw-field-text="title"]' },
      source: { mode: 'auto_detected', confidence: 'high', ambiguous: false },
    });
    expect(result.fields[1]).toMatchObject({
      id: 'cta-link',
      type: 'url',
      binding: { type: 'html_attribute', selector: '[data-aw-field-link="cta-link"]', attribute: 'href' },
    });
    expect(result.fields[2]).toMatchObject({
      id: 'hero-image',
      type: 'image',
      binding: { type: 'unresolved' },
    });
  });

  it('préserve un champ canonique déclaré avec variable CSS', () => {
    const result = canonicalizeComponentFields([
      {
        id: 'primary-color',
        type: 'color',
        label: 'Couleur principale',
        description: 'Couleur dominante du composant',
        group: 'Couleurs',
        default: '#071b3a',
        required: true,
        binding: {
          type: 'css_variable',
          name: '--aw-primary',
          selector: '.atoum-component',
        },
        validation: null,
        options: null,
        source: { mode: 'declared' },
      },
    ]);

    expect(result.fields[0]).toEqual({
      id: 'primary-color',
      type: 'color',
      label: 'Couleur principale',
      description: 'Couleur dominante du composant',
      group: 'Couleurs',
      default: '#071b3a',
      required: true,
      binding: {
        type: 'css_variable',
        name: '--aw-primary',
        selector: '.atoum-component',
      },
      validation: null,
      options: null,
      source: { mode: 'declared' },
    });
  });

  it('marque une ancienne image CSS comme détectée et ambiguë', () => {
    const result = canonicalizeComponentFields([
      {
        id: 'background-image',
        type: 'image',
        label: 'Image de fond',
        selector: 'css:url:background-image',
        defaultValue: 'Image de démonstration locale',
      },
    ]);

    expect(result.fields[0]).toMatchObject({
      type: 'image',
      binding: { type: 'css_url', token: 'background-image' },
      source: {
        mode: 'auto_detected',
        confidence: 'medium',
        ambiguous: true,
      },
    });
  });
});

describe('Cibles image V1', () => {
  it.each(['src', 'srcset'])('conserve la cible explicite %s', (attribute) => {
    const binding = { type: 'html_attribute', selector: '[data-aw-field-image="image-1"]', attribute };
    const [field] = canonicalizeComponentFields([{ id: 'image-1', type: 'image', label: 'Image',
      selector: binding.selector, defaultValue: '', binding }]).fields;
    expect(field.binding).toEqual(binding);
  });
  it('conserve unresolved pour une URL dans un style inline', () => {
    const binding = { type: 'unresolved', reason: 'URL dans style inline non représentable en V1.' };
    const [field] = canonicalizeComponentFields([{ id: 'image-1', type: 'image', label: 'Fond',
      selector: '[data-aw-field-image~="image-1"]', defaultValue: '', binding }]).fields;
    expect(field.binding).toEqual(binding);
    expect(field.source.ambiguous).toBe(true);
  });
  it('ne devine pas src pour une ancienne image sans attribut cible', () => {
    const [field] = canonicalizeComponentFields([{ id: 'image-1', type: 'image', label: 'Image responsive',
      selector: '[data-aw-field-image="image-1"]', defaultValue: '' }]).fields;
    expect(field.binding.type).toBe('unresolved');
    expect(field.source.ambiguous).toBe(true);
  });
});
