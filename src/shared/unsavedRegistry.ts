export interface UnsavedEntry {
    id: string;
    group: string;
    label: string;
    dirty: boolean;
    pending: boolean;
    discard: () => void;
    save?: () => Promise<boolean>;
    savePriority?:number;
}
export interface SaveExitPrompt {labels:string[];canSave:boolean;save:()=>Promise<boolean>;discard:()=>boolean;stay:()=>void;}
export class UnsavedRegistry {
    private savePresenter?: (prompt:SaveExitPrompt)=>void;
    presentSaveWith(presenter:(prompt:SaveExitPrompt)=>void){this.savePresenter=presenter;return()=>{if(this.savePresenter===presenter){this.savePresenter=undefined;this.asking=false;}};}
    markSaved(id:string,pending=false){const entry=this.entries.get(id);if(entry){this.entries.set(id,{...entry,dirty:false,pending});this.emit();}}
    private entries = new Map<string, UnsavedEntry>();
    private listeners = new Set<() => void>();
    private asking = false;
    private revision = 0;
    private epoch = globalThis.crypto.randomUUID();
    subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
    private emit() { this.revision++; this.listeners.forEach(l => l()); }
    update(entry: UnsavedEntry) { this.entries.set(entry.id, entry); this.emit(); }
    remove(id: string) { this.entries.delete(id); this.emit(); }
    state() { const entries = this.active(); return { epoch: this.epoch, revision: this.revision, labels: [...new Set(entries.map(e => e.label))].slice(0, 40), pending: entries.some(e => e.pending),saveAvailable:entries.some(e=>!!e.save) }; }
    active(group?: string | string[]) { return [...this.entries.values()].filter(e => (group === undefined || (Array.isArray(group) ? group.includes(e.id) : e.group === group || e.group.startsWith(group + '/'))) && (e.dirty || e.pending)); }
    request(run: () => void, confirm: (labels: string[], pending: boolean) => boolean, group?: string | string[]): boolean {
        const entries = this.active(group);
        if (!entries.length) {
            run();
            return true;
        }
        if (this.asking)
            return false;
        if(this.savePresenter&&entries.some(e=>e.save)&&!entries.some(e=>e.pending)){
            this.asking=true;
            const finish=()=>{this.asking=false;run();return true;};
            this.savePresenter({labels:entries.map(e=>e.label),canSave:entries.every(e=>!!e.save),stay:()=>{this.asking=false;},
                discard:()=>{const active=this.active(group);if(active.some(e=>e.pending))return false;active.forEach(e=>{e.discard();this.entries.delete(e.id);});this.emit();return finish();},
                save:async()=>{if(!entries.every(e=>!!e.save))return false;try{for(const e of [...entries].sort((a,b)=>(a.savePriority??0)-(b.savePriority??0))){if(!this.active(group).some(current=>current.id===e.id))continue;if(!await e.save!())return false;}if(this.active(group).length)return false;return finish();}catch{return false;}}
            });
            return false;
        }
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
