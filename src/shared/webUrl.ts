export function normalizeWebUrl(value?: string | null): string | null {
  const raw = value?.trim();
  if (!raw) return null;

  const candidate = /^https?:\/\//i.test(raw)
    ? raw
    : raw.startsWith('//')
      ? `https:${raw}`
      : `https://${raw}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error('Adresse web invalide.');
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('L’adresse web doit utiliser http:// ou https://.');
  }

  return url.toString();
}

export function displayWebUrl(value?: string | null): string {
  const raw = value?.trim() ?? '';
  return raw.replace(/^https:\/\//i, '').replace(/\/$/, '');
}
