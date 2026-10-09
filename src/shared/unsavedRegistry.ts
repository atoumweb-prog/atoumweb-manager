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
    subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
    private emit() {  this.listeners.forEach(l => l()); }
    update(entry: UnsavedEntry) { this.entries.set(entry.id, entry); this.emit(); }
    remove(id: string) { this.entries.delete(id); this.emit(); }
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
