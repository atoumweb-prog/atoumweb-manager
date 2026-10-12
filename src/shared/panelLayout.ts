export interface PanelLayoutPreference { version: 1; listPercent: number }
export interface VisualPreferenceStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export function layoutKey(module: string, view: string) {
  return `atoumweb:layout:${encodeURIComponent(module)}:${encodeURIComponent(view)}:v1`;
}
export function boundedSplit(percent: number, width: number, fallback = 60) {
  const value = Number.isFinite(percent) ? percent : fallback;
  if (width < 760) return Math.max(20, Math.min(80, value));
  return Math.max(240 / width * 100, Math.min((width - 330) / width * 100, value));
}
export function readLayout(store: VisualPreferenceStore, key: string, fallback: number): number {
  const raw = store.getItem(key);
  if (raw === null) return fallback;
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object') throw new Error('Préférence de disposition invalide.');
  const data = value as Record<string, unknown>;
  // Migration of this visual format only; never of a business database.
  const percent = data.version === 1 ? data.listPercent : data.version === 0 ? data.percent : null;
  if (typeof percent !== 'number' || !Number.isFinite(percent) || percent < 20 || percent > 80)
    throw new Error('Préférence de disposition incompatible.');
  return percent;
}
export function writeLayout(store: VisualPreferenceStore, key: string, percent: number) {
  const value: PanelLayoutPreference = { version: 1, listPercent: boundedSplit(percent, 0) };
  store.setItem(key, JSON.stringify(value));
}
