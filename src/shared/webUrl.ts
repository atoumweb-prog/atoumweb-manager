export function normalizeWebUrl(value?: string | null): string | null {
  const raw = value?.trim();
  if (!raw) return null;

  const explicitScheme = raw.match(/^([a-z][a-z0-9+.-]*):\/\//i);
  if (explicitScheme && !/^https?$/i.test(explicitScheme[1])) {
    throw new Error('L’adresse web doit utiliser http:// ou https://.');
  }

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
