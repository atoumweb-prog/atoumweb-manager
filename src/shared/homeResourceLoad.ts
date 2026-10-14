/** Read-only aggregation; existing IPC remains the source of every value. */
export type ResourceState<T>={value?:T;status:'loading'|'ready'|'error';loadedAt:string|null;error:string|null};
export type ResourceSnapshot<T>={[K in keyof T]:ResourceState<T[K]>};
export class HomeResourceLoad<T extends object>{
 private sequence=0;
 private state={} as ResourceSnapshot<T>;
 invalidate(){this.sequence++;}
 snapshot(){return this.state;}
 async load(readers:{[K in keyof T]:()=>Promise<T[K]>},publish:(state:ResourceSnapshot<T>)=>void){
  const sequence=++this.sequence,keys=Object.keys(readers) as (keyof T)[];
  this.state=Object.fromEntries(keys.map(key=>[key,{...this.state[key],status:'loading',error:null,loadedAt:this.state[key]?.loadedAt??null}])) as ResourceSnapshot<T>;
  publish(this.state);
  await Promise.all(keys.map(async key=>{
   try{
    const value=await readers[key]();if(sequence!==this.sequence)return;
    this.state={...this.state,[key]:{value,status:'ready',error:null,loadedAt:new Date().toISOString()}};
   }catch(error){
    if(sequence!==this.sequence)return;
    this.state={...this.state,[key]:{...this.state[key],status:'error',error:error instanceof Error?error.message:String(error)}};
   }
   publish(this.state);
  }));
 }
}
