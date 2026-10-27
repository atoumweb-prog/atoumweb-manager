/** Explicit user-click destinations only; never files, commands or custom protocols. */
export function prospectExternalUrl(value:unknown):string {
 if(typeof value!=='string'||!value||value.length>4096||/[\u0000-\u0020\u007f]/.test(value))throw new Error('Lien externe invalide.');
 if(/^mailto:/i.test(value)){
  const address=value.slice(7);
  if(!/^[^@\s?&#%]+@[^@\s?&#%]+\.[^@\s?&#%]+$/.test(address))throw new Error('Adresse email invalide.');
  return 'mailto:'+address;
 }
 const url=new URL(value);
 if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw new Error('Seuls les liens web et email sont autorisés.');
 return url.href;
}
