import { describe, expect, it } from 'vitest';
import { formatPhone, normalizeEmail, normalizePhone, validateEmail, validatePhone } from './contactValidation';

describe('validation des coordonnées', () => {
  it('normalise les emails et refuse les formats incomplets', () => {
    expect(validateEmail(' Contact@Fine-Bouche.FR ')).toMatchObject({ valid: true, normalized: 'contact@fine-bouche.fr' });
    expect(validateEmail('test').valid).toBe(false);
    expect(validateEmail('test@').valid).toBe(false);
    expect(validateEmail('@gmail.com').valid).toBe(false);
    expect(normalizeEmail('CONTACT@EXAMPLE.FR')).toBe('contact@example.fr');
  });

  it('accepte les numéros français avec ou sans séparateurs et les affiche lisiblement', () => {
    expect(validatePhone('06 12 34 56 78')).toMatchObject({ valid: true, normalized: '0612345678', display: '06 12 34 56 78' });
    expect(validatePhone('03.80.12.34.56')).toMatchObject({ valid: true, normalized: '0380123456' });
    expect(normalizePhone('01-23-45-67-89')).toBe('0123456789');
  });

  it('accepte l’international et refuse lettres et longueurs incohérentes', () => {
    expect(validatePhone('+33 6 12 34 56 78').valid).toBe(true);
    expect(formatPhone('+33612345678')).toBe('+33 6 12 34 56 78');
    expect(validatePhone('06ABC45678').valid).toBe(false);
    expect(validatePhone('061234').valid).toBe(false);
    expect(validatePhone('+3312').valid).toBe(false);
  });
});
