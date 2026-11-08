import {useState} from 'react';
import type {CatalogVersion,CatalogVersionInput} from '../../shared/commercial';
import {compareCatalogVersions} from '../../shared/catalogVersionReview';
export function CatalogConflictResolver({remote,local,onResolve}:{remote:CatalogVersion;local:CatalogVersionInput;onResolve:(payload:CatalogVersionInput)=>void}){
 const differences=compareCatalogVersions(remote,{...remote,...local}),[choices,setChoices]=useState<Record<string,'local'|'remote'>>({});
 const blocked=remote.status!=='draft'||!!remote.abandonedAt;
 return <section className="ot-editor-notice ot-conflict" role="alert"><h3>Résoudre le conflit · révision {remote.saveRevision??0}</h3><p>Choisissez les valeurs à conserver. Les listes et blocs structurés sont choisis en entier ; aucune fusion automatique. L’enregistrement restera une action séparée.</p>
 {blocked&&<p>La version n’est plus un brouillon opérationnel. La saisie locale reste disponible, mais cette version ne peut pas être réécrite.</p>}
 {differences.map(d=><fieldset key={d.field} data-conflict-field={d.field}><legend>{d.label}</legend><label><input type="radio" name={'conflict-'+d.field} checked={choices[d.field]==='remote'} onChange={()=>setChoices(c=>({...c,[d.field]:'remote'}))}/>Version enregistrée : {d.previous}</label><label><input type="radio" name={'conflict-'+d.field} checked={choices[d.field]==='local'} onChange={()=>setChoices(c=>({...c,[d.field]:'local'}))}/>Ma saisie : {d.proposed}</label></fieldset>)}
 <button type="button" className="secondary-button" disabled={blocked||differences.some(d=>!choices[d.field])} onClick={()=>{const payload={...local};for(const d of differences)if(choices[d.field]==='remote')Object.assign(payload,{[d.field]:remote[d.field as keyof CatalogVersionInput]});onResolve(payload);}}>Appliquer mes choix à la saisie</button></section>;
}
