export function draftFingerprint(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return `[${value.map(draftFingerprint).join(',')}]`;
  if (value !== null && typeof value === 'object') return `{${Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>`${JSON.stringify(key)}:${draftFingerprint(item)}`).join(',')}}`;
  return JSON.stringify(value);
}
const equal = (a: unknown,b: unknown) => draftFingerprint(a) === draftFingerprint(b);
const object = (v: unknown): v is Record<string,unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
export function mergeDraft<T>(base:T,local:T,remote:T): {value:T;conflicts:string[]} {
  const conflicts:string[]=[];
  function merge(b:unknown,l:unknown,r:unknown,path:string):unknown {
    if(equal(l,b))return r;
    if(equal(r,b)||equal(l,r))return l;
    if(object(b)&&object(l)&&object(r))return Object.fromEntries([...new Set([...Object.keys(b),...Object.keys(l),...Object.keys(r)])].map(k=>[k,merge(b[k],l[k],r[k],path?`${path}.${k}`:k)]));
    conflicts.push(path||'section');return l;
  }
  return {value:merge(base,local,remote,'') as T,conflicts};
}
export class DraftSection<T> {
  private initialized=false;
  private listeners=new Set<()=>void>();
  private state:{value:T;baseline:T;conflicts:string[]};
  constructor(initial:T){this.state={value:initial,baseline:initial,conflicts:[]};}
  snapshot=()=>this.state;
  subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
  private emit(){this.listeners.forEach(l=>l());}
  set(value:T|((current:T)=>T)){this.state={...this.state,value:typeof value==='function'?(value as (current:T)=>T)(this.state.value):value};this.emit();}
  receive(remote:T,submitted?:{value:T}){
    const result=this.initialized?mergeDraft(submitted?submitted.value:this.state.baseline,this.state.value,remote):{value:remote,conflicts:[]};
    this.initialized=true;this.state={value:result.value,baseline:remote,conflicts:result.conflicts};this.emit();
  }
  discard(){this.state={...this.state,value:this.state.baseline,conflicts:[]};this.emit();}
  get dirty(){return !equal(this.state.value,this.state.baseline);}
}
