export type ProspectInformationStatus = 'open' | 'resolved' | 'later';

export interface ProspectInformationItem {
  id: string;
  label: string;
  status: ProspectInformationStatus;
  isBlocking: boolean;
  answer?: string | null;
  resolvedAt?: string | null;
}

interface ProspectInformationPayload {
  version: 1;
  items: ProspectInformationItem[];
}

function validStatus(value: unknown): value is ProspectInformationStatus {
  return value === 'open' || value === 'resolved' || value === 'later';
}

export function parseProspectInformation(value?: string | null): ProspectInformationItem[] {
  const raw = value?.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Partial<ProspectInformationPayload>;
    if (parsed.version !== 1 || !Array.isArray(parsed.items)) throw new Error('legacy');
    return parsed.items.flatMap((item, index) => {
      if (!item || typeof item !== 'object' || typeof item.label !== 'string' || !item.label.trim()) return [];
      const status = validStatus(item.status) ? item.status : 'open';
      return [{
        id: typeof item.id === 'string' && item.id ? item.id : `info-${index}`,
        label: item.label.trim(),
        status,
        isBlocking: status === 'later' ? false : item.isBlocking !== false,
        answer: typeof item.answer === 'string' ? item.answer : null,
        resolvedAt: typeof item.resolvedAt === 'string' ? item.resolvedAt : null,
      }];
    });
  } catch {
    // Compatibilité avec l'ancien champ texte : on ne perd jamais la note existante.
    return [{ id: 'legacy-information', label: raw, status: 'open', isBlocking: true, answer: null, resolvedAt: null }];
  }
}

export function serializeProspectInformation(items: ProspectInformationItem[]): string | null {
  if (items.length === 0) return null;
  const payload: ProspectInformationPayload = { version: 1, items };
  return JSON.stringify(payload);
}

export function hasBlockingProspectInformation(value?: string | null): boolean {
  return parseProspectInformation(value).some((item) => item.status === 'open' && item.isBlocking);
}
