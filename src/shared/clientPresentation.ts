import type { ActivityEvent } from './crm';

export const CLIENT_TABS = [
  ['summary', 'Résumé'], ['contacts', 'Contacts'], ['commercial', 'Commercial'],
  ['contracts', 'Contrats'], ['projects', 'Projets'], ['operations', 'Interventions'],
  ['documents', 'Documents'], ['history', 'Historique'],
] as const;
export type ClientTab = typeof CLIENT_TABS[number][0];

export function clientTabKey(current: ClientTab, key: string): ClientTab | null {
  const index = CLIENT_TABS.findIndex(([id]) => id === current);
  if (key === 'Home') return CLIENT_TABS[0][0];
  if (key === 'End') return CLIENT_TABS.at(-1)![0];
  if (key !== 'ArrowLeft' && key !== 'ArrowRight') return null;
  return CLIENT_TABS[(index + (key === 'ArrowRight' ? 1 : -1) + CLIENT_TABS.length) % CLIENT_TABS.length][0];
}

/** Same event may be returned by several identity timelines. Never invent an event. */
export function clientHistory(...sources: ActivityEvent[][]): ActivityEvent[] {
  return [...new Map(sources.flat().map(event => [event.id, event])).values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id));
}

export async function readClientSections<T extends Record<string, () => Promise<unknown>>>(sources: T) {
  const names = Object.keys(sources) as (keyof T)[];
  const results = await Promise.allSettled(names.map(name => Promise.resolve().then(sources[name])));
  const values: Partial<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> = {};
  const errors: Partial<Record<keyof T, string>> = {};
  results.forEach((result, index) => {
    const name = names[index];
    if (result.status === 'fulfilled') Object.assign(values, { [name]: result.value });
    else errors[name] = result.reason instanceof Error ? result.reason.message : String(result.reason);
  });
  return { values, errors };
}
