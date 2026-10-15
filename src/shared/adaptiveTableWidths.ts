export function adaptiveTableWidths(ids:readonly string[],available:number,saved:Readonly<Record<string,number>>):Record<string,number>{
 const result:Record<string,number>={},free=ids.filter(id=>saved[id]===undefined);
 const minimum=(id:string)=>id==='identity'?180:id==='open'?88:110;
 const fixed=ids.reduce((sum,id)=>sum+(saved[id]??0),0),minimumFree=free.reduce((sum,id)=>sum+minimum(id),0);
 const spare=Math.max(0,available-fixed-minimumFree);
 const weight=(id:string)=>id==='open'?0:id==='identity'?2:1,totalWeight=free.reduce((sum,id)=>sum+weight(id),0);
 for(const id of ids)result[id]=saved[id]??minimum(id)+(totalWeight?spare*weight(id)/totalWeight:0);
 return result;
}
