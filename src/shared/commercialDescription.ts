/** The customer-need prompt is not the sold description. Never replace customized copy. */
export function commercialDescription(description:string|null|undefined,snapshot:Record<string,unknown>|null|undefined):string {
  const cp=snapshot?.commercialParameters as Record<string,unknown>|null;
  const text=description?.trim()??'';
  if(!cp||text!==String(cp.clientNeed??'').trim())return text;
  const work=typeof cp.work==='string'?cp.work.trim():'';
  // Elliptic references require an authored catalogue version or explicit dossier scope.
  return work&&!/mêmes? .*mensuel/i.test(work)?work:'';
}
