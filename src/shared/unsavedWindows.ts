export interface UnsavedWindowState {
    epoch: string;
    revision: number;
    labels: string[];
    pending: boolean;
}
export type ExitTicket = Map<number, string>;
const signature = (state: UnsavedWindowState) => JSON.stringify([state.epoch, state.revision, state.labels, state.pending]);
export class UnsavedWindows {
    private states = new Map<number, UnsavedWindowState>();
    private approved = new Map<number, string>();
    constructor(private confirm: (labels: string[], pending: boolean, windowId?: number) => boolean) { }
    add(id: number) { this.states.set(id, { epoch: '', revision: -1, labels: [], pending: false }); }
    remove(id: number) { this.states.delete(id); this.approved.delete(id); }
    update(id: number, state: UnsavedWindowState) { const old = this.states.get(id); if (!old || state.epoch === old.epoch && state.revision < old.revision)
        return; this.states.set(id, { ...state, labels: [...state.labels] }); if (signature(old) !== signature(state))
        this.approved.delete(id); }
    state(id: number) { return this.states.get(id); }
    ticket(): ExitTicket { return new Map([...this.states].map(([id, state]) => [id, signature(state)])); }
    same(ticket: ExitTicket) { const current = this.ticket(); return ticket.size === current.size && [...ticket].every(([id, revision]) => current.get(id) === revision); }
    approveAll(): ExitTicket | null {
        const entries = [...this.states];
        const states = entries.map(([, state]) => state);
        const labels = [...new Set(states.flatMap(state => state.labels))];
        const pending = states.some(state => state.pending);
        // A previously confirmed, unchanged ticket also approves the guarded app.quit().
        // Any subsequent renderer edit invalidates its signature in update().
        const previouslyApproved = !pending && entries.every(
            ([id, state]) => !state.labels.length || this.approved.get(id) === signature(state),
        );
        if ((labels.length || pending) && !previouslyApproved && (!this.confirm(labels, pending) || pending))
            return null;
        return this.ticket();
    }
    approveOne(id: number) {
        const state = this.states.get(id);
        if (!state)
            return false;
        if (state.pending) {
            this.confirm(state.labels, true, id);
            return false;
        }
        if (this.approved.get(id) === signature(state) || !state.labels.length)
            return true;
        return this.confirm(state.labels, false, id);
    }
    refreshApproval(ticket: ExitTicket) { return this.same(ticket) ? ticket : this.approveAll(); }
    remember(ticket: ExitTicket) { for (const [id, revision] of ticket)
        if (this.states.has(id) && signature(this.states.get(id)!) === revision)
            this.approved.set(id, revision); }
}
export function isUnsavedWindowState(value: unknown): value is UnsavedWindowState {
    if (!value || typeof value !== 'object')
        return false;
    const state = value as UnsavedWindowState;
    return typeof state.epoch === 'string' && state.epoch.length > 0 && state.epoch.length <= 100 && Number.isSafeInteger(state.revision) && state.revision >= 0 && typeof state.pending === 'boolean' && Array.isArray(state.labels) && state.labels.length <= 40 && state.labels.every(label => typeof label === 'string' && label.length <= 160);
}
