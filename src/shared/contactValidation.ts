export interface ContactValidationResult {
  valid: boolean;
  normalized: string;
  display: string;
  message?: string;
}

export function validateEmail(value?: string | null): ContactValidationResult {
  const normalized = (value ?? '').trim().toLocaleLowerCase('fr-FR');
  if (!normalized) return { valid: true, normalized: '', display: '' };
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(normalized);
  return valid
    ? { valid: true, normalized, display: normalized }
    : { valid: false, normalized, display: normalized, message: 'Saisis une adresse email complète, par exemple contact@entreprise.fr.' };
}

export function validatePhone(value?: string | null): ContactValidationResult {
  const raw = (value ?? '').trim();
  if (!raw) return { valid: true, normalized: '', display: '' };
  if (/[A-Za-z]/u.test(raw)) return { valid: false, normalized: raw, display: raw, message: 'Le numéro de téléphone ne peut pas contenir de lettres.' };

  const compact = raw.replace(/[\s.()\-/]/g, '');
  if (compact.startsWith('+')) {
    const digits = compact.slice(1);
    if (!/^\d{8,15}$/u.test(digits)) return { valid: false, normalized: compact, display: raw, message: 'Saisis un numéro international valide avec + et l’indicatif pays.' };
    const normalized = `+${digits}`;
    return { valid: true, normalized, display: formatInternationalPhone(normalized) };
  }

  if (!/^0\d{9}$/u.test(compact)) {
    return { valid: false, normalized: compact, display: raw, message: 'En France, saisis 10 chiffres commençant par 0, ou utilise + pour un numéro international.' };
  }
  return { valid: true, normalized: compact, display: compact.replace(/(\d{2})(?=\d)/g, '$1 ').trim() };
}

export function normalizeEmail(value?: string | null): string | null {
  const result = validateEmail(value);
  if (!result.valid) throw new Error(result.message);
  return result.normalized || null;
}

export function normalizePhone(value?: string | null): string | null {
  const result = validatePhone(value);
  if (!result.valid) throw new Error(result.message);
  return result.normalized || null;
}

export function formatPhone(value?: string | null): string {
  const result = validatePhone(value);
  return result.valid ? result.display : (value ?? '');
}

function formatInternationalPhone(value: string): string {
  if (value.startsWith('+33') && value.length === 12) {
    const national = value.slice(3);
    return `+33 ${national.slice(0, 1)} ${national.slice(1).replace(/(\d{2})(?=\d)/g, '$1 ').trim()}`;
  }
  return value;
}
