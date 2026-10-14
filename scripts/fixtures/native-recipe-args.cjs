'use strict';
module.exports=args=>{
 const first=args[0]||'';
 const searchOnly=first==='--search-only',lot03b=first==='--lot03b';
 const lot09b=first==='--lot09b',lot09c=first==='--lot09c';
 const lot09d=first==='--lot09d',lot09e=first==='--lot09e',lot08a=first==='--lot08a';
 const direct=searchOnly||lot09b||lot09c||lot09d||lot09e||lot08a;
 const captureIndex=lot03b?1:0,capture=args[captureIndex]==='--captures';
 const valid=direct?args.length===1:lot03b?(args.length===1||(capture&&args.length===3)):(args.length===0||(capture&&args.length===2));
 if(!valid)throw Error('Usage: check-ux-v2-lot01a-real-ui.cjs [--search-only | --lot03b [--captures NEW-FOLDER] | --lot09b | --lot09c | --lot09d | --lot09e | --lot08a | --captures NEW-FOLDER]');
 return {searchOnly,lot03b,lot09b,lot09c,lot09d,lot09e,lot08a,captureFolder:capture?args[captureIndex+1]:null};
};
