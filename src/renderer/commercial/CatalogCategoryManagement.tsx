import { useEffect, useMemo, useState } from 'react';
import type { CatalogItemSummary } from '../../shared/commercial';
import type { CatalogCategoryRecord, CatalogLegacyCategory } from '../../shared/catalogCategoryAdministration';
import { useUnsavedDraft, requestUnsavedExit } from '../unsaved/unsaved';

/**
 * E95 category mutations are always explicit and served by the checked SQLite engine.
 * Legacy values remain listed until the human explicitly reconciles exact item IDs.
 */
export function CatalogCategoryManagement({items,onChanged}: {
  items: readonly CatalogItemSummary[];
  onChanged: () => Promise<void>;
}) {
  const [categories,setCategories]=useState<CatalogCategoryRecord[]>([]);
  const [legacy,setLegacy]=useState<CatalogLegacyCategory[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [feedback,setFeedback]=useState('');
  const [busy,setBusy]=useState(false);
  const [createName,setCreateName]=useState('');
  const [renameId,setRenameId]=useState('');
  const [renameValue,setRenameValue]=useState('');
  const [confirmKey,setConfirmKey]=useState('');
  const [assignId,setAssignId]=useState('');
  const [assignTarget,setAssignTarget]=useState('');
  const [legacyRaw,setLegacyRaw]=useState('');
  const [legacyTarget,setLegacyTarget]=useState('');

  const createGuard=useUnsavedDraft('Nouvelle catégorie',createName,{
    group:'catalog:category-create',ready:true,pending:busy,discard:setCreateName,
  });
  const renameGuard=useUnsavedDraft('Renommer catégorie',renameValue,{
    group:'catalog:category-rename',ready:!!renameId,pending:busy,resetKey:renameId,
    discard:baseline=>{setRenameValue(baseline);setRenameId('');},
  });
  const currentItem=items.find(item=>item.id===assignId);
  const currentLegacy=legacy.find(x=>x.rawValue===legacyRaw);
  const available=useMemo(()=>categories.filter(c=>c.status==='active'),[categories]);

  async function reload() {
    // Individual failures are shown; neither list is erased because the other failed.
    const [a,b]=await Promise.allSettled([
      window.atoumweb.catalogCategories.list(),
      window.atoumweb.catalogCategories.listLegacy(),
    ]);
    const messages:string[]=[];
    if(a.status==='fulfilled')setCategories(a.value);else messages.push('Catégories : '+String(a.reason));
    if(b.status==='fulfilled')setLegacy(b.value);else messages.push('Références historiques : '+String(b.reason));
    setError(messages.join(' · '));
    setLoading(false);
  }

  useEffect(()=>{let alive=true;
    Promise.allSettled([
      window.atoumweb.catalogCategories.list(),
      window.atoumweb.catalogCategories.listLegacy(),
    ]).then(([a,b])=>{if(!alive)return;
      const errors:string[]=[];
      if(a.status==='fulfilled')setCategories(a.value);else errors.push(String(a.reason));
      if(b.status==='fulfilled')setLegacy(b.value);else errors.push(String(b.reason));
      setError(errors.join(' · '));setLoading(false);
    });
    return()=>{alive=false;};
  },[]);

  async function run(action:()=>Promise<unknown>,success:string){
    if(busy)return;
    setBusy(true);setError('');setFeedback('');
    try {
      await action();
      await onChanged();
      await reload();
      setConfirmKey('');
      setFeedback(success);
    }catch(e){setError(e instanceof Error?e.message:String(e));}
    finally{setBusy(false);}
  }

  const optionLabel=(category:CatalogCategoryRecord)=>
    `${category.name} · ${category.itemCount} prestation(s)${category.status==='archived'?' · Archivée':''}`;

  return (
    <section className="catalog-category-management" aria-label="Administrer les catégories">
      <div className="catalog-category-inventory-header">
        <div>
          <h3>Administrer les catégories</h3>
          <p className="muted">Opérations volontaires, historiques conservés. Aucun Devis ni version commerciale n’est modifié.</p>
        </div>
      </div>
      {loading && <p>Chargement des catégories…</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {feedback && <p role="status">{feedback}</p>}

      <form className="catalog-category-edit-row" onSubmit={event=>{
        event.preventDefault();
        void run(()=>window.atoumweb.catalogCategories.create(createName), 'Catégorie créée en brouillon administratif, sans affectation automatique.')
          .then(()=>{if(!error){setCreateName('');createGuard.saved('');}});
      }}>
        <label>Créer une catégorie métier
          <input value={createName} onChange={event=>setCreateName(event.target.value)}
            placeholder="Ex. Création de contenu" maxLength={80} required disabled={busy}/>
        </label>
        <button type="submit" className="primary-button" disabled={busy||!createName.trim()}>Créer la catégorie</button>
      </form>

      {categories.length>0 && <div className="catalog-category-admin-list">
        {categories.map(category=>(
          <div className="catalog-category-admin-item" key={category.id}>
            <div className="catalog-category-admin-title">
              <strong>{category.name}</strong>
              <span>{category.itemCount} prestation(s) · {category.status==='archived'?'Archivée':'Active'} · rév. {category.revision}</span>
            </div>
            {renameId===category.id ? (
              <form className="catalog-category-edit-row" onSubmit={event=>{
                event.preventDefault();
                void run(()=>window.atoumweb.catalogCategories.rename(category.id,renameValue,category.revision),
                  'Catégorie renommée ; les anciennes valeurs sont consignées.')
                  .then(()=>{renameGuard.saved(renameValue);setRenameId('');});
              }}>
                <label>Nouveau libellé
                  <input value={renameValue} onChange={event=>setRenameValue(event.target.value)}
                    maxLength={80} required disabled={busy}/>
                </label>
                <button type="submit" className="primary-button" disabled={busy||!renameValue.trim()}>Enregistrer</button>
                <button type="button" className="secondary-button" disabled={busy} onClick={()=>
                  renameGuard.request(()=>setRenameId(''))}>Annuler</button>
              </form>
            ) : (
              <div className="catalog-category-admin-actions">
                <button type="button" className="secondary-button" disabled={busy}
                  onClick={()=>requestUnsavedExit(()=>{setRenameId(category.id);setRenameValue(category.name);setConfirmKey('');},'catalog:category-rename')}>
                  Renommer
                </button>
                {confirmKey===`status:${category.id}` ? (
                  <>
                    <span>Confirmer {category.status==='active'?'l’archivage':'la restauration'} ?</span>
                    <button type="button" className="primary-button" disabled={busy} onClick={()=>void run(
                      ()=>window.atoumweb.catalogCategories.setStatus(category.id,
                        category.status==='active'?'archived':'active',category.revision),
                      'Statut de catégorie enregistré sans supprimer ses prestations.')}>Confirmer</button>
                    <button type="button" className="secondary-button" onClick={()=>setConfirmKey('')}>Annuler</button>
                  </>
                ) : (
                  <button type="button" className="secondary-button" disabled={busy}
                    onClick={()=>setConfirmKey(`status:${category.id}`)}>
                    {category.status==='active'?'Archiver':'Restaurer'}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>}

      <section className="catalog-category-operation">
        <h4>Réaffecter une prestation</h4>
        <p className="muted">Sélection explicite de la prestation et de la catégorie cible. Une modification concurrente sera refusée.</p>
        <div className="catalog-category-edit-row">
          <label>Prestation
            <select value={assignId} onChange={event=>{setAssignId(event.target.value);setConfirmKey('');}} disabled={busy}>
              <option value="">Choisir une prestation…</option>
              {[...items].sort((a,b)=>a.name.localeCompare(b.name,'fr-FR')).map(item=>(
                <option value={item.id} key={item.id}>{item.name} · {item.id.slice(0,8)}</option>
              ))}
            </select>
          </label>
          <label>Catégorie cible
            <select value={assignTarget} onChange={event=>{setAssignTarget(event.target.value);setConfirmKey('');}} disabled={busy}>
              <option value="">Sans catégorie</option>
              {available.map(c=><option value={c.id} key={c.id}>{optionLabel(c)}</option>)}
            </select>
          </label>
        </div>
        {currentItem && <p className="muted">Actuellement : {currentItem.category||'Sans catégorie'} · code technique inchangé</p>}
        {currentItem && (confirmKey==='assign' ? (
          <div className="catalog-category-admin-actions">
            <span>Confirmer la réaffectation de « {currentItem.name} » ?</span>
            <button type="button" className="primary-button" disabled={busy} onClick={()=>void run(
              ()=>window.atoumweb.catalogCategories.assign({
                itemId:currentItem.id,categoryId:assignTarget||null,
                expectedCategoryId:currentItem.categoryId??null,
                expectedRawValue:currentItem.category??null,
              }), 'Affectation enregistrée et historisée.')}>Confirmer</button>
            <button type="button" className="secondary-button" onClick={()=>setConfirmKey('')}>Annuler</button>
          </div>
        ) : (
          <button type="button" className="secondary-button" disabled={busy} onClick={()=>setConfirmKey('assign')}>
            Préparer la réaffectation
          </button>
        ))}
      </section>

      {legacy.length>0&&<section className="catalog-category-operation">
        <h4>Réconcilier une ancienne catégorie</h4>
        <p className="muted">Les identifiants concernés sont comparés avant écriture. Aucune fusion automatique d’alias.</p>
        <div className="catalog-category-edit-row">
          <label>Valeur historique exacte
            <select value={legacyRaw} onChange={event=>{setLegacyRaw(event.target.value);setConfirmKey('');}} disabled={busy}>
              <option value="">Choisir une ancienne catégorie…</option>
              {legacy.map(entry=><option value={entry.rawValue} key={entry.rawValue}>{entry.rawValue} · {entry.itemCount} prestation(s)</option>)}
            </select>
          </label>
          <label>Catégorie administrée cible
            <select value={legacyTarget} onChange={event=>{setLegacyTarget(event.target.value);setConfirmKey('');}} disabled={busy}>
              <option value="">Choisir une catégorie…</option>
              {available.map(c=><option value={c.id} key={c.id}>{optionLabel(c)}</option>)}
            </select>
          </label>
        </div>
        {currentLegacy&&legacyTarget&&(confirmKey==='reconcile' ? (
          <div className="catalog-category-admin-actions">
            <span>Confirmer le rattachement de {currentLegacy.itemCount} prestation(s) ?</span>
            <button type="button" className="primary-button" disabled={busy} onClick={()=>void run(
              ()=>window.atoumweb.catalogCategories.reconcileLegacy(
                currentLegacy.rawValue,legacyTarget,currentLegacy.itemIds),
              'Ancienne catégorie rattachée avec conservation de la provenance.')}>Confirmer</button>
            <button type="button" className="secondary-button" onClick={()=>setConfirmKey('')}>Annuler</button>
          </div>
        ) : (
          <button className="secondary-button" type="button" disabled={busy}
            onClick={()=>setConfirmKey('reconcile')}>Préparer la réconciliation</button>
        ))}
      </section>}
    </section>
  );
}
