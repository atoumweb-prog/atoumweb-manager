export interface UnsavedEntry {
    id: string;
    group: string;
    label: string;
    dirty: boolean;
    pending: boolean;
    discard: () => void;
}
export class UnsavedRegistry {
    private entries = new Map<string, UnsavedEntry>();
    private listeners = new Set<() => void>();
    private asking = false;
    private revision = 0;
    private epoch = globalThis.crypto.randomUUID();
    subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
    private emit() { this.revision++; this.listeners.forEach(l => l()); }
    update(entry: UnsavedEntry) { this.entries.set(entry.id, entry); this.emit(); }
    remove(id: string) { this.entries.delete(id); this.emit(); }
    state() { const entries = this.active(); return { epoch: this.epoch, revision: this.revision, labels: [...new Set(entries.map(e => e.label))].slice(0, 40), pending: entries.some(e => e.pending) }; }
    active(group?: string | string[]) { return [...this.entries.values()].filter(e => (group === undefined || (Array.isArray(group) ? group.includes(e.id) : e.group === group || e.group.startsWith(group + '/'))) && (e.dirty || e.pending)); }
    request(run: () => void, confirm: (labels: string[], pending: boolean) => boolean, group?: string | string[]): boolean {
        const entries = this.active(group);
        if (!entries.length) {
            run();
            return true;
        }
        if (this.asking)
            return false;
        this.asking = true;
        let accepted = false;
        try {
            accepted = confirm([...new Set(entries.map(e => e.label))], entries.some(e => e.pending));
        }
        finally {
            this.asking = false;
        }
        if (!accepted || entries.some(e => e.pending))
            return false;
        entries.forEach(e => { e.discard(); this.entries.delete(e.id); });
        this.emit();
        run();
        return true;
    }
}
