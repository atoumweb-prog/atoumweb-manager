import {useState} from 'react';
import source from '../../../data/approved/2026-11-08/REFERENTIEL_METIER_V15_EXTRAIT_WORD.json';

/** Read-only business reference; this panel never imports or activates a database. */
export function ApprovedPackReference(){
 const [query,setQuery]=useState('');
 const blocks=source.blocs_dans_ordre_paragraphes_puis_tableaux.map((b)=>'texte' in b?b.texte??'':b.lignes?.map(row=>row.join(' · ')).join('\n')??'');
 const filtered=blocks.filter(text=>text.toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr')));
 return <details className="catalog-detail-section" data-approved-pack-reference><summary>Référence métier approuvée — V3.9.4 / V1.5 du 8 novembre 2026</summary>
  <p>130 références commerciales · 119 clauses · rectificatif 019. Approbation métier interne, sans publication ni certification de conformité légale.</p>
  <p>Les 47 tarifs retenus sur délégation conservent leur statut. RC Pro et convention de médiation : aucune couverture ni convention active attestée par ce pack. Les contrôles restant à satisfaire restent distincts.</p>
  <label>Rechercher dans le référentiel métier <input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="CL-01, maintenance, rétractation…"/></label>
  <p role="status">{filtered.length} blocs · {Math.min(filtered.length,50)} affichés. Affiner la recherche pour consulter les autres.</p>
  {filtered.slice(0,50).map((text,i)=><p key={i} style={{whiteSpace:'pre-line',overflowWrap:'anywhere'}}>{text}</p>)}
 </details>;
}
