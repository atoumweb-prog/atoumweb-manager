/** Empty is unspecified; undefined is invalid. French grouping and decimal punctuation accepted. */
export function parseEuroCents(value:string):number|null|undefined {
 const raw=value.trim().replace(/\s*€$/, '').trim();
 if(!raw)return null;
 if(!/^(?:\d+|\d{1,3}(?:[ \u00a0\u202f]\d{3})+)(?:[,.]\d{1,2})?$/.test(raw))return undefined;
 const cents=Math.round(Number(raw.replace(/[ \u00a0\u202f]/g,'').replace(',','.'))*100);
 return Number.isSafeInteger(cents)?cents:undefined;
}
