import {useEffect,useRef,useState} from 'react';
import type {SaveExitPrompt} from '../../shared/unsavedRegistry';
import {unsavedRegistry} from './unsaved';
export function UnsavedSaveDialog(){
 const [prompt,setPrompt]=useState<SaveExitPrompt|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>unsavedRegistry.presentSaveWith(p=>{setPrompt(p);setError('');setBusy(false);}),[]);
 useEffect(()=>{if(prompt)dialog.current?.showModal();else dialog.current?.close();},[prompt]);
 const stay=()=>{if(busy)return;prompt?.stay();setPrompt(null);};
 return <dialog ref={dialog} className="ot-dialog" aria-labelledby="ot-exit-title" onCancel={e=>{e.preventDefault();stay();}}><h2 id="ot-exit-title">Modifications non enregistrées</h2><p>Choisissez comment poursuivre cette navigation.</p><ul>{prompt?.labels.map((label,i)=><li key={i}>{label}</li>)}</ul><p>Chaque section garde sa sauvegarde propre. En cas d’échec, les sections déjà enregistrées le restent et les saisies non enregistrées sont conservées.</p>{prompt&&!prompt.canSave&&<p>Une section doit être enregistrée depuis son propre écran. Poursuivez l’édition pour la sauvegarder.</p>}{error&&<p role="alert">{error}</p>}<div className="ot-dialog-actions"><button autoFocus className="secondary-button" type="button" disabled={busy} onClick={stay}>Poursuivre l’édition</button><button className="secondary-button" type="button" disabled={busy} onClick={()=>{if(prompt?.discard())setPrompt(null);}}>Abandonner les modifications</button><button className="primary-button" type="button" disabled={busy||!prompt?.canSave} onClick={async()=>{if(!prompt)return;setBusy(true);const ok=await prompt.save();setBusy(false);if(ok)setPrompt(null);else setError('Enregistrement non confirmé. La navigation est arrêtée ; poursuivez l’édition pour corriger l’erreur ou résoudre le conflit.');}}>{busy?'Enregistrement…':'Enregistrer et poursuivre'}</button></div></dialog>;
}
