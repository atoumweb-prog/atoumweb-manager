import {useEffect,useState} from 'react';
import type {CatalogItemDetail,CatalogProductionBlueprintLink} from '../../shared/commercial';

/** Production is a versioned reference, never a command to create a Project. */
export function CatalogProductionPanel({item}:{item:CatalogItemDetail}) {
  const initial=item.versions.find(v=>v.status==='draft')?.id??item.currentVersion?.id??item.versions[0]?.id??'';
  const [versionId,setVersionId]=useState(initial);
  const [links,setLinks]=useState<CatalogProductionBlueprintLink[]>([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  useEffect(()=>{
    if(!item.versions.some(v=>v.id===versionId))setVersionId(initial);
  },[item.id,initial,versionId,item.versions]);
  useEffect(()=>{
    let live=true;
    setLoading(true);setError('');setLinks([]);
    if(!versionId){setLoading(false);return;}
    window.atoumweb.catalog.listProductionBlueprints(versionId).then(rows=>{
      if(live)setLinks(rows);
    }).catch(err=>{
      if(live)setError(err instanceof Error?err.message:String(err));
    }).finally(()=>{if(live)setLoading(false);});
    return()=>{live=false;};
  },[versionId,item.id]);

  return <section className="catalog-detail-section catalog-production-panel" role="region" aria-label="Production de la prestation">
    <h3>Préparation de production</h3>
    <p className="muted">Liens de blueprints réellement enregistrés pour la version sélectionnée. La consultation ne génère aucune tâche, aucun Site et aucun Projet.</p>
    <label>Version pour la production
      <select value={versionId} onChange={e=>setVersionId(e.target.value)} aria-label="Version Catalogue de production">
        {item.versions.map(v=><option key={v.id} value={v.id}>v{v.versionNumber} — {v.status==='draft'?'Brouillon':v.status==='published'?'Publiée':'Retirée'}</option>)}
      </select>
    </label>
    {loading ? <p role="status">Chargement des blueprints…</p> :
      error ? <p role="alert">Blueprints indisponibles : {error}</p> :
      links.length ? <ul>{links.map(link=><li key={link.id}>
        <strong>{link.templateName}</strong> · v{link.versionNumber} · {link.role==='base'?'Base':'Complément'} · {link.templateStatus}
        <small> · quantité : {link.quantityMode} · site : {link.siteMode}</small>
      </li>)}</ul> :
      <p>Aucun blueprint lié à cette version. Ce n'est pas forcément une anomalie : la production dépend de la prestation vendue.</p>}
    <p className="muted">La configuration des modèles se fait dans la bibliothèque de production existante ; seule une création de Projet explicitement confirmée depuis le Devis déclenche une préparation opérationnelle.</p>
  </section>;
}
