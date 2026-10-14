'use strict';
module.exports=args=>{
 const searchOnly=args[0]==='--search-only',lot03b=args[0]==='--lot03b',lot09b=args[0]==='--lot09b';
 const captureIndex=lot03b?1:0,capture=args[captureIndex]==='--captures';
 const valid=searchOnly||lot09b?args.length===1:lot03b?(args.length===1||(capture&&args.length===3)):(args.length===0||(capture&&args.length===2));
 if(!valid)throw Error('Usage: node scripts/check-ux-v2-lot01a-real-ui.cjs [--search-only | --lot03b [--captures NEW-ABSOLUTE-FOLDER] | --lot09b | --captures NEW-ABSOLUTE-FOLDER]');
 return {searchOnly,lot03b,lot09b,captureFolder:capture?args[captureIndex+1]:null};
};
