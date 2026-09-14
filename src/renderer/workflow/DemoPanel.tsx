import {useEffect,useState} from 'react';
import type {DemoSummary} from '../../shared/workflow';
import {changed,openEntity} from './DossierPanel';
export function DemoPanel(){
  const [summary,setSummary]=useState<DemoSummary>({counts:[],total:0}),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const load=()=>window.atoumweb.workflow.demoSummary().then(setSummary);
  useEffect(()=>{void load().catch(e=>setMessage(String(e)));},[]);
  async function create(scenario:'vitrine'|'ecommerce'|'maintenance'){setBusy(true);try{const result=await window.atoumweb.workflow.createDemo(scenario);await load();changed();setMessage('Parcours test créé et marqué demo.');openEntity({entityType:'project',entityId:result.projectId,title:'Projet de démonstration'});}catch(e){setMessage(String(e));}finally{setBusy(false);}}
  async function reset(){setBusy(true);try{const result=await window.atoumweb.workflow.resetDemo();await load();changed();setMessage(result.cancelled?'Réinitialisation annulée.':`${result.deleted} enregistrements demo supprimés. Sauvegarde : ${result.backupPath}`);}catch(e){setMessage(String(e));}finally{setBusy(false);}}
  return <section className="panel workflow-demo"><h2>Données de démonstration</h2><p>Les parcours créés ici et leurs nouveaux éléments liés sont marqués demo. Utilisez des dossiers distincts pour vos données réelles. Le catalogue, les prix et les modèles sont conservés au reset.</p><div className="workflow-row">{(['vitrine','ecommerce','maintenance'] as const).map(s=><button key={s} className="secondary-button" type="button" disabled={busy} onClick={()=>void create(s)}>Créer un parcours test complet — {s}</button>)}</div><p>{summary.total} enregistrements de test</p><details><summary>Voir les données à supprimer</summary><ul>{summary.counts.map(c=><li key={c.table}>{c.table} : {c.count}</li>)}</ul></details><button className="danger-button" type="button" disabled={busy||summary.total===0} onClick={()=>void reset()}>Réinitialiser les données de test</button><p role="status">{message}</p><p className="muted">Confirmation et sauvegarde SQLite obligatoires. Les fichiers physiques restent conservés.</p></section>;
}
